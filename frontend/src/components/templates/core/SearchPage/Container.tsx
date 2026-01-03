// SearchPage Container - Business logic, data fetching, state management
// Reuses CategoryFiltersContext and CategoryConfig for identical behavior

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/providers/StoreProvider';
import { CategoryFiltersProvider, useCategoryFilters, BrandInfo } from '@/providers/CategoryFiltersContext';
import api from '@/lib/api';
import { getComponent } from '@/components/templates/registry';
import { CategoryConfig, CategoryFiltersConfig, DEFAULT_CATEGORY_CONFIG } from '@/types/store';
import {
    Category,
    ProductListItem,
    AvailableFilters,
    BreadcrumbItem,
    PaginationState,
    DEFAULT_SORT_OPTIONS,
    CategoryPageTemplateProps,
} from '../CategoryPage/types';
import { SearchPageContainerProps } from './types';

// Inner component that uses the context
function SearchPageInner({
    searchQuery,
    initialProducts = [],
    initialFilters = null,
    initialLayout = null,
    initialPagination = null,
    didYouMean,
}: SearchPageContainerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { store, currentCurrency } = useStore();

    // Context for filter management
    const filters = useCategoryFilters();

    // Get category config from theme (reuse category config for search) - use deep merge for nested objects
    const config: CategoryConfig = useMemo(() => {
        const storeConfig: Partial<CategoryConfig> = store?.theme?.category || {};
        return {
            header: { ...DEFAULT_CATEGORY_CONFIG.header, ...storeConfig.header },
            grid: {
                ...DEFAULT_CATEGORY_CONFIG.grid,
                ...storeConfig.grid,
                productsPerRow: {
                    ...DEFAULT_CATEGORY_CONFIG.grid.productsPerRow,
                    ...storeConfig.grid?.productsPerRow,
                },
            },
            sorting: { ...DEFAULT_CATEGORY_CONFIG.sorting, ...storeConfig.sorting },
            pagination: { ...DEFAULT_CATEGORY_CONFIG.pagination, ...storeConfig.pagination },
            filters: {
                ...DEFAULT_CATEGORY_CONFIG.filters,
                ...storeConfig.filters,
                offCanvas: {
                    ...DEFAULT_CATEGORY_CONFIG.filters.offCanvas!,
                    ...storeConfig.filters?.offCanvas,
                } as CategoryFiltersConfig['offCanvas'],
            },
            subcategories: { ...DEFAULT_CATEGORY_CONFIG.subcategories, ...storeConfig.subcategories },
            emptyState: { ...DEFAULT_CATEGORY_CONFIG.emptyState, ...storeConfig.emptyState },
            seo: { ...DEFAULT_CATEGORY_CONFIG.seo, ...storeConfig.seo },
        };
    }, [store?.theme?.category]);

    const templateId = store?.theme?.templateId || 'modern-clean';
    const currencySymbol = currentCurrency?.symbol || (store?.currency === 'INR' ? '₹' : store?.currency === 'EUR' ? '€' : '$');
    const exchangeRate = currentCurrency?.exchangeRate || 1;

    // State
    const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
    const [isLoading, setIsLoading] = useState(initialProducts.length === 0 && searchQuery.length > 0);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Current search query from URL (for live updates)
    const currentSearchQuery = searchParams.get('q') || searchQuery;

    // Pagination state
    const [pagination, setPagination] = useState<PaginationState>({
        page: parseInt(searchParams.get('page') || '1'),
        limit: config.grid?.productsPerPage || 24,
        total: initialPagination?.total || 0,
        pages: initialPagination?.pages || 0,
    });

    // Current sort
    const currentSort = searchParams.get('sort') || config.sorting?.defaultSort || 'featured';

    // Create synthetic category for search results
    const searchCategory: Category = useMemo(() => ({
        _id: 'search',
        title: currentSearchQuery ? `Search Results for "${currentSearchQuery}"` : 'Search Results',
        slug: 'search',
        description: currentSearchQuery
            ? `Showing results for "${currentSearchQuery}"`
            : 'Enter a search term to find products',
    }), [currentSearchQuery]);

    // Build breadcrumbs
    const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
        const crumbs: BreadcrumbItem[] = [
            { label: 'Home', href: '/' },
            { label: 'Search Results' },
        ];
        return crumbs;
    }, []);

    // Initialize available filters from SSR or fetch on client if not available
    useEffect(() => {
        if (initialFilters) {
            filters.setAvailableFilters(initialFilters);
        } else if (store?._id && currentSearchQuery && !filters.availableFilters) {
            // Fetch search-specific filters on client side
            const fetchSearchFilters = async () => {
                try {
                    const response = await api.get(`products/search/filters?storeId=${store._id}&search=${encodeURIComponent(currentSearchQuery)}`);
                    if (response) {
                        filters.setAvailableFilters(response);
                    }
                } catch (error) {
                    console.error('Failed to fetch search filters:', error);
                }
            };
            fetchSearchFilters();
        }
    }, [initialFilters, store?._id, currentSearchQuery]);

    // Fetch products
    const fetchProducts = useCallback(async (options: { page?: number; append?: boolean } = {}) => {
        if (!store?._id || !currentSearchQuery) return;

        const page = options.page || 1;
        const append = options.append || false;

        setIsLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            params.set('storeId', store._id);
            params.set('search', currentSearchQuery);
            params.set('page', page.toString());
            params.set('limit', pagination.limit.toString());
            params.set('sort', currentSort);

            // Add filters from context (appliedFilters is derived from URL)
            const { appliedFilters } = filters;

            if (appliedFilters.price) {
                const maxStr = appliedFilters.price.max === Infinity ? '' : appliedFilters.price.max.toString();
                params.set('price', `${appliedFilters.price.min}-${maxStr}`);
            }
            if (appliedFilters.brands.length > 0) {
                params.set('brand', appliedFilters.brands.join(','));
            }
            if (appliedFilters.tags.length > 0) {
                params.set('tags', appliedFilters.tags.join(','));
            }
            if (appliedFilters.rating) {
                params.set('rating', appliedFilters.rating.toString());
            }
            if (appliedFilters.stockStatus.length > 0) {
                params.set('stock', appliedFilters.stockStatus.join(','));
            }
            Object.entries(appliedFilters.attributes).forEach(([key, values]) => {
                if (values.length > 0) {
                    params.set(key, values.join(','));
                }
            });

            const response = await api.get(`products?${params.toString()}`);

            if (append) {
                setProducts(prev => {
                    const existingIds = new Set(prev.map(p => p._id));
                    const newProducts = (response.products || []).filter((p: ProductListItem) => !existingIds.has(p._id));
                    return [...prev, ...newProducts];
                });
            } else {
                setProducts(response.products || []);
            }

            // Update brand lookup from API response
            if (response.activeFilters?.brand && Array.isArray(response.activeFilters.brand)) {
                const brands: BrandInfo[] = response.activeFilters.brand
                    .filter((b: any) => typeof b === 'object' && b.id)
                    .map((b: any) => ({
                        id: b.id,
                        name: b.name,
                        slug: b.slug || b.id,
                    }));
                if (brands.length > 0) {
                    filters.updateBrandLookup(brands);
                }
            }

            setPagination(prev => ({
                ...prev,
                page: page,
                total: response.pagination?.total || 0,
                pages: response.pagination?.pages || 0,
            }));
        } catch (error) {
            console.error('Failed to fetch products:', error);
            if (!append) setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, [store?._id, currentSearchQuery, pagination.limit, currentSort, filters.appliedFilters]);

    // Fetch when search query or filters change
    useEffect(() => {
        if (currentSearchQuery) {
            const currentPage = parseInt(searchParams.get('page') || '1');
            fetchProducts({ page: currentPage });
        } else {
            setProducts([]);
            setIsLoading(false);
        }
    }, [fetchProducts, searchParams, currentSearchQuery]);

    // Handler: Page change
    const handlePageChange = useCallback((page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`?${params.toString()}`, { scroll: false });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [router, searchParams]);

    // Handler: Load more
    const handleLoadMore = useCallback(async () => {
        if (!store?._id || isLoading) return;

        const nextPage = pagination.page + 1;
        if (nextPage > pagination.pages) return;

        await fetchProducts({ page: nextPage, append: true });
    }, [store?._id, isLoading, pagination.page, pagination.pages, fetchProducts]);

    // Handler: Sort change
    const handleSortChange = useCallback((sort: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', sort);
        params.delete('page');
        router.push(`?${params.toString()}`, { scroll: false });
    }, [router, searchParams]);

    // Get sort options (filtered based on config)
    const sortOptions = useMemo(() => {
        const availableOptions = config.sorting?.availableSortOptions;
        if (availableOptions?.length) {
            return DEFAULT_SORT_OPTIONS.filter(opt =>
                availableOptions.includes(opt.value)
            );
        }
        return DEFAULT_SORT_OPTIONS;
    }, [config.sorting?.availableSortOptions]);

    // Get the template component (reuse CategoryPageTemplate)
    const CategoryPageTemplate = getComponent<CategoryPageTemplateProps>(
        'CategoryPageTemplate',
        templateId
    );

    return (
        <CategoryPageTemplate
            category={searchCategory}
            breadcrumbs={breadcrumbs}
            products={products}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLoadMore={handleLoadMore}
            currentSort={currentSort}
            sortOptions={sortOptions}
            onSortChange={handleSortChange}
            availableFilters={filters.availableFilters}
            activeFilters={filters.appliedFilters}
            activeFilterCount={filters.activeFilterCount}
            onFilterChange={filters.stageFilterChange}
            onClearFilter={filters.clearFilter}
            onRemoveFilterValue={filters.removeFilterValue}
            onClearAllFilters={filters.clearAllFilters}
            isFilterDrawerOpen={isFilterDrawerOpen}
            onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
            onCloseFilterDrawer={() => setIsFilterDrawerOpen(false)}
            config={config}
            currencySymbol={currencySymbol}
            exchangeRate={exchangeRate}
            currency={currentCurrency || 'USD'}
            templateId={templateId}
            layout={initialLayout}
            stagedFilters={filters.stagedFilters}
            hasUnappliedChanges={filters.hasUnappliedChanges}
            onApplyFilters={filters.applyFilters}
            onClearStagedFilters={filters.clearStagedFilters}
            brandLookup={filters.brandLookup}
            getBrandDisplay={filters.getBrandDisplay}
            isFilterValueActive={filters.isFilterValueActive}
            didYouMean={didYouMean}
        />
    );
}

// Main component that wraps with provider
export default function SearchPageContainer(props: SearchPageContainerProps) {
    // Get available attribute slugs for URL parsing
    const attributeSlugs = useMemo(() => {
        return props.initialFilters?.attributes?.map((a: any) => a.slug) || [];
    }, [props.initialFilters]);

    return (
        <CategoryFiltersProvider availableFilterSlugs={attributeSlugs}>
            <SearchPageInner {...props} />
        </CategoryFiltersProvider>
    );
}
