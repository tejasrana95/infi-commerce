/**
 * Menu Cache Service
 * Cache chain: Memcached/Redis (L1, shared) → Memory (L2, per-instance) → File (L3) → API
 */

import { Menu } from '@/types/menu';

// ── Server-cache helpers ──────────────────────────────────────────────────────
// Dynamic imports with webpackIgnore keep ioredis/memjs out of the browser bundle.
async function scGet<T>(key: string): Promise<T | null> {
    if (typeof window !== 'undefined') return null;
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

const MEMORY_CACHE_TTL_MS = 1440 * 60 * 1000; // 24 hours (in-process memory)
const SHARED_CACHE_TTL_S = 86400;             // 24 hours (Memcached / Redis)

interface CachedMenuConfig {
    menuId: string;
    generatedAt: string;
    menuData: Menu;
}

interface MemoryCacheEntry {
    data: Menu;
    timestamp: number;
}

// In-memory cache (per Next.js worker instance)
const memoryCache = new Map<string, MemoryCacheEntry>();

// File cache (loaded once per cold start)
let fileCache: Record<string, CachedMenuConfig> | null = null;
let fileCacheLoaded = false;

function isFileCacheEnabled(): boolean {
    return process.env.USE_CACHE_JSON !== 'false';
}

async function loadFileCache(): Promise<Record<string, CachedMenuConfig> | null> {
    if (fileCacheLoaded) return fileCache;

    try {
        if (typeof window === 'undefined') {
            const fsModule = await import('fs');
            const pathModule = await import('path');
            const fs = fsModule.default || fsModule;
            const path = pathModule.default || pathModule;
            const CACHE_FILE_PATH = path.join(process.cwd(), '.next/cache/menu-config.json');

            if (fs.existsSync(CACHE_FILE_PATH) && isFileCacheEnabled()) {
                const content = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
                fileCache = JSON.parse(content);
            }
        }
    } catch (error) {
        console.error('Failed to load menu config cache:', error);
        fileCache = null;
    }

    fileCacheLoaded = true;
    return fileCache;
}

function getFromMemory(menuId: string): Menu | null {
    const entry = memoryCache.get(menuId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > MEMORY_CACHE_TTL_MS) {
        memoryCache.delete(menuId);
        return null;
    }
    return entry.data;
}

function setInMemory(menuId: string, menu: Menu): void {
    memoryCache.set(menuId, { data: menu, timestamp: Date.now() });
}

function isConfigFresh(config: CachedMenuConfig): boolean {
    const generatedAt = new Date(config.generatedAt).getTime();
    const updatedAt = new Date(config.menuData.updatedAt || 0).getTime();
    return generatedAt >= updatedAt;
}

export interface MenuResolveResult {
    menu: Menu | null;
    source: 'shared-cache' | 'memory' | 'file' | 'api';
    fresh: boolean;
}

export async function resolveMenuById(
    menuId: string,
    apiFetcher: (menuId: string) => Promise<Menu | null>
): Promise<MenuResolveResult> {

    // Layer 0: Shared cache (Memcached → Redis) — fastest across workers
    const sharedKey = `menu:id:${menuId}`;
    const sharedMenu = await scGet<Menu>(sharedKey);
    if (sharedMenu) {
        setInMemory(menuId, sharedMenu);
        return { menu: sharedMenu, source: 'shared-cache', fresh: true };
    }

    // Layer 1: In-process memory
    const memoryMenu = getFromMemory(menuId);
    if (memoryMenu) {
        return { menu: memoryMenu, source: 'memory', fresh: true };
    }

    // Layer 2: File cache
    const cache = await loadFileCache();
    const isStrictCache = process.env.USE_CACHE_JSON === 'true';

    if (cache && cache[menuId]) {
        const cfg = cache[menuId];
        // If strictly using cache JSON, skip freshness check
        if (isStrictCache || isConfigFresh(cfg)) {
            setInMemory(menuId, cfg.menuData);
            await scSet(sharedKey, cfg.menuData, SHARED_CACHE_TTL_S);
            return { menu: cfg.menuData, source: 'file', fresh: true };
        }
    }


    const apiMenu = await apiFetcher(menuId);
    if (apiMenu) {
        setInMemory(menuId, apiMenu);
        await scSet(sharedKey, apiMenu, SHARED_CACHE_TTL_S);
    }
    return { menu: apiMenu, source: 'api', fresh: true };
}

export function clearMemoryCache(): void {
    memoryCache.clear();
}
