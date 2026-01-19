/**
 * Menu Cache Service
 * Implements: Memory → File → API fallback with freshness validation
 */

import { Menu } from '@/types/menu';

const MEMORY_CACHE_TTL = 60 * 1000; // 1 minute

interface CachedMenuConfig {
    menuId: string;
    generatedAt: string;
    menuData: Menu;
}

interface MemoryCacheEntry {
    data: Menu;
    timestamp: number;
}

// In-memory cache (per instance)
const memoryCache = new Map<string, MemoryCacheEntry>();

// File cache (loaded once per cold start)
let fileCache: Record<string, CachedMenuConfig> | null = null;
let fileCacheLoaded = false;

async function loadFileCache(): Promise<Record<string, CachedMenuConfig> | null> {
    if (fileCacheLoaded) return fileCache;

    try {
        // Dynamically import Node.js modules only on server
        if (typeof window === 'undefined') {
            const fsModule = await import('fs');
            const pathModule = await import('path');
            const fs = fsModule.default || fsModule;
            const path = pathModule.default || pathModule;
            const CACHE_FILE_PATH = path.join(process.cwd(), '.next/cache/menu-config.json');

            if (fs.existsSync(CACHE_FILE_PATH)) {
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

    // Check TTL
    if (Date.now() - entry.timestamp > MEMORY_CACHE_TTL) {
        memoryCache.delete(menuId);
        return null;
    }

    return entry.data;
}

function setInMemory(menuId: string, menu: Menu): void {
    memoryCache.set(menuId, {
        data: menu,
        timestamp: Date.now(),
    });
}

function isConfigFresh(config: CachedMenuConfig): boolean {
    const generatedAt = new Date(config.generatedAt).getTime();
    const updatedAt = new Date(config.menuData.updatedAt || 0).getTime();

    // Config is fresh if it was generated after the last menu update
    return generatedAt >= updatedAt;
}

export interface MenuResolveResult {
    menu: Menu | null;
    source: 'memory' | 'file' | 'api';
    fresh: boolean;
}

export async function resolveMenuById(
    menuId: string,
    apiFetcher: (menuId: string) => Promise<Menu | null>
): Promise<MenuResolveResult> {
    // Layer 1: Memory cache
    const memoryMenu = getFromMemory(menuId);
    if (memoryMenu) {
        return { menu: memoryMenu, source: 'memory', fresh: true };
    }

    // Layer 2: File cache
    const cache = await loadFileCache();
    if (cache && cache[menuId]) {
        const config = cache[menuId];

        if (isConfigFresh(config)) {
            // Cache is fresh, use it
            setInMemory(menuId, config.menuData);
            return { menu: config.menuData, source: 'file', fresh: true };
        }

        // Cache is stale, fetch from API
        console.log(`Menu config stale for ${menuId}, fetching fresh...`);
    }

    // Layer 3: API fallback
    const apiMenu = await apiFetcher(menuId);
    if (apiMenu) {
        setInMemory(menuId, apiMenu);
    }
    return { menu: apiMenu, source: 'api', fresh: true };
}

export function clearMemoryCache(): void {
    memoryCache.clear();
}
