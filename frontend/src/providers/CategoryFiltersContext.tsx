// ============================================================
// useCategoryFilters
// ------------------------------------------------------------
// URL-driven filter state for Category / Search product listings.
//
// Design contract:
//   * "Applied" filters are ALWAYS derived from the URL search params.
//     They are never mirrored into React state, so SSR and CSR render
//     exactly the same thing (no hydration mismatch, no double fetch).
//   * The only local state is the *staged* selection (the pending
//     checkbox state before the user hits "Apply"), which is a UI
//     affordance and never a source of truth.
//   * Every mutation goes through `navigate()` so a single transition
//     flag drives the pending/loading UI.
//
// This used to be a React context provider; it is now a plain hook
// because only the page container ever consumed it.
// ============================================================

'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    AppliedFilters,
    DEFAULT_APPLIED_FILTERS,
    buildFilterUrl,
    countActiveFilters,
} from '@/lib/filters/category-filters';

export type { AppliedFilters };
export { DEFAULT_APPLIED_FILTERS };

// ============================================
// Types (server-provided filter payloads)
// ============================================

export interface BrandInfo {
    id: string;
    name: string;
    slug: string;
}

export interface FilterOption {
    value: string;
    label?: string;
    count: number;
    status?: string;
}

export interface AttributeFilter {
    _id: string;
    name: string;
    slug: string;
    type: 'select' | 'color' | 'size' | 'text';
    values: FilterOption[];
    options?: Array<{ value: string; label: string; colorCode?: string }>;
}

export interface AvailableFilters {
    priceRange: { minPrice: number; maxPrice: number };
    brands: FilterOption[];
    tags: FilterOption[];
    ratings: FilterOption[];
    availability: FilterOption[];
    subcategories: Array<{
        _id: string;
        title: string;
        slug: string;
        image?: string;
        productCount: number;
    }>;
    attributes: AttributeFilter[];
}

export interface CategoryFiltersValue {
    /** Filters currently reflected in the URL. */
    appliedFilters: AppliedFilters;
    /** Pending selections, not yet applied to the URL. */
    stagedFilters: Partial<AppliedFilters>;
    /** Server-provided available filter options. */
    availableFilters: AvailableFilters | null;
    /** Brand id -> display info. */
    brandLookup: Record<string, BrandInfo>;
    updateBrandLookup: (brands: BrandInfo[]) => void;
    /** True while a URL navigation (transition) is in flight. */
    isPending: boolean;
    hasUnappliedChanges: boolean;
    activeFilterCount: number;
    /** Applied + staged (for rendering checkboxes). */
    getDisplayFilters: () => AppliedFilters;
    /** Single navigation gateway — drives `isPending`. */
    navigate: (href: string, options?: { scroll?: boolean }) => void;
    stageFilterChange: (filterType: string, value: any) => void;
    applyFilters: () => void;
    clearStagedFilters: () => void;
    clearFilter: (filterType: string) => void;
    removeFilterValue: (filterType: string, valueToRemove: string) => void;
    clearAllFilters: () => void;
    isFilterValueActive: (filterType: string, value: string) => boolean;
    getBrandDisplay: (brandId: string) => string;
}

// Deep-ish equality for staged vs applied filter values.
const filterValuesEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    try {
        return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    } catch {
        return false;
    }
};

interface UseCategoryFiltersOptions {
    /** Server-provided available filters (SSR). */
    initialFilters?: AvailableFilters | null;
    /**
     * Filters already applied — parsed from the URL **on the server** and
     * passed down as a prop. Using a prop instead of `useSearchParams()` keeps
     * the whole listing server-rendered (no client-render bailout, no skeleton)
     * and gives the browser the real LCP content in the first HTML byte.
     */
    appliedFilters: AppliedFilters;
    /** The raw query string from the server. Updates on every navigation. */
    queryString: string;
}

export function useCategoryFilters({
    initialFilters = null,
    appliedFilters,
    queryString,
}: UseCategoryFiltersOptions): CategoryFiltersValue {
    const router = useRouter();
    const pathname = usePathname();

    // ---------------------------------------------------------
    // Derived (never state) — the server owns the URL truth
    // ---------------------------------------------------------
    const searchParamsString = queryString;
    const activeFilterCount = useMemo(() => countActiveFilters(appliedFilters), [appliedFilters]);

    const [stagedFilters, setStagedFilters] = useState<Partial<AppliedFilters>>({});
    const [apiBrandLookup, setApiBrandLookup] = useState<Record<string, BrandInfo>>({});
    const [isPending, startTransition] = useTransition();

    // ---------------------------------------------------------
    // Navigation gateway — one transition covers every mutation
    // ---------------------------------------------------------
    const navigate = useCallback(
        (href: string, options?: { scroll?: boolean }) => {
            startTransition(() => {
                router.push(href, { scroll: options?.scroll ?? false });
            });
        },
        [router],
    );

    // ---------------------------------------------------------
    // Brand display lookup (derived from server filters + API)
    // ---------------------------------------------------------
    const brandLookup = useMemo<Record<string, BrandInfo>>(() => {
        const map: Record<string, BrandInfo> = {};
        initialFilters?.brands?.forEach((brand) => {
            map[brand.value] = {
                id: brand.value,
                name: brand.label || brand.value,
                slug: brand.value,
            };
        });
        return Object.keys(apiBrandLookup).length ? { ...map, ...apiBrandLookup } : map;
    }, [initialFilters, apiBrandLookup]);

    const updateBrandLookup = useCallback((brands: BrandInfo[]) => {
        setApiBrandLookup((prev) => {
            let changed = false;
            const updated = { ...prev };
            brands.forEach((brand) => {
                const existing = updated[brand.id];
                if (!existing || existing.name !== brand.name || existing.slug !== brand.slug) {
                    updated[brand.id] = brand;
                    changed = true;
                }
            });
            // Bail out when nothing changed to avoid an unnecessary re-render.
            return changed ? updated : prev;
        });
    }, []);

    const hasUnappliedChanges = useMemo(() => Object.keys(stagedFilters).length > 0, [stagedFilters]);

    const getDisplayFilters = useCallback((): AppliedFilters => {
        return {
            brands: stagedFilters.brands !== undefined ? stagedFilters.brands : appliedFilters.brands,
            tags: stagedFilters.tags !== undefined ? stagedFilters.tags : appliedFilters.tags,
            stockStatus: stagedFilters.stockStatus !== undefined ? stagedFilters.stockStatus : appliedFilters.stockStatus,
            rating: stagedFilters.rating !== undefined ? stagedFilters.rating : appliedFilters.rating,
            price: stagedFilters.price !== undefined ? stagedFilters.price : appliedFilters.price,
            attributes: {
                ...appliedFilters.attributes,
                ...(stagedFilters.attributes || {}),
            },
        };
    }, [appliedFilters, stagedFilters]);

    // Reconcile staged filters once the URL (appliedFilters) reflects them.
    // stagedFilters must NOT be cleared synchronously on Apply/Clear, otherwise
    // there is a frame where neither source holds the new value and the checkbox
    // visibly unchecks then re-checks while the navigation is still pending.
    useEffect(() => {
        if (Object.keys(stagedFilters).length === 0) return;

        setStagedFilters((prev) => {
            if (Object.keys(prev).length === 0) return prev;

            const next: Partial<AppliedFilters> = { ...prev };
            let changed = false;

            if (next.brands !== undefined && filterValuesEqual(next.brands, appliedFilters.brands)) {
                delete next.brands; changed = true;
            }
            if (next.tags !== undefined && filterValuesEqual(next.tags, appliedFilters.tags)) {
                delete next.tags; changed = true;
            }
            if (next.stockStatus !== undefined && filterValuesEqual(next.stockStatus, appliedFilters.stockStatus)) {
                delete next.stockStatus; changed = true;
            }
            if (next.rating !== undefined && next.rating === appliedFilters.rating) {
                delete next.rating; changed = true;
            }
            if (next.price !== undefined && filterValuesEqual(next.price, appliedFilters.price)) {
                delete next.price; changed = true;
            }
            if (next.attributes) {
                const attrs: Record<string, string[]> = { ...next.attributes };
                let attrChanged = false;
                Object.keys(attrs).forEach((key) => {
                    if (filterValuesEqual(attrs[key], appliedFilters.attributes[key] || [])) {
                        delete attrs[key];
                        attrChanged = true;
                    }
                });
                if (attrChanged) {
                    if (Object.keys(attrs).length === 0) delete next.attributes;
                    else next.attributes = attrs;
                    changed = true;
                }
            }

            return changed ? next : prev;
        });
    }, [appliedFilters, stagedFilters]);

    // ---------------------------------------------------------
    // Mutations
    // ---------------------------------------------------------
    const stageFilterChange = useCallback((filterType: string, value: any) => {
        setStagedFilters((prev) => {
            const updated = { ...prev };
            switch (filterType) {
                case 'price': updated.price = value; break;
                case 'brand': updated.brands = value || []; break;
                case 'tags': updated.tags = value || []; break;
                case 'rating': updated.rating = value; break;
                case 'stock': updated.stockStatus = value || []; break;
                default:
                    if (!updated.attributes) updated.attributes = {};
                    updated.attributes[filterType] = value || [];
                    break;
            }
            return updated;
        });
    }, []);

    const applyFilters = useCallback(() => {
        // Do NOT clear stagedFilters here — the reconciliation effect clears
        // them once the URL catches up, which avoids the checkbox flicker.
        navigate(buildFilterUrl(pathname, getDisplayFilters(), searchParamsString));
    }, [getDisplayFilters, navigate, pathname, searchParamsString]);

    const clearStagedFilters = useCallback(() => setStagedFilters({}), []);

    const clearFilter = useCallback((filterType: string) => {
        const newFilters: AppliedFilters = { ...appliedFilters, attributes: { ...appliedFilters.attributes } };

        switch (filterType) {
            case 'price': newFilters.price = null; break;
            case 'brand': newFilters.brands = []; break;
            case 'tags': newFilters.tags = []; break;
            case 'rating': newFilters.rating = null; break;
            case 'stock': newFilters.stockStatus = []; break;
            default: delete newFilters.attributes[filterType]; break;
        }

        navigate(buildFilterUrl(pathname, newFilters, searchParamsString));

        // Reflect the cleared value in staged so the UI updates immediately,
        // instead of deleting the key (which would fall back to the stale
        // applied value and make the checkbox flicker).
        setStagedFilters((prev) => {
            const updated: Partial<AppliedFilters> = { ...prev };
            switch (filterType) {
                case 'price': updated.price = null; break;
                case 'brand': updated.brands = []; break;
                case 'tags': updated.tags = []; break;
                case 'rating': updated.rating = null; break;
                case 'stock': updated.stockStatus = []; break;
                default:
                    if (!updated.attributes) updated.attributes = {};
                    updated.attributes[filterType] = [];
                    break;
            }
            return updated;
        });
    }, [appliedFilters, navigate, pathname, searchParamsString]);

    const removeFilterValue = useCallback((filterType: string, valueToRemove: string) => {
        const newFilters: AppliedFilters = { ...appliedFilters, attributes: { ...appliedFilters.attributes } };

        switch (filterType) {
            case 'brand':
                newFilters.brands = appliedFilters.brands.filter((b) => b !== valueToRemove);
                break;
            case 'tags':
                newFilters.tags = appliedFilters.tags.filter((t) => t !== valueToRemove);
                break;
            case 'stock':
                newFilters.stockStatus = appliedFilters.stockStatus.filter((s) => s !== valueToRemove);
                break;
            default:
                if (appliedFilters.attributes[filterType]) {
                    newFilters.attributes = {
                        ...appliedFilters.attributes,
                        [filterType]: appliedFilters.attributes[filterType].filter((v) => v !== valueToRemove),
                    };
                    if (newFilters.attributes[filterType].length === 0) {
                        delete newFilters.attributes[filterType];
                    }
                }
                break;
        }

        navigate(buildFilterUrl(pathname, newFilters, searchParamsString));

        setStagedFilters((prev) => {
            if (Object.keys(prev).length === 0) return prev;
            const updated = { ...prev };
            switch (filterType) {
                case 'brand':
                    if (updated.brands) updated.brands = updated.brands.filter((b) => b !== valueToRemove);
                    break;
                case 'tags':
                    if (updated.tags) updated.tags = updated.tags.filter((t) => t !== valueToRemove);
                    break;
                case 'stock':
                    if (updated.stockStatus) updated.stockStatus = updated.stockStatus.filter((s) => s !== valueToRemove);
                    break;
                default:
                    if (updated.attributes?.[filterType]) {
                        updated.attributes[filterType] = updated.attributes[filterType].filter((v) => v !== valueToRemove);
                    }
                    break;
            }
            return updated;
        });
    }, [appliedFilters, navigate, pathname, searchParamsString]);

    const clearAllFilters = useCallback(() => {
        const cleared: AppliedFilters = { ...DEFAULT_APPLIED_FILTERS, attributes: {} };
        navigate(buildFilterUrl(pathname, cleared, searchParamsString));
        setStagedFilters({});
    }, [navigate, pathname, searchParamsString]);

    const isFilterValueActive = useCallback((filterType: string, value: string): boolean => {
        const displayFilters = getDisplayFilters();
        switch (filterType) {
            case 'brand': return displayFilters.brands.includes(value);
            case 'tags': return displayFilters.tags.includes(value);
            case 'stock': return displayFilters.stockStatus.includes(value);
            default: return displayFilters.attributes[filterType]?.includes(value) || false;
        }
    }, [getDisplayFilters]);

    const getBrandDisplay = useCallback(
        (brandId: string): string => brandLookup[brandId]?.name || brandId,
        [brandLookup],
    );

    return useMemo<CategoryFiltersValue>(() => ({
        appliedFilters,
        stagedFilters,
        availableFilters: initialFilters,
        brandLookup,
        updateBrandLookup,
        isPending,
        hasUnappliedChanges,
        activeFilterCount,
        getDisplayFilters,
        navigate,
        stageFilterChange,
        applyFilters,
        clearStagedFilters,
        clearFilter,
        removeFilterValue,
        clearAllFilters,
        isFilterValueActive,
        getBrandDisplay,
    }), [
        appliedFilters,
        stagedFilters,
        initialFilters,
        brandLookup,
        updateBrandLookup,
        isPending,
        hasUnappliedChanges,
        activeFilterCount,
        getDisplayFilters,
        navigate,
        stageFilterChange,
        applyFilters,
        clearStagedFilters,
        clearFilter,
        removeFilterValue,
        clearAllFilters,
        isFilterValueActive,
        getBrandDisplay,
    ]);
}

export default useCategoryFilters;
