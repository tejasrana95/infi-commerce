/**
 * Redis Service - Backward-Compatibility Alias
 *
 * This file re-exports the unified CacheService as `redisService` so that
 * all existing code that imports `redis.service` continues to work without
 * modification. The CacheService uses Memcached → Redis → Memory internally.
 *
 * For new code, import from `cache.service` instead.
 */

import cacheService from './cache.service';

const redisService = cacheService;

export default redisService;
export { cacheService };
