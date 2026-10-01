// SearchPage Container — SSR-driven search results.
//
// Same architecture as the CategoryPage container:
//   * the server renders the (filtered) results for the current URL,
//   * filter/sort/page changes only mutate the URL,
//   * the only client fetch is "load more".

'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { useCategoryFilters, BrandInfo } from '@/providers/CategoryFiltersContext';
import api from '@/lib/api';
import { appliedFiltersToApiQuery } from '@/lib/filters/category-filters';
import { getComponent } from '@/components/templates/registry';
import { CategoryConfig, CategoryFiltersConfig, DEFAULT_CATEGORY_CONFIG } from '@/types/store';
import {
    Category,
    ProductListItem,
    BreadcrumbItem,
    PaginationState,
    DEFAULT_SORT_OPTIONS,
    CategoryPageTemplateProps,
} from '../CategoryPage/types';
import { SearchPageContainerProps } from './types';

interface LoadMoreState {
    key: string;
    items: ProductListItem[];
    page: number;
    total: number;
    pages: number;
}

function SearchPageContainer({
    searchQuery,
    initialProducts = [],
    initialFilters = null,
    initialLayout = null,
    initialPagination = null,
    didYouMean,
    initialAppliedFilters,
    initialQueryString,
}: SearchPageContainerProps) {
    const { store, currentCurrency } = useStore();

    const filters = useCategoryFilters({
        initialFilters,
        appliedFilters: initialAppliedFilters,
        queryString: initialQueryString,
    });
    const { appliedFilters, activeFilterCount, navigate, updateBrandLookup } = filters;

    const params = useMemo(() => new URLSearchParams(initialQueryString), [initialQueryString]);

    // Live search query from the URL (falls back to the SSR value).
    const currentSearchQuery = params.get('q') || searchQuery;

    // Category config from theme (reuse category config for search)
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
    const storeId = store?._id;

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadMore, setLoadMore] = useState<LoadMoreState | null>(null);

    const queryKey = initialQueryString;
    const isLoadMoreCurrent = loadMore !== null && loadMore.key === queryKey;

    const products = useMemo<ProductListItem[]>(
        () => (isLoadMoreCurrent && loadMore ? [...initialProducts, ...loadMore.items] : initialProducts),
        [initialProducts, isLoadMoreCurrent, loadMore]
    );

    const pageParam = params.get('page');
    const serverPagination = useMemo<PaginationState>(() => {
        const page = parseInt(pageParam || '1', 10);
        return {
            page: Number.isFinite(page) && page > 0 ? page : 1,
            limit: initialPagination?.limit || config.grid?.productsPerPage || 24,
            total: initialPagination?.total || 0,
            pages: initialPagination?.pages || 0,
        };
    }, [pageParam, initialPagination, config.grid?.productsPerPage]);

    const pagination = useMemo<PaginationState>(
        () => (isLoadMoreCurrent && loadMore
            ? { ...serverPagination, page: loadMore.page, total: loadMore.total, pages: loadMore.pages }
            : serverPagination),
        [isLoadMoreCurrent, loadMore, serverPagination]
    );

    const isLoading = filters.isPending || isLoadingMore;
    const currentSort = params.get('sort') || config.sorting?.defaultSort || 'featured';

    // Synthetic category for the search listing
    const searchCategory: Category = useMemo(() => ({
        _id: 'search',
        title: currentSearchQuery ? `Search Results for "${currentSearchQuery}"` : 'Search Results',
        slug: 'search',
        description: currentSearchQuery
            ? `Showing results for "${currentSearchQuery}"`
            : 'Enter a search term to find products',
    }), [currentSearchQuery]);

    const breadcrumbs = useMemo<BreadcrumbItem[]>(() => ([
        { label: 'Home', href: '/' },
        { label: 'Search Results' },
    ]), []);

    // Serialised filter params for the client-side "load more" request.
    const filterQuery = useMemo(() => appliedFiltersToApiQuery(appliedFilters), [appliedFilters]);

    // Latest-value ref: keeps every handler below referentially stable.
    const latest = {
        storeId,
        search: currentSearchQuery,
        limit: pagination.limit,
        sort: currentSort,
        filterQuery,
        queryKey,
        page: pagination.page,
        pages: pagination.pages,
        total: pagination.total,
    };
    const latestRef = useRef(latest);
    useEffect(() => {
        latestRef.current = latest;
    });

    const inFlightRef = useRef(false);

    const fetchMore = useCallback(async (nextPage: number) => {
        if (inFlightRef.current) return;

        const s = latestRef.current;
        if (!s.storeId || !s.search) return;

        inFlightRef.current = true;
        setIsLoadingMore(true);
        try {
            const params = new URLSearchParams({
                storeId: s.storeId,
                search: s.search,
                page: String(nextPage),
                limit: String(s.limit),
                sort: s.sort,
                view: 'listing',
            });

            const response = await api.get(`products?${params.toString()}${s.filterQuery ? `&${s.filterQuery}` : ''}`);
            const incoming: ProductListItem[] = response.products || [];

            setLoadMore((prev) => {
                const base = prev && prev.key === s.queryKey ? prev.items : [];
                const existing = new Set(base.map((p) => p._id));
                return {
                    key: s.queryKey,
                    items: [...base, ...incoming.filter((p) => !existing.has(p._id))],
                    page: nextPage,
                    total: response.pagination?.total ?? s.total,
                    pages: response.pagination?.pages ?? s.pages,
                };
            });

            if (Array.isArray(response.activeFilters?.brand)) {
                const brands: BrandInfo[] = response.activeFilters.brand
                    .filter((b: any) => typeof b === 'object' && b.id)
                    .map((b: any) => ({ id: b.id, name: b.name, slug: b.slug || b.id }));
                if (brands.length > 0) updateBrandLookup(brands);
            }
        } catch (error) {
            console.error('Failed to load more search results:', error);
        } finally {
            inFlightRef.current = false;
            setIsLoadingMore(false);
        }
    }, [updateBrandLookup]);

    const handleLoadMore = useCallback(() => {
        if (inFlightRef.current) return;
        const { page, pages } = latestRef.current;
        const nextPage = page + 1;
        if (nextPage > pages) return;
        void fetchMore(nextPage);
    }, [fetchMore]);

    const handlePageChange = useCallback((page: number) => {
        setLoadMore(null);
        const params = new URLSearchParams(latestRef.current.queryKey);
        params.set('page', String(page));
        navigate(`?${params.toString()}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [navigate]);

    const handleSortChange = useCallback((sort: string) => {
        setLoadMore(null);
        const params = new URLSearchParams(latestRef.current.queryKey);
        params.set('sort', sort);
        params.delete('page');
        navigate(`?${params.toString()}`);
    }, [navigate]);

    const handleOpenFilterDrawer = useCallback(() => setIsFilterDrawerOpen(true), []);
    const handleCloseFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

    const sortOptions = useMemo(() => {
        const availableOptions = config.sorting?.availableSortOptions;
        if (availableOptions?.length) {
            return DEFAULT_SORT_OPTIONS.filter((opt) => availableOptions.includes(opt.value));
        }
        return DEFAULT_SORT_OPTIONS;
    }, [config.sorting?.availableSortOptions]);

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
            activeFilters={appliedFilters}
            activeFilterCount={activeFilterCount}
            onFilterChange={filters.stageFilterChange}
            onClearFilter={filters.clearFilter}
            onRemoveFilterValue={filters.removeFilterValue}
            onClearAllFilters={filters.clearAllFilters}
            isFilterDrawerOpen={isFilterDrawerOpen}
            onOpenFilterDrawer={handleOpenFilterDrawer}
            onCloseFilterDrawer={handleCloseFilterDrawer}
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

const MemoizedSearchPageContainer = React.memo(SearchPageContainer);
MemoizedSearchPageContainer.displayName = 'SearchPageContainer';

export default MemoizedSearchPageContainer;
