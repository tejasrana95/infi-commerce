/**
 * Reserved slugs that cannot be used for products, categories, or pages.
 * These correspond to frontend application routes.
 */
export const RESERVED_SLUGS = [
    // Authentication
    'login',
    'register',
    'forgot-password',
    'reset-password',
    'verify-email',
    'auth',

    // User account
    'account',

    // Shopping
    'products',
    'cart',
    'checkout',
    'wishlist',
    'compare',
    'search',

    // Content
    'blog',

    // Orders
    'orders',
    'track',

    // System
    'api',
    'offline',
    'ai',
    'sitemap',
    'robots',
    'manifest',
    '.well-known',
] as const;

export type ReservedSlug = typeof RESERVED_SLUGS[number];

/**
 * Check if a slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
    const normalizedSlug = slug.toLowerCase().trim();
    return RESERVED_SLUGS.includes(normalizedSlug as ReservedSlug);
}

/**
 * Generate an alternative slug by appending a random suffix
 */
export function generateAlternativeSlug(slug: string): string {
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${slug}-${randomSuffix}`;
}
