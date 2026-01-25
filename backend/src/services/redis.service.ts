/**
 * Redis Cache Service
 * 
 * Provides caching functionality with Redis as primary backend
 * and automatic fallback to in-memory cache when Redis is unavailable.
 * 
 * Only enabled when REDIS_ENABLED=true in environment.
 */

import Redis from 'ioredis';
import { config } from '../config';

class RedisService {
    private client: Redis | null = null;
    private isConnected = false;
    private memoryFallback = new Map<string, { value: string; expiry: number }>();

    constructor() {
        if (config.redis.enabled) {
            this.initializeRedis();
        } else {
            console.log('Redis: Disabled (REDIS_ENABLED=false), using in-memory cache');
        }
    }

    private initializeRedis(): void {
        try {
            this.client = new Redis({
                host: config.redis.host,
                port: config.redis.port,
                password: config.redis.password || undefined,
                db: config.redis.db,
                keyPrefix: config.redis.keyPrefix,
                retryStrategy: (times) => {
                    if (times > 3) {
                        console.warn('Redis: Max retries reached, using memory fallback');
                        return null; // Stop retrying
                    }
                    return Math.min(times * 100, 3000);
                },
                lazyConnect: true,
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('Redis: Connected successfully');
            });

            this.client.on('ready', () => {
                this.isConnected = true;
                console.log('Redis: Ready to accept commands');
            });

            this.client.on('error', (err) => {
                console.error('Redis: Connection error -', err.message);
                this.isConnected = false;
            });

            this.client.on('close', () => {
                console.log('Redis: Connection closed');
                this.isConnected = false;
            });

            this.client.on('reconnecting', () => {
                console.log('Redis: Attempting to reconnect...');
            });

            // Attempt connection
            this.client.connect().catch((err) => {
                console.warn('Redis: Initial connection failed, using memory fallback -', err.message);
                this.isConnected = false;
            });
        } catch (error) {
            console.warn('Redis: Failed to initialize, using memory fallback');
            this.isConnected = false;
        }
    }

    /**
     * Check if Redis is available and connected
     */
    isAvailable(): boolean {
        return config.redis.enabled && this.isConnected && this.client !== null;
    }

    /**
     * Get enabled status
     */
    isEnabled(): boolean {
        return config.redis.enabled;
    }

    /**
     * Get a value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            if (this.isAvailable()) {
                const value = await this.client!.get(key);
                if (value) {
                    return JSON.parse(value) as T;
                }
                return null;
            }

            // Memory fallback
            const item = this.memoryFallback.get(key);
            if (!item) return null;

            if (Date.now() > item.expiry) {
                this.memoryFallback.delete(key);
                return null;
            }

            return JSON.parse(item.value) as T;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    /**
     * Set a value in cache
     * @param key Cache key
     * @param value Value to store
     * @param ttl TTL in seconds (default: 300 = 5 minutes)
     */
    async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
        try {
            const serialized = JSON.stringify(value);

            if (this.isAvailable()) {
                await this.client!.setex(key, ttl, serialized);
            } else {
                // Memory fallback
                this.memoryFallback.set(key, {
                    value: serialized,
                    expiry: Date.now() + ttl * 1000,
                });
            }
        } catch (error) {
            console.error('Redis set error:', error);
            // Still try memory fallback on error
            try {
                this.memoryFallback.set(key, {
                    value: JSON.stringify(value),
                    expiry: Date.now() + ttl * 1000,
                });
            } catch (memError) {
                console.error('Memory fallback set error:', memError);
            }
        }
    }

    /**
     * Delete a specific key from cache
     */
    async delete(key: string): Promise<void> {
        try {
            if (this.isAvailable()) {
                await this.client!.del(key);
            }
            // Always clear from memory fallback too
            this.memoryFallback.delete(key);
        } catch (error) {
            console.error('Redis delete error:', error);
            // Still clear memory fallback
            this.memoryFallback.delete(key);
        }
    }

    /**
     * Delete all keys matching a pattern
     * Pattern uses Redis KEYS pattern syntax: * matches any characters
     * 
     * Note: Use with caution in production - KEYS can be slow on large datasets
     */
    async deleteByPattern(pattern: string): Promise<void> {
        try {
            if (this.isAvailable()) {
                // Get all keys matching the pattern (with prefix already applied)
                const fullPattern = config.redis.keyPrefix + pattern;
                const keys = await this.client!.keys(fullPattern);

                if (keys.length > 0) {
                    // Remove prefix for deletion since keyPrefix is auto-added by ioredis
                    const keysWithoutPrefix = keys.map(k =>
                        k.replace(config.redis.keyPrefix, '')
                    );
                    await this.client!.del(...keysWithoutPrefix);
                }
            }

            // Memory fallback - clear matching keys
            const patternRegex = new RegExp('^' + pattern.replace(/\*/g, '.*'));
            for (const key of this.memoryFallback.keys()) {
                if (patternRegex.test(key)) {
                    this.memoryFallback.delete(key);
                }
            }
        } catch (error) {
            console.error('Redis deleteByPattern error:', error);
        }
    }

    /**
     * Check if a key exists in cache
     */
    async exists(key: string): Promise<boolean> {
        try {
            if (this.isAvailable()) {
                const result = await this.client!.exists(key);
                return result === 1;
            }

            // Memory fallback
            const item = this.memoryFallback.get(key);
            if (!item) return false;
            if (Date.now() > item.expiry) {
                this.memoryFallback.delete(key);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Redis exists error:', error);
            return false;
        }
    }

    /**
     * Get remaining TTL for a key (in seconds)
     */
    async ttl(key: string): Promise<number> {
        try {
            if (this.isAvailable()) {
                return await this.client!.ttl(key);
            }

            // Memory fallback
            const item = this.memoryFallback.get(key);
            if (!item) return -2; // Key doesn't exist
            const remaining = Math.ceil((item.expiry - Date.now()) / 1000);
            return remaining > 0 ? remaining : -2;
        } catch (error) {
            console.error('Redis ttl error:', error);
            return -2;
        }
    }

    /**
     * Flush all cache (use with caution!)
     */
    async flushAll(): Promise<void> {
        try {
            if (this.isAvailable()) {
                // Only flush keys with our prefix to avoid affecting other apps
                await this.deleteByPattern('*');
            }
            this.memoryFallback.clear();
        } catch (error) {
            console.error('Redis flushAll error:', error);
            this.memoryFallback.clear();
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        enabled: boolean;
        connected: boolean;
        memoryFallbackSize: number;
        backend: 'redis' | 'memory';
    } {
        return {
            enabled: config.redis.enabled,
            connected: this.isConnected,
            memoryFallbackSize: this.memoryFallback.size,
            backend: this.isAvailable() ? 'redis' : 'memory',
        };
    }

    /**
     * Graceful shutdown - close Redis connection
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
        }
    }
}

// Singleton instance
const redisService = new RedisService();

export default redisService;
