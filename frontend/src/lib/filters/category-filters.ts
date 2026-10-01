// ============================================================
// Category / Search filter query-param contract
// ------------------------------------------------------------
// Single source of truth for how product filters are (de)serialized.
// Used by BOTH the server (SSR data fetching) and the client (URL writers)
// so they can never drift apart.
//
// URL shape (matches the backend /products endpoint):
//   ?price=10-500   ?brand=id1,id2   ?tags=a,b   ?rating=4
//   ?stock=in_stock ?<attributeSlug>=v1,v2
//
// IMPORTANT: "applied" filters are ALWAYS derived from the URL — never
// mirrored into component state. This keeps SSR and CSR in lockstep.
// ============================================================

export interface AppliedFilters {
    /** Brand IDs (never names). */
    brands: string[];
    tags: string[];
    stockStatus: string[];
    rating: number | null;
    price: { min: number; max: number } | null;
    /** Attribute slug -> selected values. */
    attributes: Record<string, string[]>;
}

export const DEFAULT_APPLIED_FILTERS: AppliedFilters = {
    brands: [],
    tags: [],
    stockStatus: [],
    rating: null,
    price: null,
    attributes: {},
};

/**
 * Query params that are NOT filters. Anything else is treated as an
 * attribute filter, which means new attributes work without any code change.
 */
const RESERVED_PARAMS = new Set([
    'page',
    'limit',
    'sort',
    'q',
    'search',
    'view',
    'storeId',
    'categoryId',
    'channel',
    // explicit filter params handled below
    'price',
    'brand',
    'tags',
    'rating',
    'stock',
]);

/** Tracking / unrelated params that must never be interpreted as attributes. */
const IGNORED_PREFIXES = ['utm_', 'gclid', 'fbclid', '_gl', 'mc_', 'msclkid', 'ref', 'wbraid', 'gbraid'];

export interface SearchParamsLike {
    get(key: string): string | null;
    forEach(callback: (value: string, key: string) => void): void;
    toString(): string;
}

export function isReservedParam(key: string): boolean {
    if (RESERVED_PARAMS.has(key)) return true;
    const lower = key.toLowerCase();
    return IGNORED_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * Normalise Next.js `searchParams` (which may hold string | string[]) into a
 * URLSearchParams so the exact same parser can be used on the server.
 */
export function searchParamsFromRecord(
    record: Record<string, string | string[] | undefined>,
): URLSearchParams {
    const params = new URLSearchParams();
    Object.entries(record).forEach(([key, value]) => {
        if (typeof value === 'string') params.set(key, value);
        else if (Array.isArray(value)) params.set(key, value.join(','));
    });
    return params;
}

/**
 * Parse applied filters from a URLSearchParams-like object.
 * Unknown (non-reserved) params are treated as attribute filters.
 */
export function parseAppliedFilters(params: SearchParamsLike): AppliedFilters {
    const filters: AppliedFilters = { ...DEFAULT_APPLIED_FILTERS, attributes: {} };

    const priceParam = params.get('price');
    if (priceParam) {
        const [min, max] = priceParam.split('-').map((v) => parseFloat(v));
        if (!isNaN(min) || !isNaN(max)) {
            filters.price = { min: min || 0, max: isNaN(max) ? Infinity : max };
        }
    }

    const brandParam = params.get('brand');
    if (brandParam) filters.brands = brandParam.split(',').filter(Boolean);

    const tagsParam = params.get('tags');
    if (tagsParam) filters.tags = tagsParam.split(',').filter(Boolean);

    const ratingParam = params.get('rating');
    if (ratingParam) {
        const rating = parseInt(ratingParam, 10);
        if (!isNaN(rating)) filters.rating = rating;
    }

    const stockParam = params.get('stock');
    if (stockParam) filters.stockStatus = stockParam.split(',').filter(Boolean);

    // Everything else that carries a value is an attribute filter.
    params.forEach((value, key) => {
        if (!value) return;
        if (isReservedParam(key)) return;
        filters.attributes[key] = value.split(',').filter(Boolean);
    });

    return filters;
}

/** Number of active filter selections (used for badges and empty states). */
export function countActiveFilters(filters: AppliedFilters): number {
    let count = 0;
    if (filters.price) count++;
    count += filters.brands.length;
    count += filters.tags.length;
    count += filters.stockStatus.length;
    if (filters.rating) count++;
    Object.values(filters.attributes).forEach((values) => {
        count += values.length;
    });
    return count;
}

/** Stable, order-independent key for memo/effect dependencies. */
export function appliedFiltersKey(filters: AppliedFilters): string {
    return JSON.stringify({
        price: filters.price,
        brands: [...filters.brands].sort(),
        tags: [...filters.tags].sort(),
        rating: filters.rating,
        stockStatus: [...filters.stockStatus].sort(),
        attributes: Object.keys(filters.attributes)
            .sort()
            .reduce<Record<string, string[]>>((acc, key) => {
                acc[key] = [...filters.attributes[key]].sort();
                return acc;
            }, {}),
    });
}

/**
 * Serialize applied filters into backend query params (without page/sort).
 * Empty selections delete their key.
 */
export function appliedFiltersToApiQuery(filters: AppliedFilters): string {
    const params = new URLSearchParams();

    if (filters.price && (filters.price.min > 0 || filters.price.max !== Infinity)) {
        const max = filters.price.max === Infinity ? '' : String(filters.price.max);
        params.set('price', `${filters.price.min}-${max}`);
    }
    if (filters.brands.length) params.set('brand', filters.brands.join(','));
    if (filters.tags.length) params.set('tags', filters.tags.join(','));
    if (filters.rating) params.set('rating', String(filters.rating));
    if (filters.stockStatus.length) params.set('stock', filters.stockStatus.join(','));
    Object.entries(filters.attributes).forEach(([key, values]) => {
        if (values.length) params.set(key, values.join(','));
    });

    return params.toString();
}

/**
 * Build a page URL that reflects the given filters while preserving
 * non-filter params (sort, q, ...). Always drops `page` so a filter
 * change returns to the first page.
 */
export function buildFilterUrl(pathname: string, filters: AppliedFilters, baseQuery = ''): string {
    const params = new URLSearchParams(baseQuery);

    // Drop every existing filter param first so stale attributes disappear.
    Array.from(params.keys()).forEach((key) => {
        if (!isReservedParam(key)) params.delete(key);
    });
    params.delete('price');
    params.delete('brand');
    params.delete('tags');
    params.delete('rating');
    params.delete('stock');

    if (filters.price && (filters.price.min > 0 || filters.price.max !== Infinity)) {
        const max = filters.price.max === Infinity ? '' : String(filters.price.max);
        params.set('price', `${filters.price.min}-${max}`);
    }
    if (filters.brands.length) params.set('brand', filters.brands.join(','));
    if (filters.tags.length) params.set('tags', filters.tags.join(','));
    if (filters.rating) params.set('rating', String(filters.rating));
    if (filters.stockStatus.length) params.set('stock', filters.stockStatus.join(','));
    Object.entries(filters.attributes).forEach(([key, values]) => {
        if (values.length) params.set(key, values.join(','));
    });

    params.delete('page');

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
}

/** True when the URL carries at least one active filter (used for SEO/noindex). */
export function hasActiveFilters(params: SearchParamsLike): boolean {
    return countActiveFilters(parseAppliedFilters(params)) > 0;
}
