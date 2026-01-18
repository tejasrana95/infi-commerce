/**
 * Store Cache Service
 * Implements: Memory → File → API fallback with freshness validation
 */

import { Store } from '@/types';
import fs from 'fs';
import path from 'path';

const CACHE_FILE_PATH = path.join(process.cwd(), '.next/cache/store-config.json');
const MEMORY_CACHE_TTL = 60 * 1000; // 1 minute

interface CachedStoreConfig {
    storeId: string;
    generatedAt: string;
    storeData: Store;
}

interface MemoryCacheEntry {
    data: Store;
    timestamp: number;
}

// In-memory cache (per instance)
const memoryCache = new Map<string, MemoryCacheEntry>();

// File cache (loaded once per cold start)
let fileCache: Record<string, CachedStoreConfig> | null = null;
let fileCacheLoaded = false;

function loadFileCache(): Record<string, CachedStoreConfig> | null {
    if (fileCacheLoaded) return fileCache;

    try {
        if (fs.existsSync(CACHE_FILE_PATH)) {
            const content = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
            fileCache = JSON.parse(content);
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

    // Check TTL
    if (Date.now() - entry.timestamp > MEMORY_CACHE_TTL) {
        memoryCache.delete(domain);
        return null;
    }

    return entry.data;
}

function setInMemory(domain: string, store: Store): void {
    memoryCache.set(domain, {
        data: store,
        timestamp: Date.now(),
    });
}

function isConfigFresh(config: CachedStoreConfig): boolean {
    const generatedAt = new Date(config.generatedAt).getTime();
    const updatedAt = new Date(config.storeData.updatedAt || 0).getTime();

    // Config is fresh if it was generated after the last store update
    return generatedAt >= updatedAt;
}

export interface StoreResolveResult {
    store: Store | null;
    source: 'memory' | 'file' | 'api';
    fresh: boolean;
}

export async function resolveStoreByDomain(
    domain: string,
    apiFetcher: (domain: string) => Promise<Store | null>
): Promise<StoreResolveResult> {
    // Layer 1: Memory cache
    const memoryStore = getFromMemory(domain);
    if (memoryStore) {
        return { store: memoryStore, source: 'memory', fresh: true };
    }
    // Layer 2: File cache
    const cache = loadFileCache();
    if (cache && cache[domain]) {
        const config = cache[domain];

        if (isConfigFresh(config)) {
            // Cache is fresh, use it
            setInMemory(domain, config.storeData);
            return { store: config.storeData, source: 'file', fresh: true };
        }

        // Cache is stale, fetch from API
        console.log(`Store config stale for ${domain}, fetching fresh...`);
    }

    // Layer 3: API fallback
    const apiStore = await apiFetcher(domain);
    if (apiStore) {
        setInMemory(domain, apiStore);
    }
    return { store: apiStore, source: 'api', fresh: true };
}

export function clearMemoryCache(): void {
    memoryCache.clear();
}

/**
 * Returns a normalized map of domain -> storeId
 * Handles both classic {"domain": "id"} and grouped {"id": ["domain1", "domain2"]} formats
 */
export function getStoreDomainMap(): Record<string, string> | null {
    const envMap = process.env.STORE_DOMAIN_MAP;
    if (!envMap) return null;

    try {
        const rawMap = JSON.parse(envMap);
        const normalizedMap: Record<string, string> = {};

        for (const [key, value] of Object.entries(rawMap)) {
            if (Array.isArray(value)) {
                // Grouped format: "storeId": ["domain1", "domain2"]
                value.forEach(domain => {
                    if (typeof domain === 'string') {
                        normalizedMap[domain] = key;
                    }
                });
            } else if (typeof value === 'string') {
                // Classic format: "domain": "storeId"
                normalizedMap[key] = value;
            }
        }

        return Object.keys(normalizedMap).length > 0 ? normalizedMap : null;
    } catch {
        return null;
    }
}
