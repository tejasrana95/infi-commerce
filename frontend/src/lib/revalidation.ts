/**
 * ISG Revalidation Configuration
 * Environment-based revalidation times for different page types
 */

export const revalidationConfig = {
    // Homepage - frequently updated with banners, promotions
    homepage: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_HOMEPAGE || '300', 10),

    // Category pages - moderate update frequency
    category: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_CATEGORY || '600', 10),

    // Product pages - less frequent updates
    product: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_PRODUCT || '900', 10),

    // Store data - theme, menus, config
    store: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_STORE || '300', 10),

    // Blog pages - infrequent updates
    blog: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_BLOG || '3600', 10),
} as const;

/**
 * Get revalidation time for a specific page type
 */
export function getRevalidateTime(pageType: keyof typeof revalidationConfig): number {
    const time = revalidationConfig[pageType];
    // Fallback to safe defaults if env vars fail or something goes wrong
    if (typeof time !== 'number' || isNaN(time)) {
        const defaults: Record<string, number> = {
            homepage: 300,
            category: 600,
            product: 900,
            store: 300,
            blog: 3600
        };
        return defaults[pageType] || 60;
    }
    return time;
}
