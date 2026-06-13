/**
 * ISG Revalidation Configuration
 * Environment-based revalidation times for different page types and API data
 * All times are in seconds
 */

export const revalidationConfig = {
    // ============================================
    // Page-Level Revalidation (ISR)
    // ============================================

    // Homepage - frequently updated with banners, promotions
    homepage: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_HOMEPAGE || '300', 10),

    // Category pages - moderate update frequency
    category: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_CATEGORY || '600', 10),

    // Product pages - less frequent updates
    product: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_PRODUCT || '900', 10),

    // Blog pages - infrequent updates
    blog: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_BLOG || '3600', 10),

    // Static pages - very infrequent updates
    page: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_PAGE || '3600', 10),

    // ============================================
    // Data-Level Revalidation (API Fetch Cache)
    // ============================================

    // Store data - theme, menus, config (critical, cache longer)
    store: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_STORE || '300', 10),

    // Store by domain lookup (can be cached longer as domains rarely change)
    storeDomain: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_STORE_DOMAIN || '300', 10),

    // Layouts - header, footer, page layouts
    layout: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_LAYOUT || '300', 10),

    // Category data (metadata, filters)
    categoryData: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_CATEGORY_DATA || '300', 10),

    // Product data (individual product details)
    productData: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_PRODUCT_DATA || '300', 10),

    // Product lists (category products, search results)
    productList: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_PRODUCT_LIST || '300', 10),

    // Blog posts list
    blogPosts: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_BLOG_POSTS || '600', 10),

    // Blog categories and tags
    blogMeta: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_BLOG_META || '3600', 10),

    // Currencies - rarely change
    currencies: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_CURRENCIES || '3600', 10),

    // Hero sliders and banners
    heroSlider: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_HERO_SLIDER || '300', 10),

    // ============================================
    // Dynamic/No-Cache Settings
    // ============================================

    // Search results - always fresh
    search: 0,

    // Filters - dynamic based on current products
    filters: 0,
} as const;

/**
 * Get revalidation time for a specific page or data type
 */
export function getRevalidateTime(type: keyof typeof revalidationConfig): number {
    const time = revalidationConfig[type];

    // Fallback to safe defaults if env vars fail or something goes wrong
    if (typeof time !== 'number' || isNaN(time)) {
        const defaults: Record<string, number> = {
            homepage: 300,
            category: 600,
            product: 900,
            blog: 3600,
            page: 3600,
            store: 300,
            storeDomain: 300,
            layout: 300,
            categoryData: 300,
            productData: 300,
            productList: 300,
            blogPosts: 600,
            blogMeta: 3600,
            currencies: 3600,
            heroSlider: 300,
            search: 0,
            filters: 0,
        };
        return defaults[type] || 60;
    }

    return time;
}

/**
 * Helper to create Next.js fetch cache options
 */
export function getCacheOptions(type: keyof typeof revalidationConfig, noCache: boolean = false): RequestInit {
    // In development always return no-store to avoid stale SSR during dev
    if (process.env.NODE_ENV === 'development') {
        return { cache: 'no-store' };
    }

    if (noCache) {
        return { cache: 'no-store' };
    }

    const revalidate = getRevalidateTime(type);

    if (revalidate === 0) {
        return { cache: 'no-store' };
    }

    return { next: { revalidate } };
}
