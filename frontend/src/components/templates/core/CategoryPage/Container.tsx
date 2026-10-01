// CategoryPage Container — SSR-driven product listing.
//
// Architecture:
//   * The server renders the (filtered) product list from the URL query.
//   * Filter/sort/page changes only mutate the URL — Next re-renders the
//     Server Component and streams a fresh, correctly-filtered list.
//   * No duplicated product state: the rendered list is `initialProducts`
//     (from the server) plus, only for load-more/infinite-scroll, the pages
//     the user explicitly accumulated on the client.
//   * Loading is driven by the navigation transition, not hand-rolled state.

'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { useCategoryFilters, BrandInfo, AppliedFilters } from '@/providers/CategoryFiltersContext';
import api from '@/lib/api';
import { appliedFiltersToApiQuery } from '@/lib/filters/category-filters';
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
} from './types';

type LayoutModuleLike = {
    type?: string;
    config?: Record<string, unknown>;
};

type LayoutColumnLike = {
    modules?: LayoutModuleLike[];
};

type LayoutSectionLike = {
    modules?: LayoutModuleLike[];
    columns?: LayoutColumnLike[];
};

function findModuleConfig(
    layout: { sections?: LayoutSectionLike[] } | null | undefined,
    moduleType: string
): Partial<CategoryConfig['header']> | null {
    if (!layout?.sections?.length) return null;

    for (const section of layout.sections) {
        const directModule = section.modules?.find((m) => m.type === moduleType);
        if (directModule?.config) return directModule.config as Partial<CategoryConfig['header']>;

        const columnModule = section.columns
            ?.flatMap((col) => col.modules || [])
            ?.find((m) => m.type === moduleType);
        if (columnModule?.config) return columnModule.config as Partial<CategoryConfig['header']>;
    }

    return null;
}

interface CategoryPageContainerProps {
    category: Category;
    initialProducts?: ProductListItem[];
    initialFilters?: AvailableFilters | null;
    initialLayout?: any;
    initialPagination?: { total: number; pages: number; limit: number; page: number } | null;
    /** Filters parsed from the URL on the server. */
    initialAppliedFilters: AppliedFilters;
    /** Raw server query string (updates on every navigation). */
    initialQueryString: string;
}

/** Client-accumulated pages for load-more / infinite-scroll, keyed to the query. */
interface LoadMoreState {
    key: string;
    items: ProductListItem[];
    page: number;
    total: number;
    pages: number;
}

function CategoryPageContainer({
    category,
    initialProducts = [],
    initialFilters = null,
    initialLayout = null,
    initialPagination = null,
    initialAppliedFilters,
    initialQueryString,
}: CategoryPageContainerProps) {
    const { store, currentCurrency } = useStore();

    // URL-driven filter state — applied filters come from the SERVER, so this
    // component needs no useSearchParams() and stays fully server-rendered.
    const filters = useCategoryFilters({
        initialFilters,
        appliedFilters: initialAppliedFilters,
        queryString: initialQueryString,
    });
    const {
        appliedFilters,
        activeFilterCount,
        navigate,
        updateBrandLookup,
    } = filters;

    const headerModuleConfig = useMemo(
        () => findModuleConfig(initialLayout, 'category-header'),
        [initialLayout]
    );

    // Category config from theme + category header module (deep merge for nested objects)
    const config: CategoryConfig = useMemo(() => {
        const storeConfig: Partial<CategoryConfig> = store?.theme?.category || {};
        return {
            header: {
                ...DEFAULT_CATEGORY_CONFIG.header,
                ...storeConfig.header,
                ...headerModuleConfig,
            },
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
    }, [store?.theme?.category, headerModuleConfig]);

    const templateId = store?.theme?.templateId || 'modern-clean';
    const currencySymbol = currentCurrency?.symbol || (store?.currency === 'INR' ? '₹' : store?.currency === 'EUR' ? '€' : '$');
    const exchangeRate = currentCurrency?.exchangeRate || 1;
    // Extract primitive so memo dependency inference matches the declared deps
    const storeId = store?._id;

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadMore, setLoadMore] = useState<LoadMoreState | null>(null);

    // The query string is the identity of the current server-rendered page.
    const params = useMemo(() => new URLSearchParams(initialQueryString), [initialQueryString]);
    const queryKey = initialQueryString;
    const isLoadMoreCurrent = loadMore !== null && loadMore.key === queryKey;

    // Products = server-rendered page [+ client-accumulated pages for load-more].
    // When the URL changes, accumulated pages are naturally discarded.
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

    // Single loading signal: the navigation transition (or a load-more request).
    const isLoading = filters.isPending || isLoadingMore;

    const currentSort = params.get('sort') || config.sorting?.defaultSort || 'featured';

    // Build breadcrumbs
    const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
        const crumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
        if (category.parentCategory) {
            crumbs.push({
                label: category.parentCategory.title,
                href: `/${category.parentCategory.slug}`,
            });
        }
        crumbs.push({ label: category.title });
        return crumbs;
    }, [category]);

    // Serialised filter params for the client-side "load more" request.
    const filterQuery = useMemo(() => appliedFiltersToApiQuery(appliedFilters), [appliedFilters]);

    // Latest-value ref: keeps every handler below referentially stable so the
    // memoized template re-renders only when the data it renders changes.
    const latest = {
        storeId,
        categoryId: category._id,
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

    // ---------------------------------------------------------
    // Load more (the only client-side data fetch left)
    // ---------------------------------------------------------
    const fetchMore = useCallback(async (nextPage: number) => {
        // De-dupe concurrent triggers (e.g. an IntersectionObserver that fires
        // more than once before state settles).
        if (inFlightRef.current) return;

        const s = latestRef.current;
        if (!s.storeId) return;

        inFlightRef.current = true;
        setIsLoadingMore(true);
        try {
            const params = new URLSearchParams({
                storeId: s.storeId,
                page: String(nextPage),
                limit: String(s.limit),
                sort: s.sort,
                view: 'listing',
            });
            if (s.categoryId && s.categoryId !== 'all-products') {
                params.set('categoryId', s.categoryId);
            }

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
            console.error('Failed to load more products:', error);
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

    // ---------------------------------------------------------
    // Pagination / sorting → URL only (server does the work)
    // ---------------------------------------------------------
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

    // Stable drawer handlers (avoid new function identities on every render)
    const handleOpenFilterDrawer = useCallback(() => setIsFilterDrawerOpen(true), []);
    const handleCloseFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

    // Get sort options (filtered based on config)
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
            category={category}
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
        />
    );
}

const MemoizedCategoryPageContainer = React.memo(CategoryPageContainer);
MemoizedCategoryPageContainer.displayName = 'CategoryPageContainer';

export default MemoizedCategoryPageContainer;
