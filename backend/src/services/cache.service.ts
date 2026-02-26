/**
 * Unified Cache Service
 *
 * Priority chain:
 *   Memcached (L1, ~0.1ms)  →  Redis (L2, ~0.5ms)  →  In-Memory (L3)
 *
 * Each layer is independently toggled via environment variables:
 *   MEMCACHED_ENABLED=true/false
 *   REDIS_ENABLED=true/false
 *
 * If both are disabled the service uses an in-process Map (same behaviour
 * as the original redis.service.ts fallback).
 */

import memjs from 'memjs';
import Redis from 'ioredis';
import { config } from '../config';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemoryEntry {
    value: string;
    expiry: number; // epoch ms
}

interface CacheStats {
    memcached: { enabled: boolean; connected: boolean };
    redis: { enabled: boolean; connected: boolean };
    memory: { size: number };
    backend: 'memcached' | 'redis' | 'memory';
}

// ─── CacheService ────────────────────────────────────────────────────────────

class CacheService {
    private memcachedClient: memjs.Client | null = null;
    private redisClient: Redis | null = null;

    private memcachedConnected = false;
    private redisConnected = false;

    /** In-process fallback (L3) */
    private memoryStore = new Map<string, MemoryEntry>();

    constructor() {
        if (config.memcached.enabled) this.initMemcached();
        if (config.redis.enabled) this.initRedis();
    }

    // ─── Initialisation ──────────────────────────────────────────────────────

    private initMemcached(): void {
        try {
            this.memcachedClient = memjs.Client.create(config.memcached.servers, {
                expires: config.memcached.lifetime,
                retries: 2,
                timeout: 500, // ms per operation
                failover: true,
            });

            // memjs has no explicit connection event; test with a noop set
            this.memcachedClient.set(
                `${config.memcached.keyPrefix}__health__`,
                Buffer.from('1'),
                { expires: 5 },
                (err) => {
                    if (err) {
                        console.warn('Cache: Memcached health-check failed –', err.message);
                        this.memcachedConnected = false;
                    } else {
                        this.memcachedConnected = true;
                        console.log('Cache: Memcached connected');
                    }
                }
            );
        } catch (err: any) {
            console.warn('Cache: Memcached init failed –', err.message);
            this.memcachedConnected = false;
        }
    }

    private initRedis(): void {
        try {
            this.redisClient = new Redis({
                host: config.redis.host,
                port: config.redis.port,
                password: config.redis.password || undefined,
                db: config.redis.db,
                keyPrefix: config.redis.keyPrefix,
                retryStrategy: (times) => {
                    if (times > 3) {
                        console.warn('Cache: Redis max retries reached, using lower layer');
                        return null;
                    }
                    return Math.min(times * 100, 3000);
                },
                lazyConnect: true,
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
            });

            this.redisClient.on('ready', () => {
                this.redisConnected = true;
                console.log('Cache: Redis connected');
            });
            this.redisClient.on('error', (err) => {
                console.error('Cache: Redis error –', err.message);
                this.redisConnected = false;
            });
            this.redisClient.on('close', () => { this.redisConnected = false; });

            this.redisClient.connect().catch((err) => {
                console.warn('Cache: Redis initial connect failed –', err.message);
                this.redisConnected = false;
            });
        } catch (err: any) {
            console.warn('Cache: Redis init failed –', err.message);
            this.redisConnected = false;
        }
    }

    // ─── Availability helpers ─────────────────────────────────────────────────

    private get memcachedOk(): boolean {
        return config.memcached.enabled && this.memcachedConnected && this.memcachedClient !== null;
    }

    private get redisOk(): boolean {
        return config.redis.enabled && this.redisConnected && this.redisClient !== null;
    }

    // ─── Memory (L3) helpers ──────────────────────────────────────────────────

    private memGet(key: string): string | null {
        const entry = this.memoryStore.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiry) {
            this.memoryStore.delete(key);
            return null;
        }
        return entry.value;
    }

    private memSet(key: string, value: string, ttl: number): void {
        this.memoryStore.set(key, { value, expiry: Date.now() + ttl * 1000 });
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * GET — tries Memcached → Redis → Memory in order.
     * On a hit at a lower layer, backfills the faster layer(s).
     */
    async get<T>(key: string): Promise<T | null> {
        const serialized = await this.getRaw(key);
        if (serialized === null) return null;
        try {
            return JSON.parse(serialized) as T;
        } catch {
            return null;
        }
    }

    private async getRaw(key: string): Promise<string | null> {
        // L1: Memcached
        if (this.memcachedOk) {
            try {
                const result = await new Promise<Buffer | null>((resolve) => {
                    this.memcachedClient!.get(
                        `${config.memcached.keyPrefix}${key}`,
                        (err, val) => resolve(err ? null : val)
                    );
                });
                if (result !== null) return result.toString('utf8');
            } catch { /* fall through */ }
        }

        // L2: Redis
        if (this.redisOk) {
            try {
                const val = await this.redisClient!.get(key);
                if (val !== null) {
                    // Backfill Memcached
                    if (this.memcachedOk) {
                        const ttl = await this.redisClient!.ttl(key);
                        const remainingTtl = ttl > 0 ? ttl : config.memcached.lifetime;
                        this.memcachedClient!.set(
                            `${config.memcached.keyPrefix}${key}`,
                            Buffer.from(val),
                            { expires: remainingTtl },
                            () => { }
                        );
                    }
                    return val;
                }
            } catch { /* fall through */ }
        }

        // L3: Memory
        return this.memGet(key);
    }

    /**
     * SET — writes to all enabled layers simultaneously for maximum hit-rate.
     */
    async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
        const serialized = JSON.stringify(value);

        const writes: Promise<any>[] = [];

        // L1: Memcached
        if (this.memcachedOk) {
            writes.push(new Promise<void>((resolve) => {
                this.memcachedClient!.set(
                    `${config.memcached.keyPrefix}${key}`,
                    Buffer.from(serialized),
                    { expires: ttl },
                    (err) => {
                        if (err) console.error('Cache: Memcached set error –', err.message);
                        resolve();
                    }
                );
            }));
        }

        // L2: Redis
        if (this.redisOk) {
            writes.push(
                this.redisClient!.setex(key, ttl, serialized).catch((err) =>
                    console.error('Cache: Redis set error –', err.message)
                )
            );
        }

        await Promise.all(writes);

        // L3: Memory (always, as guaranteed fallback)
        this.memSet(key, serialized, ttl);
    }

    /**
     * DELETE — removes key from all enabled layers.
     */
    async delete(key: string): Promise<void> {
        const deletes: Promise<any>[] = [];

        if (this.memcachedOk) {
            deletes.push(new Promise<void>((resolve) => {
                this.memcachedClient!.delete(
                    `${config.memcached.keyPrefix}${key}`,
                    (err) => {
                        if (err) console.error('Cache: Memcached delete error –', err.message);
                        resolve();
                    }
                );
            }));
        }

        if (this.redisOk) {
            deletes.push(
                this.redisClient!.del(key).catch((err) =>
                    console.error('Cache: Redis delete error –', err.message)
                )
            );
        }

        await Promise.all(deletes);
        this.memoryStore.delete(key);
    }

    /**
     * DELETE BY PATTERN — uses Redis SCAN (safe) + memory regex.
     * Memcached does not support server-side pattern scan, so keys that
     * are only in Memcached (not Redis) will expire naturally.
     */
    async deleteByPattern(pattern: string): Promise<void> {
        // Redis: SCAN-based deletion (safer than KEYS in production)
        if (this.redisOk) {
            try {
                const fullPattern = config.redis.keyPrefix + pattern;
                let cursor = '0';
                do {
                    const [nextCursor, keys] = await this.redisClient!.scan(
                        cursor, 'MATCH', fullPattern, 'COUNT', 100
                    );
                    cursor = nextCursor;
                    if (keys.length > 0) {
                        const keysNoPrefix = keys.map(k => k.replace(config.redis.keyPrefix, ''));
                        await this.redisClient!.del(...keysNoPrefix);

                        // Also delete from Memcached where possible
                        if (this.memcachedOk) {
                            for (const k of keysNoPrefix) {
                                this.memcachedClient!.delete(
                                    `${config.memcached.keyPrefix}${k}`,
                                    () => { }
                                );
                            }
                        }
                    }
                } while (cursor !== '0');
            } catch (err: any) {
                console.error('Cache: deleteByPattern Redis error –', err.message);
            }
        }

        // Memory: regex match
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*'));
        for (const key of this.memoryStore.keys()) {
            if (regex.test(key)) this.memoryStore.delete(key);
        }
    }

    /**
     * EXISTS — checks Memcached → Redis → Memory.
     */
    async exists(key: string): Promise<boolean> {
        if (this.memcachedOk) {
            try {
                const result = await new Promise<boolean>((resolve) => {
                    this.memcachedClient!.get(
                        `${config.memcached.keyPrefix}${key}`,
                        (err, val) => resolve(!err && val !== null)
                    );
                });
                if (result) return true;
            } catch { /* fall through */ }
        }

        if (this.redisOk) {
            try {
                const result = await this.redisClient!.exists(key);
                if (result === 1) return true;
            } catch { /* fall through */ }
        }

        const entry = this.memoryStore.get(key);
        if (!entry) return false;
        if (Date.now() > entry.expiry) { this.memoryStore.delete(key); return false; }
        return true;
    }

    /**
     * TTL — returns remaining seconds from Redis (most accurate).
     * Memcached does not expose per-key TTL.
     */
    async ttl(key: string): Promise<number> {
        if (this.redisOk) {
            try {
                return await this.redisClient!.ttl(key);
            } catch { /* fall through */ }
        }
        const entry = this.memoryStore.get(key);
        if (!entry) return -2;
        const remaining = Math.ceil((entry.expiry - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }

    /**
     * FLUSH ALL — clears all layers.
     */
    async flushAll(): Promise<void> {
        const flushes: Promise<any>[] = [];

        if (this.memcachedOk) {
            flushes.push(new Promise<void>((resolve) => {
                this.memcachedClient!.flush((err) => {
                    if (err) console.error('Cache: Memcached flush error –', err.message);
                    resolve();
                });
            }));
        }

        if (this.redisOk) {
            // Only flush our keys, not the whole Redis db
            flushes.push(this.deleteByPattern('*').catch((err) =>
                console.error('Cache: Redis flushAll error –', err.message)
            ));
        }

        await Promise.all(flushes);
        this.memoryStore.clear();
    }

    /**
     * STATS — current status of every layer.
     */
    getStats(): CacheStats {
        const backend: CacheStats['backend'] =
            this.memcachedOk ? 'memcached' :
                this.redisOk ? 'redis' : 'memory';

        return {
            memcached: { enabled: config.memcached.enabled, connected: this.memcachedConnected },
            redis: { enabled: config.redis.enabled, connected: this.redisConnected },
            memory: { size: this.memoryStore.size },
            backend,
        };
    }

    /**
     * DISCONNECT — graceful shutdown.
     */
    async disconnect(): Promise<void> {
        if (this.memcachedClient) {
            this.memcachedClient.quit();
            this.memcachedClient = null;
            this.memcachedConnected = false;
        }
        if (this.redisClient) {
            await this.redisClient.quit();
            this.redisClient = null;
            this.redisConnected = false;
        }
    }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

const cacheService = new CacheService();

export default cacheService;
export { CacheService };
