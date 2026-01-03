type CacheItem<T> = {
    value: T;
    expiry: number;
};

class MemoryCache {
    private cache = new Map<string, CacheItem<any>>();
    private defaultTTL = 300; // 5 minutes in seconds

    /**
     * Get a value from the cache
     */
    get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    /**
     * Set a value in the cache
     * @param key Cache key
     * @param value Value to store
     * @param ttl TTL in seconds (optional)
     */
    set<T>(key: string, value: T, ttl?: number): void {
        const expiry = Date.now() + (ttl || this.defaultTTL) * 1000;
        this.cache.set(key, { value, expiry });
    }

    /**
     * Delete a value from the cache
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache entries that match a pattern (prefix)
     * e.g., 'store:123' will clear all keys starting with that
     */
    clearByPrefix(prefix: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear the entire cache
     */
    flushAll(): void {
        this.cache.clear();
    }
}

// Create singleton instance
const cache = new MemoryCache();

export default cache;
