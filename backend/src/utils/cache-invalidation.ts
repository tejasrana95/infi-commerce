/**
 * Cache Invalidation Utilities
 * 
 * Provides model-specific cache invalidation functions.
 * Call these after create/update/delete operations to maintain cache consistency.
 */

import redisService from '../services/redis.service';
import { CacheKeys, InvalidationPatterns } from './cache-keys';

/**
 * Invalidate store cache when store data changes
 * @param storeId The store ID to invalidate
 */
export const invalidateStoreCache = async (storeId: string): Promise<void> => {
    await Promise.all([
        redisService.delete(CacheKeys.store(storeId)),
        redisService.delete(CacheKeys.storeSettings(storeId)),
    ]);
    console.log(`Cache invalidated: store ${storeId}`);
};

/**
 * Invalidate store domain cache when domains change
 * @param domains Array of domains to invalidate
 */
export const invalidateStoreDomainCache = async (domains: string[]): Promise<void> => {
    if (!domains || domains.length === 0) return;

    await Promise.all(
        domains.map(domain => redisService.delete(CacheKeys.storeByDomain(domain)))
    );
    console.log(`Cache invalidated: ${domains.length} store domains`);
};

/**
 * Invalidate all store-related cache (store + domains)
 * @param storeId The store ID
 * @param domains Optional array of store domains
 */
export const invalidateFullStoreCache = async (
    storeId: string,
    domains?: string[]
): Promise<void> => {
    await invalidateStoreCache(storeId);
    if (domains?.length) {
        await invalidateStoreDomainCache(domains);
    }
};

/**
 * Invalidate category cache for a store
 * @param storeId The store ID
 */
export const invalidateCategoryCache = async (storeId: string): Promise<void> => {
    await Promise.all([
        redisService.deleteByPattern(InvalidationPatterns.allCategories(storeId)),
        redisService.delete(CacheKeys.categoryTree(storeId)),
    ]);
    console.log(`Cache invalidated: categories for store ${storeId}`);
};

/**
 * Invalidate a single category
 * @param categoryId The category ID
 * @param storeId Optional store ID for broader invalidation
 */
export const invalidateSingleCategory = async (
    categoryId: string,
    storeId?: string
): Promise<void> => {
    await redisService.delete(CacheKeys.category(categoryId));
    if (storeId) {
        await invalidateCategoryCache(storeId);
    }
};

/**
 * Invalidate menu cache for a store
 * @param storeId The store ID
 */
export const invalidateMenuCache = async (storeId: string): Promise<void> => {
    await Promise.all([
        redisService.deleteByPattern(InvalidationPatterns.allMenus(storeId)),
        redisService.delete(CacheKeys.menus(storeId)),
    ]);
    console.log(`Cache invalidated: menus for store ${storeId}`);
};

/**
 * Invalidate a single menu
 * @param menuId The menu ID
 * @param storeId Optional store ID for broader invalidation
 */
export const invalidateSingleMenu = async (
    menuId: string,
    storeId?: string
): Promise<void> => {
    await Promise.all([
        redisService.delete(CacheKeys.menu(menuId)),
        redisService.delete(`menu:enriched:${menuId}`),  // Clear enriched menu cache
    ]);
    if (storeId) {
        await invalidateMenuCache(storeId);
    }
};

/**
 * Invalidate brand cache for a store
 * @param storeId The store ID
 */
export const invalidateBrandCache = async (storeId: string): Promise<void> => {
    await redisService.deleteByPattern(InvalidationPatterns.allBrands(storeId));
    console.log(`Cache invalidated: brands for store ${storeId}`);
};

/**
 * Invalidate tax rate cache
 * @param taxRateId Optional specific tax rate ID to invalidate
 */
export const invalidateTaxRateCache = async (taxRateId?: string): Promise<void> => {
    await redisService.delete(CacheKeys.taxRates());
    if (taxRateId) {
        await redisService.delete(CacheKeys.taxRate(taxRateId));
    }
    console.log(`Cache invalidated: tax rates${taxRateId ? ` (${taxRateId})` : ''}`);
};

/**
 * Invalidate currency cache
 */
export const invalidateCurrencyCache = async (): Promise<void> => {
    await Promise.all([
        redisService.deleteByPattern(InvalidationPatterns.allCurrencies()),
        redisService.delete(CacheKeys.currencies()),
        redisService.delete(CacheKeys.baseCurrency()),
    ]);
    console.log(`Cache invalidated: currencies`);
};

/**
 * Invalidate shipping rules cache for a store
 * @param storeId The store ID
 */
export const invalidateShippingCache = async (storeId: string): Promise<void> => {
    await redisService.deleteByPattern(InvalidationPatterns.allShipping(storeId));
    console.log(`Cache invalidated: shipping for store ${storeId}`);
};

/**
 * Invalidate page cache for a store
 * @param storeId The store ID
 */
export const invalidatePageCache = async (storeId: string): Promise<void> => {
    await redisService.deleteByPattern(InvalidationPatterns.allPages(storeId));
    console.log(`Cache invalidated: pages for store ${storeId}`);
};

/**
 * Invalidate a single page
 * @param pageId The page ID
 * @param storeId Optional store ID for broader invalidation
 */
export const invalidateSinglePage = async (
    pageId: string,
    storeId?: string
): Promise<void> => {
    await redisService.delete(CacheKeys.page(pageId));
    if (storeId) {
        await invalidatePageCache(storeId);
    }
};

/**
 * Invalidate layout cache for a store
 * @param storeId The store ID
 */
export const invalidateLayoutCache = async (storeId: string): Promise<void> => {
    await Promise.all([
        redisService.deleteByPattern(InvalidationPatterns.allLayouts(storeId)),
        redisService.delete(CacheKeys.layouts(storeId)),
        redisService.delete(CacheKeys.header(storeId)),
        redisService.delete(CacheKeys.footer(storeId)),
    ]);
    console.log(`Cache invalidated: layouts for store ${storeId}`);
};

/**
 * Invalidate API key cache
 * @param keyHash The hashed API key
 */
export const invalidateApiKeyCache = async (keyHash: string): Promise<void> => {
    await redisService.delete(CacheKeys.apiKeyByHash(keyHash));
    console.log(`Cache invalidated: API key`);
};

/**
 * Invalidate domain allowed cache
 * @param domain The domain to invalidate
 */
export const invalidateDomainCache = async (domain: string): Promise<void> => {
    await redisService.delete(CacheKeys.domainAllowed(domain));
    console.log(`Cache invalidated: domain ${domain}`);
};

/**
 * Invalidate testimonials cache for a store
 * @param storeId The store ID
 */
export const invalidateTestimonialCache = async (storeId: string): Promise<void> => {
    await redisService.deleteByPattern(InvalidationPatterns.allTestimonials(storeId));
    console.log(`Cache invalidated: testimonials for store ${storeId}`);
};

/**
 * Invalidate banner cache for a store
 * @param storeId The store ID
 */
export const invalidateBannerCache = async (storeId: string): Promise<void> => {
    await Promise.all([
        redisService.deleteByPattern(InvalidationPatterns.allBanners(storeId)),
        redisService.delete(CacheKeys.banners(storeId)),
        redisService.delete(CacheKeys.heroSliders(storeId)),
    ]);
    console.log(`Cache invalidated: banners for store ${storeId}`);
};

/**
 * Invalidate all cache for a store (nuclear option)
 * Use sparingly - prefer specific invalidation functions
 * @param storeId The store ID
 */
export const invalidateAllStoreCache = async (storeId: string): Promise<void> => {
    await Promise.all([
        invalidateStoreCache(storeId),
        invalidateCategoryCache(storeId),
        invalidateMenuCache(storeId),
        invalidateBrandCache(storeId),
        invalidateShippingCache(storeId),
        invalidatePageCache(storeId),
        invalidateLayoutCache(storeId),
        invalidateTestimonialCache(storeId),
        invalidateBannerCache(storeId),
    ]);
    console.log(`Cache invalidated: ALL cache for store ${storeId}`);
};

/**
 * Flush entire cache (use with extreme caution!)
 * This will clear ALL cached data across all stores.
 */
export const flushAllCache = async (): Promise<void> => {
    await redisService.flushAll();
    console.log(`Cache invalidated: ENTIRE CACHE FLUSHED`);
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): {
    enabled: boolean;
    connected: boolean;
    memoryFallbackSize: number;
    backend: 'redis' | 'memory';
} => {
    return redisService.getStats();
};
