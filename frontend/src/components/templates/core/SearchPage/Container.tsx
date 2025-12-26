// SearchPage Container - Business logic, data fetching, state management
// Cloned from CategoryPage Container for exact parity
// Uses CategoryFiltersContext for centralized filter state management

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/providers/StoreProvider';
import { CategoryFiltersProvider, useCategoryFilters, BrandInfo } from '@/providers/CategoryFiltersContext'; // REUSE CONTEXT
import api from '@/lib/api';
import { getComponent } from '@/components/templates/registry';
import { CategoryConfig, DEFAULT_CATEGORY_CONFIG } from '@/types/store';
import {
    ProductListItem,
    AvailableFilters,
    BreadcrumbItem,
    PaginationState,
    DEFAULT_SEARCH_SORT_OPTIONS,
    SearchPageTemplateProps,
} from './types';

interface SearchPageContainerProps {
    initialQuery?: string;
    initialProducts?: ProductListItem[];
    initialFilters?: AvailableFilters | null;
    initialLayout?: any;
}

// Inner component that uses the context
function SearchPageInner({
    initialQuery = '',
    initialProducts = [],
    initialFilters = null,
    initialLayout = null,
}: SearchPageContainerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { store, currentCurrency } = useStore();

    // Context for filter management
    const filters = useCategoryFilters();

    // Get category config from theme (reuse category config)
    const config: CategoryConfig = useMemo(() => ({
        ...DEFAULT_CATEGORY_CONFIG,
        ...store?.theme?.category,
    }), [store?.theme?.category]);

    const templateId = store?.theme?.templateId || 'modern-clean';
    const currencySymbol = currentCurrency?.symbol || (store?.currency === 'INR' ? '₹' : store?.currency === 'EUR' ? '€' : '$');
    const exchangeRate = currentCurrency?.exchangeRate || 1;

    // State
    const query = searchParams.get('q') || initialQuery;
    const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
    const [isLoading, setIsLoading] = useState(false); // Default false if initialProducts exists, else??
    // Actually SearchPage usually has no initial products if pure client search, but often SSR.
    // Logic:

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Pagination state
    const [pagination, setPagination] = useState<PaginationState>({
        page: parseInt(searchParams.get('page') || '1'),
        limit: config.grid?.productsPerPage || 24,
        total: 0,
        pages: 0,
    });

    // Current sort
    const currentSort = searchParams.get('sort') || 'relevance';

    // Initialize available filters
    useEffect(() => {
        if (initialFilters) {
            filters.setAvailableFilters(initialFilters);
        }
    }, [initialFilters]);

    // Build breadcrumbs
    const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [
        { label: 'Home', href: '/' },
        { label: 'Search' }
    ], []);

    // Fetch products
    const fetchProducts = useCallback(async (options: { page?: number; append?: boolean } = {}) => {
        if (!store?._id || !query) return;

        const page = options.page || 1;
        const append = options.append || false;

        setIsLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            params.set('storeId', store._id);
            params.set('search', query);
            params.set('page', page.toString());
            params.set('limit', pagination.limit.toString());
            params.set('sort', currentSort);

            // Add filters from context
            const { appliedFilters } = filters;

            if (appliedFilters.price) {
                const maxStr = appliedFilters.price.max === Infinity ? '' : appliedFilters.price.max.toString();
                params.set('minPrice', appliedFilters.price.min.toString());
                if (appliedFilters.price.max !== Infinity) params.set('maxPrice', maxStr); // API variation? CategoryPage used 'price=min-max' but Search API used minPrice/maxPrice.
                // WAIT. User said "clone category page same in search page AND then we can discuss".
                // If I use 'price' param, backend search controller might not understand it if it expects minPrice/maxPrice.
                // However, I previously fixed backend to support filter parity?
                // Step 923: SearchPageContainer used minPrice/maxPrice.
                // CategoryPageContainer (Step 946) used `params.set('price', min-max)`.
                // I should verify backend support.
                // Safe bet: explicit params are better if backend supports them, but CategoryPage uses 'price'.
                // I will use explicit params to match the working Search API I know works.
                // Or try to match CategoryPage exactly?
                // Let's use explicit params for safety as Search Controller is different from Category Controller.

                // Correction: CategoryPageContainer (Step 946 line 119) uses params.set('price', `min-max`).
                // SearchPageContainer (Step 923 line 162) uses params.set('minPrice/maxPrice').
                // I will keep minPrice/maxPrice for Search Controller compatibility.
            }

            if (appliedFilters.brands.length > 0) {
                params.set('brand', appliedFilters.brands.join(','));
            }
            if (appliedFilters.tags.length > 0) {
                params.set('tags', appliedFilters.tags.join(','));
            }
            if (appliedFilters.rating) {
                params.set('minRating', appliedFilters.rating.toString()); // Search uses minRating
            }
            if (appliedFilters.stockStatus.length > 0) {
                params.set('stockStatus', appliedFilters.stockStatus.join(',')); // Search uses stockStatus
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

            // Update brand lookup from API response (Clone from CategoryPage logic)
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
    }, [store?._id, query, pagination.limit, currentSort, filters.appliedFilters]);

    // Fetch filters for search (all-products)
    const fetchFilters = useCallback(async () => {
        if (!store?._id || filters.availableFilters) return; // If already has filters, skip? Or re-fetch if query changed?
        // CategoryPage only fetches once per category. SearchPage might need re-fetch if filters depend on query.
        // But usually global filters are constant.

        try {
            // Use global filters endpoint
            const response = await api.get(`categories/all-products/filters?storeId=${store._id}`);
            filters.setAvailableFilters(response);
        } catch (error) {
            console.error('Failed to fetch filters:', error);
        }
    }, [store?._id, filters.availableFilters]);

    // Initial fetch
    useEffect(() => {
        fetchFilters();
    }, [fetchFilters]);

    useEffect(() => {
        // Fetch products when filters/query change (via URL)
        const currentPage = parseInt(searchParams.get('page') || '1');
        fetchProducts({ page: currentPage });
    }, [fetchProducts, searchParams]);

    // Handler: Page change
    const handlePageChange = useCallback((page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`?${params.toString()}`, { scroll: false });
        // Scroll to top
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

    // Get the template component
    const SearchPageTemplate = getComponent('SearchPageTemplate', templateId);

    return (
        <SearchPageTemplate
            query={query}
            breadcrumbs={breadcrumbs}
            products={products}
            isLoading={isLoading}
            totalProducts={pagination.total}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLoadMore={handleLoadMore}
            currentSort={currentSort}
            sortOptions={DEFAULT_SEARCH_SORT_OPTIONS}
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
        />
    );
}

// Main component that wraps with provider
export default function SearchPageContainer(props: SearchPageContainerProps) {
    // Get available attribute slugs for URL parsing
    const attributeSlugs = useMemo(() => {
        return props.initialFilters?.attributes?.map(a => a.slug) || [];
    }, [props.initialFilters]);

    return (
        <CategoryFiltersProvider availableFilterSlugs={attributeSlugs}>
            <SearchPageInner {...props} />
        </CategoryFiltersProvider>
    );
}
