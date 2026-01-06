/**
 * Cache Utility Functions
 * Helper functions to manage cache behavior based on query parameters
 */

/**
 * Check if the current request has the nocache parameter
 * This can be used in Server Components to detect cache bypass requests
 */
export function hasNoCacheParam(searchParams?: URLSearchParams | { [key: string]: string | string[] | undefined }): boolean {
    if (!searchParams) return false;

    // Handle URLSearchParams
    if (searchParams instanceof URLSearchParams) {
        return searchParams.get('nocache') === 'true';
    }

    // Handle Next.js searchParams object
    const nocache = searchParams['nocache'];
    return nocache === 'true' || (Array.isArray(nocache) && nocache[0] === 'true');
}

/**
 * Get fetch options with cache control based on nocache parameter
 * Use this in server-side fetch calls to respect the nocache parameter
 */
export function getCacheOptions(nocache: boolean = false): RequestInit {
    if (nocache) {
        return {
            cache: 'no-store',
            next: { revalidate: 0 }
        };
    }

    return {
        next: { revalidate: 300 } // Default 5 minutes cache
    };
}

/**
 * Merge custom fetch options with cache options
 */
export function mergeCacheOptions(
    customOptions: RequestInit = {},
    nocache: boolean = false
): RequestInit {
    const cacheOpts = getCacheOptions(nocache);

    return {
        ...customOptions,
        ...cacheOpts,
        headers: {
            ...customOptions.headers,
            ...(nocache ? { 'Cache-Control': 'no-store' } : {}),
        }
    };
}
