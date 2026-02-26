/**
 * Server-Side Cache Utility (Next.js Route Handlers / Server Components)
 *
 * Priority chain:
 *   Memcached (L1)  →  Redis (L2)  →  In-Process Memory (L3)
 *
 * This module must only be imported in server-side code.
 * All layers are optional and controlled by environment variables:
 *
 *   MEMCACHED_ENABLED=true/false
 *   MEMCACHED_SERVERS=127.0.0.1:11211
 *   MEMCACHED_KEY_PREFIX=infi:fe:
 *   MEMCACHED_LIFETIME=300
 *
 *   REDIS_ENABLED=true/false
 *   REDIS_HOST=127.0.0.1
 *   REDIS_PORT=6379
 *   REDIS_KEY_PREFIX=infi:fe:
 */

// Ensure this module only runs server-side
if (typeof window !== 'undefined') {
    throw new Error('server-cache.ts must only be imported in server-side code.');
}

import memjs from 'memjs';
import Redis from 'ioredis';

// ─── Config (read directly from process.env for server-only access) ───────────

const cfg = {
    memcached: {
        enabled: process.env.MEMCACHED_ENABLED === 'true',
        servers: process.env.MEMCACHED_SERVERS || '127.0.0.1:11211',
        keyPrefix: process.env.MEMCACHED_KEY_PREFIX || 'infi:fe:',
        lifetime: parseInt(process.env.MEMCACHED_LIFETIME || '300', 10),
    },
    redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'infi:fe:',
    },
};

// ─── In-Process Memory (L3) ──────────────────────────────────────────────────

interface MemoryEntry { value: string; expiry: number }
const memoryStore = new Map<string, MemoryEntry>();

function memGet(key: string): string | null {
    const e = memoryStore.get(key);
    if (!e) return null;
    if (Date.now() > e.expiry) { memoryStore.delete(key); return null; }
    return e.value;
}

function memSet(key: string, value: string, ttl: number): void {
    memoryStore.set(key, { value, expiry: Date.now() + ttl * 1000 });
}

// ─── Lazy Singletons ──────────────────────────────────────────────────────────

let _memcached: memjs.Client | null = null;
let _memcachedOk = false;

let _redis: Redis | null = null;
let _redisOk = false;

let _initialized = false;

function initOnce(): void {
    if (_initialized) return;
    _initialized = true;

    // Memcached
    if (cfg.memcached.enabled) {
        try {
            _memcached = memjs.Client.create(cfg.memcached.servers, {
                expires: cfg.memcached.lifetime,
                retries: 2,
                timeout: 500,
                failover: true,
            });
            _memcached.set(
                `${cfg.memcached.keyPrefix}__health__`,
                Buffer.from('1'),
                { expires: 5 },
                (err) => {
                    _memcachedOk = !err;
                    if (!err) console.log('[FE Cache] Memcached connected');
                    else console.warn('[FE Cache] Memcached unavailable –', err.message);
                }
            );
        } catch (e: any) {
            console.warn('[FE Cache] Memcached init failed –', e.message);
        }
    }

    // Redis
    if (cfg.redis.enabled) {
        try {
            _redis = new Redis({
                host: cfg.redis.host,
                port: cfg.redis.port,
                password: cfg.redis.password,
                db: cfg.redis.db,
                keyPrefix: cfg.redis.keyPrefix,
                retryStrategy: (t) => (t > 3 ? null : Math.min(t * 100, 3000)),
                lazyConnect: true,
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
            });
            _redis.on('ready', () => { _redisOk = true; console.log('[FE Cache] Redis connected'); });
            _redis.on('error', () => { _redisOk = false; });
            _redis.on('close', () => { _redisOk = false; });
            _redis.connect().catch(() => { _redisOk = false; });
        } catch (e: any) {
            console.warn('[FE Cache] Redis init failed –', e.message);
        }
    }
}

// ─── Public helpers ───────────────────────────────────────────────────────────

async function getRaw(key: string): Promise<string | null> {
    initOnce();

    // L1: Memcached
    if (cfg.memcached.enabled && _memcachedOk && _memcached) {
        try {
            const val = await new Promise<Buffer | null>((resolve) =>
                _memcached!.get(`${cfg.memcached.keyPrefix}${key}`, (err, v) => resolve(err ? null : v))
            );
            if (val !== null) return val.toString('utf8');
        } catch { /* fall through */ }
    }

    // L2: Redis
    if (cfg.redis.enabled && _redisOk && _redis) {
        try {
            const val = await _redis.get(key);
            if (val !== null) {
                // Backfill Memcached
                if (cfg.memcached.enabled && _memcachedOk && _memcached) {
                    const ttl = await _redis.ttl(key);
                    _memcached.set(
                        `${cfg.memcached.keyPrefix}${key}`,
                        Buffer.from(val),
                        { expires: ttl > 0 ? ttl : cfg.memcached.lifetime },
                        () => { }
                    );
                }
                return val;
            }
        } catch { /* fall through */ }
    }

    // L3: Memory
    return memGet(key);
}

async function setRaw(key: string, value: string, ttl: number): Promise<void> {
    initOnce();
    const writes: Promise<any>[] = [];

    if (cfg.memcached.enabled && _memcachedOk && _memcached) {
        writes.push(new Promise<void>((resolve) =>
            _memcached!.set(
                `${cfg.memcached.keyPrefix}${key}`,
                Buffer.from(value),
                { expires: ttl },
                () => resolve()
            )
        ));
    }

    if (cfg.redis.enabled && _redisOk && _redis) {
        writes.push(_redis.setex(key, ttl, value).catch(() => { }));
    }

    await Promise.all(writes);
    memSet(key, value, ttl); // always update memory for fastest subsequent reads
}

// ─── Exported API ─────────────────────────────────────────────────────────────

/**
 * GET a cached value.
 * Returns null on miss or deserialization error.
 */
export async function serverCacheGet<T>(key: string): Promise<T | null> {
    const raw = await getRaw(key);
    if (raw === null) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
}

/**
 * SET a value in cache.
 * @param ttl Time-to-live in seconds (default: 300 = 5 min)
 */
export async function serverCacheSet<T>(key: string, value: T, ttl = 300): Promise<void> {
    await setRaw(key, JSON.stringify(value), ttl);
}

/**
 * DELETE a key from all cache layers.
 */
export async function serverCacheDelete(key: string): Promise<void> {
    initOnce();
    const deletes: Promise<any>[] = [];

    if (cfg.memcached.enabled && _memcachedOk && _memcached) {
        deletes.push(new Promise<void>((resolve) =>
            _memcached!.delete(`${cfg.memcached.keyPrefix}${key}`, () => resolve())
        ));
    }

    if (cfg.redis.enabled && _redisOk && _redis) {
        deletes.push(_redis.del(key).catch(() => { }));
    }

    await Promise.all(deletes);
    memoryStore.delete(key);
}

/**
 * STATS — for debugging / health checks.
 */
export function serverCacheStats() {
    return {
        backend: cfg.memcached.enabled && _memcachedOk ? 'memcached'
            : cfg.redis.enabled && _redisOk ? 'redis'
                : 'memory',
        memcached: { enabled: cfg.memcached.enabled, connected: _memcachedOk },
        redis: { enabled: cfg.redis.enabled, connected: _redisOk },
        memory: { size: memoryStore.size },
    };
}
