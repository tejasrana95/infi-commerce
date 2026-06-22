/**
 * Store Cache Service
 * Cache chain: Memcached/Redis (L1, shared) → Memory (L2, per-instance) → File (L3) → API
 */

import { Store } from '@/types';

// ── Server-cache helpers ──────────────────────────────────────────────────────
// We use dynamic imports with webpackIgnore so webpack never statically traces
// into ioredis/memjs, which are Node.js-only packages. Without this, the browser
// bundle breaks because store-cache.ts is indirectly imported by client components
// (via api.ts → StoreProvider → layout).

async function scGet<T>(key: string): Promise<T | null> {
    if (typeof window !== 'undefined') return null; // browser guard
    try {
         
        const { serverCacheGet } = await import(/* webpackIgnore: true */ '@/lib/server-cache');
        return serverCacheGet<T>(key);
    } catch { return null; }
}
async function scSet(key: string, value: unknown, ttl: number): Promise<void> {
    if (typeof window !== 'undefined') return;
    try {
         
        const { serverCacheSet } = await import(/* webpackIgnore: true */ '@/lib/server-cache');
        await serverCacheSet(key, value, ttl);
    } catch { /* ignore */ }
}

const MEMORY_CACHE_TTL_MS = 3600 * 1000; // 1 hour (in-process memory)
const SHARED_CACHE_TTL_S = 3600;        // 1 hour (Memcached / Redis)

interface CachedStoreConfig {
    storeId: string;
    generatedAt: string;
    storeData: Store;
}

interface MemoryCacheEntry {
    data: Store;
    timestamp: number;
}

// In-memory cache (per Next.js worker instance)
const memoryCache = new Map<string, MemoryCacheEntry>();

// File cache (loaded once per cold start)
let fileCache: Record<string, CachedStoreConfig> | null = null;
let fileCacheLoaded = false;

function isFileCacheEnabled(): boolean {
    return process.env.USE_CACHE_JSON !== 'false';
}

async function loadFileCache(): Promise<Record<string, CachedStoreConfig> | null> {
    if (fileCacheLoaded) return fileCache;

    try {
        if (typeof window === 'undefined') {
            const fsModule = await import('fs');
            const pathModule = await import('path');
            const fs = fsModule.default || fsModule;
            const path = pathModule.default || pathModule;
            const CACHE_FILE_PATH = path.join(process.cwd(), '.next/cache/store-config.json');
            if (fs.existsSync(CACHE_FILE_PATH) && isFileCacheEnabled()) {
                const content = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
                fileCache = JSON.parse(content);
            }
        }
    } catch (error) {
        console.error('Failed to load store config cache:', error);
        fileCache = null;
    }

    fileCacheLoaded = true;
    return fileCache;
}

function getFromMemory(domain: string): Store | null {
    const entry = memoryCache.get(domain);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > MEMORY_CACHE_TTL_MS) {
        memoryCache.delete(domain);
        return null;
    }
    return entry.data;
}

function setInMemory(domain: string, store: Store): void {
    memoryCache.set(domain, { data: store, timestamp: Date.now() });
}

function isConfigFresh(config: CachedStoreConfig): boolean {
    const generatedAt = new Date(config.generatedAt).getTime();
    const updatedAt = new Date(config.storeData.updatedAt || 0).getTime();
    return generatedAt >= updatedAt;
}

export interface StoreResolveResult {
    store: Store | null;
    source: 'shared-cache' | 'memory' | 'file' | 'api';
    fresh: boolean;
}

export async function resolveStoreByDomain(
    domain: string,
    apiFetcher: (domain: string) => Promise<Store | null>
): Promise<StoreResolveResult> {

    // Layer 0: Shared cache (Memcached → Redis) — fastest across workers
    const sharedKey = `store:domain:${domain}`;
    const sharedStore = await scGet<Store>(sharedKey);
    if (sharedStore) {
        setInMemory(domain, sharedStore);
        return { store: sharedStore, source: 'shared-cache', fresh: true };
    }

    // Layer 1: In-process memory
    const memoryStore = getFromMemory(domain);
    if (memoryStore) {
        return { store: memoryStore, source: 'memory', fresh: true };
    }

    // Layer 2: File cache
    const cache = await loadFileCache();
    if (cache && cache[domain]) {
        const cfg = cache[domain];
        if (isConfigFresh(cfg)) {
            setInMemory(domain, cfg.storeData);
            await scSet(sharedKey, cfg.storeData, SHARED_CACHE_TTL_S);
            return { store: cfg.storeData, source: 'file', fresh: true };
        }
    }

    // Layer 3: API fallback
    const apiStore = await apiFetcher(domain);
    if (apiStore) {
        setInMemory(domain, apiStore);
        await scSet(sharedKey, apiStore, SHARED_CACHE_TTL_S);
    }
    return { store: apiStore, source: 'api', fresh: true };
}

export function clearMemoryCache(): void {
    memoryCache.clear();
}

/**
 * Returns a normalized map of domain → storeId.
 * Handles both classic {"domain": "id"} and grouped {"id": ["domain1", "domain2"]} formats.
 */
export function getStoreDomainMap(): Record<string, string> | null {
    const envMap = process.env.STORE_DOMAIN_MAP;
    if (!envMap) return null;

    try {
        const rawMap = JSON.parse(envMap);
        const normalizedMap: Record<string, string> = {};

        for (const [key, value] of Object.entries(rawMap)) {
            if (Array.isArray(value)) {
                value.forEach(domain => {
                    if (typeof domain === 'string') normalizedMap[domain] = key;
                });
            } else if (typeof value === 'string') {
                normalizedMap[key] = value;
            }
        }

        return Object.keys(normalizedMap).length > 0 ? normalizedMap : null;
    } catch {
        return null;
    }
}
