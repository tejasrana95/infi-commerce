// CategoryFiltersContext - Centralized filter state management for category pages
// Provides single source of truth for filter state, URL synchronization, and brand lookup

'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// ============================================
// Types
// ============================================

export interface AppliedFilters {
    brands: string[];           // Always stored as IDs
    tags: string[];
    stockStatus: string[];
    rating: number | null;
    price: { min: number; max: number } | null;
    attributes: Record<string, string[]>;
}

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

interface CategoryFiltersContextValue {
    // Applied filters (synced with URL)
    appliedFilters: AppliedFilters;

    // Staged filters (pending changes before "Apply")
    stagedFilters: Partial<AppliedFilters>;

    // Available filter options
    availableFilters: AvailableFilters | null;
    setAvailableFilters: (filters: AvailableFilters | null) => void;

    // Brand lookup for display names
    brandLookup: Record<string, BrandInfo>;
    updateBrandLookup: (brands: BrandInfo[]) => void;

    // Computed values
    hasUnappliedChanges: boolean;
    activeFilterCount: number;

    // Get merged filters (applied + staged) for display
    getDisplayFilters: () => AppliedFilters;

    // Actions
    stageFilterChange: (filterType: string, value: any) => void;
    applyFilters: () => void;
    clearStagedFilters: () => void;
    clearFilter: (filterType: string) => void;
    removeFilterValue: (filterType: string, valueToRemove: string) => void;
    clearAllFilters: () => void;

    // Utility
    isFilterValueActive: (filterType: string, value: string) => boolean;
    getBrandDisplay: (brandId: string) => string;
}

const DEFAULT_APPLIED_FILTERS: AppliedFilters = {
    brands: [],
    tags: [],
    stockStatus: [],
    rating: null,
    price: null,
    attributes: {},
};

// ============================================
// Context
// ============================================

const CategoryFiltersContext = createContext<CategoryFiltersContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface CategoryFiltersProviderProps {
    children: ReactNode;
    availableFilterSlugs?: string[]; // Attribute slugs to parse from URL
    initialFilters?: AvailableFilters | null; // Initial filters for SSR
}

export function CategoryFiltersProvider({
    children,
    availableFilterSlugs = [],
    initialFilters = null
}: CategoryFiltersProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // State - initialize with initialFilters for SSR
    const [availableFilters, setAvailableFilters] = useState<AvailableFilters | null>(initialFilters);
    const [brandLookup, setBrandLookup] = useState<Record<string, BrandInfo>>({});
    const [stagedFilters, setStagedFilters] = useState<Partial<AppliedFilters>>({});

    // Get attribute slugs from available filters
    const attributeSlugs = useMemo(() => {
        if (availableFilters?.attributes) {
            return availableFilters.attributes.map(a => a.slug);
        }
        return availableFilterSlugs;
    }, [availableFilters, availableFilterSlugs]);

    // Parse applied filters FROM URL (URL is source of truth)
    const appliedFilters = useMemo<AppliedFilters>(() => {
        const filters: AppliedFilters = { ...DEFAULT_APPLIED_FILTERS, attributes: {} };

        // Price
        const priceParam = searchParams.get('price');
        if (priceParam) {
            const [min, max] = priceParam.split('-').map(v => parseFloat(v));
            if (!isNaN(min) || !isNaN(max)) {
                filters.price = { min: min || 0, max: isNaN(max) ? Infinity : max };
            }
        }

        // Brands (always as IDs)
        const brandsParam = searchParams.get('brand');
        if (brandsParam) {
            filters.brands = brandsParam.split(',').filter(Boolean);
        }

        // Tags
        const tagsParam = searchParams.get('tags');
        if (tagsParam) {
            filters.tags = tagsParam.split(',').filter(Boolean);
        }

        // Rating
        const ratingParam = searchParams.get('rating');
        if (ratingParam) {
            const rating = parseInt(ratingParam);
            if (!isNaN(rating)) {
                filters.rating = rating;
            }
        }

        // Stock status
        const stockParam = searchParams.get('stock');
        if (stockParam) {
            filters.stockStatus = stockParam.split(',').filter(Boolean);
        }

        // Attribute filters
        attributeSlugs.forEach(slug => {
            const param = searchParams.get(slug);
            if (param) {
                filters.attributes[slug] = param.split(',').filter(Boolean);
            }
        });

        return filters;
    }, [searchParams, attributeSlugs]);

    // Update brand lookup when available filters change
    useEffect(() => {
        if (availableFilters?.brands) {
            setBrandLookup(prev => {
                const updated = { ...prev };
                availableFilters.brands.forEach(b => {
                    if (!updated[b.value]) {
                        updated[b.value] = {
                            id: b.value,
                            name: b.label || b.value,
                            slug: b.value,
                        };
                    }
                });
                return updated;
            });
        }
    }, [availableFilters]);

    // Update brand lookup from API response
    const updateBrandLookup = useCallback((brands: BrandInfo[]) => {
        setBrandLookup(prev => {
            const updated = { ...prev };
            brands.forEach(b => {
                updated[b.id] = b;
            });
            return updated;
        });
    }, []);

    // Check if there are unapplied changes
    const hasUnappliedChanges = useMemo(() => {
        return Object.keys(stagedFilters).length > 0;
    }, [stagedFilters]);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (appliedFilters.price) count++;
        count += appliedFilters.brands.length;
        count += appliedFilters.tags.length;
        if (appliedFilters.rating) count++;
        count += appliedFilters.stockStatus.length;
        Object.values(appliedFilters.attributes).forEach(vals => {
            count += vals.length;
        });
        return count;
    }, [appliedFilters]);

    // Get merged filters for display (applied + staged)
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

    // Build URL from filters
    const buildFilterUrl = useCallback((filters: AppliedFilters): string => {
        const params = new URLSearchParams(searchParams.toString());

        // Remove page when filters change
        params.delete('page');

        // Price
        if (filters.price && (filters.price.min > 0 || filters.price.max !== Infinity)) {
            const maxStr = filters.price.max === Infinity ? '' : filters.price.max.toString();
            params.set('price', `${filters.price.min}-${maxStr}`);
        } else {
            params.delete('price');
        }

        // Brands
        if (filters.brands.length > 0) {
            params.set('brand', filters.brands.join(','));
        } else {
            params.delete('brand');
        }

        // Tags
        if (filters.tags.length > 0) {
            params.set('tags', filters.tags.join(','));
        } else {
            params.delete('tags');
        }

        // Rating
        if (filters.rating) {
            params.set('rating', filters.rating.toString());
        } else {
            params.delete('rating');
        }

        // Stock
        if (filters.stockStatus.length > 0) {
            params.set('stock', filters.stockStatus.join(','));
        } else {
            params.delete('stock');
        }

        // Attributes
        attributeSlugs.forEach(slug => {
            if (filters.attributes[slug]?.length > 0) {
                params.set(slug, filters.attributes[slug].join(','));
            } else {
                params.delete(slug);
            }
        });

        const query = params.toString();
        return query ? `${pathname}?${query}` : pathname;
    }, [searchParams, pathname, attributeSlugs]);

    // Stage a filter change (doesn't apply immediately)
    const stageFilterChange = useCallback((filterType: string, value: any) => {
        setStagedFilters(prev => {
            const updated = { ...prev };

            switch (filterType) {
                case 'price':
                    updated.price = value;
                    break;
                case 'brand':
                    updated.brands = value || [];
                    break;
                case 'tags':
                    updated.tags = value || [];
                    break;
                case 'rating':
                    updated.rating = value;
                    break;
                case 'stock':
                    updated.stockStatus = value || [];
                    break;
                default:
                    // Attribute filter
                    if (!updated.attributes) updated.attributes = {};
                    updated.attributes[filterType] = value || [];
                    break;
            }

            return updated;
        });
    }, []);

    // Apply staged filters to URL
    const applyFilters = useCallback(() => {
        const mergedFilters = getDisplayFilters();
        const newUrl = buildFilterUrl(mergedFilters);
        router.push(newUrl, { scroll: false });
        setStagedFilters({});
    }, [getDisplayFilters, buildFilterUrl, router]);

    // Clear staged filters without applying
    const clearStagedFilters = useCallback(() => {
        setStagedFilters({});
    }, []);

    // Clear a single filter type (immediate URL update)
    const clearFilter = useCallback((filterType: string) => {
        const newFilters = { ...appliedFilters };

        switch (filterType) {
            case 'price':
                newFilters.price = null;
                break;
            case 'brand':
                newFilters.brands = [];
                break;
            case 'tags':
                newFilters.tags = [];
                break;
            case 'rating':
                newFilters.rating = null;
                break;
            case 'stock':
                newFilters.stockStatus = [];
                break;
            default:
                // Attribute filter
                delete newFilters.attributes[filterType];
                break;
        }

        const newUrl = buildFilterUrl(newFilters);
        router.push(newUrl, { scroll: false });

        // Also clear from staged
        setStagedFilters(prev => {
            const updated = { ...prev };
            switch (filterType) {
                case 'price': delete updated.price; break;
                case 'brand': delete updated.brands; break;
                case 'tags': delete updated.tags; break;
                case 'rating': delete updated.rating; break;
                case 'stock': delete updated.stockStatus; break;
                default:
                    if (updated.attributes) delete updated.attributes[filterType];
                    break;
            }
            return updated;
        });
    }, [appliedFilters, buildFilterUrl, router]);

    // Remove a single value from a filter (immediate URL update)
    const removeFilterValue = useCallback((filterType: string, valueToRemove: string) => {
        const newFilters = { ...appliedFilters };

        switch (filterType) {
            case 'brand':
                newFilters.brands = appliedFilters.brands.filter(b => b !== valueToRemove);
                break;
            case 'tags':
                newFilters.tags = appliedFilters.tags.filter(t => t !== valueToRemove);
                break;
            case 'stock':
                newFilters.stockStatus = appliedFilters.stockStatus.filter(s => s !== valueToRemove);
                break;
            default:
                // Attribute filter
                if (appliedFilters.attributes[filterType]) {
                    newFilters.attributes = {
                        ...appliedFilters.attributes,
                        [filterType]: appliedFilters.attributes[filterType].filter(v => v !== valueToRemove),
                    };
                    if (newFilters.attributes[filterType].length === 0) {
                        delete newFilters.attributes[filterType];
                    }
                }
                break;
        }

        const newUrl = buildFilterUrl(newFilters);
        router.push(newUrl, { scroll: false });

        // Also update staged if present
        setStagedFilters(prev => {
            if (Object.keys(prev).length === 0) return prev;
            const updated = { ...prev };
            switch (filterType) {
                case 'brand':
                    if (updated.brands) {
                        updated.brands = updated.brands.filter(b => b !== valueToRemove);
                    }
                    break;
                case 'tags':
                    if (updated.tags) {
                        updated.tags = updated.tags.filter(t => t !== valueToRemove);
                    }
                    break;
                case 'stock':
                    if (updated.stockStatus) {
                        updated.stockStatus = updated.stockStatus.filter(s => s !== valueToRemove);
                    }
                    break;
                default:
                    if (updated.attributes?.[filterType]) {
                        updated.attributes[filterType] = updated.attributes[filterType].filter(v => v !== valueToRemove);
                    }
                    break;
            }
            return updated;
        });
    }, [appliedFilters, buildFilterUrl, router]);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        const newFilters: AppliedFilters = { ...DEFAULT_APPLIED_FILTERS, attributes: {} };
        const newUrl = buildFilterUrl(newFilters);
        router.push(newUrl, { scroll: false });
        setStagedFilters({});
    }, [buildFilterUrl, router]);

    // Check if a filter value is currently active (considering staged changes)
    const isFilterValueActive = useCallback((filterType: string, value: string): boolean => {
        const displayFilters = getDisplayFilters();

        switch (filterType) {
            case 'brand':
                return displayFilters.brands.includes(value);
            case 'tags':
                return displayFilters.tags.includes(value);
            case 'stock':
                return displayFilters.stockStatus.includes(value);
            default:
                return displayFilters.attributes[filterType]?.includes(value) || false;
        }
    }, [getDisplayFilters]);

    // Get brand display name
    const getBrandDisplay = useCallback((brandId: string): string => {
        return brandLookup[brandId]?.name || brandId;
    }, [brandLookup]);

    const value: CategoryFiltersContextValue = {
        appliedFilters,
        stagedFilters,
        availableFilters,
        setAvailableFilters,
        brandLookup,
        updateBrandLookup,
        hasUnappliedChanges,
        activeFilterCount,
        getDisplayFilters,
        stageFilterChange,
        applyFilters,
        clearStagedFilters,
        clearFilter,
        removeFilterValue,
        clearAllFilters,
        isFilterValueActive,
        getBrandDisplay,
    };

    return (
        <CategoryFiltersContext.Provider value={value}>
            {children}
        </CategoryFiltersContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useCategoryFilters(): CategoryFiltersContextValue {
    const context = useContext(CategoryFiltersContext);
    if (!context) {
        throw new Error('useCategoryFilters must be used within a CategoryFiltersProvider');
    }
    return context;
}

export default CategoryFiltersContext;
