// CategoryPage Container - Business logic, data fetching, state management
// Follows the pattern: Container handles logic, Template handles presentation

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useStore } from '@/providers/StoreProvider';
import api from '@/lib/api';
import { getComponent } from '@/components/templates/registry';
import { CategoryConfig, DEFAULT_CATEGORY_CONFIG } from '@/types/store';
import {
    Category,
    ProductListItem,
    AvailableFilters,
    ActiveFilters,
    BreadcrumbItem,
    PaginationState,
    DEFAULT_SORT_OPTIONS,
    CategoryPageTemplateProps,
} from './types';

interface CategoryPageContainerProps {
    category: Category;
    initialProducts?: ProductListItem[];
    initialFilters?: AvailableFilters | null;
    initialLayout?: any;
}

export default function CategoryPageContainer({
    category,
    initialProducts = [],
    initialFilters = null,
    initialLayout = null,
}: CategoryPageContainerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { store, currentCurrency } = useStore();

    // Get category config from theme
    const config: CategoryConfig = useMemo(() => ({
        ...DEFAULT_CATEGORY_CONFIG,
        ...store?.theme?.category,
    }), [store?.theme?.category]);
    console.log('store?.theme?.category', store?.theme?.category);
    const templateId = store?.theme?.templateId || 'modern-clean';
    const currencySymbol = currentCurrency?.symbol || (store?.currency === 'INR' ? '₹' : store?.currency === 'EUR' ? '€' : '$');
    const exchangeRate = currentCurrency?.exchangeRate || 1;

    // State
    const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
    const [availableFilters, setAvailableFilters] = useState<AvailableFilters | null>(initialFilters);
    const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Staged filters (not yet applied to URL)
    const [stagedFilters, setStagedFilters] = useState<ActiveFilters>({});
    const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);

    // Pagination state
    const [pagination, setPagination] = useState<PaginationState>({
        page: parseInt(searchParams.get('page') || '1'),
        limit: config.grid?.productsPerPage || 24,
        total: 0,
        pages: 0,
    });

    // Parse active filters from URL
    const activeFilters = useMemo<ActiveFilters>(() => {
        const filters: ActiveFilters = {};

        // Price range
        const priceParam = searchParams.get('price');
        if (priceParam) {
            const [min, max] = priceParam.split('-').map(v => parseFloat(v));
            if (!isNaN(min) || !isNaN(max)) {
                filters.price = { min: min || 0, max: max || Infinity };
            }
        }

        // Brands
        const brandsParam = searchParams.get('brand');
        if (brandsParam) {
            filters.brands = brandsParam.split(',');
        }

        // Tags
        const tagsParam = searchParams.get('tags');
        if (tagsParam) {
            filters.tags = tagsParam.split(',');
        }

        // Rating
        const ratingParam = searchParams.get('rating');
        if (ratingParam) {
            filters.rating = parseInt(ratingParam);
        }

        // Stock status
        const stockParam = searchParams.get('stock');
        if (stockParam) {
            filters.stockStatus = stockParam.split(',');
        }

        // Attribute filters (from URL params matching available filter slugs)
        if (availableFilters?.attributes) {
            const attrFilters: Record<string, string[]> = {};
            availableFilters.attributes.forEach(attr => {
                const param = searchParams.get(attr.slug);
                if (param) {
                    attrFilters[attr.slug] = param.split(',');
                }
            });
            if (Object.keys(attrFilters).length > 0) {
                filters.attributes = attrFilters;
            }
        }

        return filters;
    }, [searchParams, availableFilters]);

    // Current sort
    const currentSort = searchParams.get('sort') || config.sorting?.defaultSort || 'featured';

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (activeFilters.price) count++;
        if (activeFilters.brands?.length) count += activeFilters.brands.length;
        if (activeFilters.tags?.length) count += activeFilters.tags.length;
        if (activeFilters.rating) count++;
        if (activeFilters.stockStatus?.length) count += activeFilters.stockStatus.length;
        if (activeFilters.attributes) {
            Object.values(activeFilters.attributes).forEach(vals => {
                count += vals.length;
            });
        }
        return count;
    }, [activeFilters]);

    // Build breadcrumbs
    const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
        const crumbs: BreadcrumbItem[] = [
            { label: 'Home', href: '/' },
        ];

        if (category.parentCategory) {
            crumbs.push({
                label: category.parentCategory.title,
                href: `/category/${category.parentCategory.slug}`,
            });
        }

        crumbs.push({ label: category.title });

        return crumbs;
    }, [category]);

    // Build URL with filters
    const buildFilterUrl = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '') {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        // Reset to page 1 when filters change (except for page changes)
        if (!updates.hasOwnProperty('page')) {
            params.delete('page');
        }

        const query = params.toString();
        return query ? `${pathname}?${query}` : pathname;
    }, [searchParams, pathname]);

    // Fetch products
    const fetchProducts = useCallback(async (options: { page?: number; append?: boolean } = {}) => {
        if (!store?._id) return;

        const page = options.page || 1;
        const append = options.append || false;

        setIsLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            params.set('storeId', store._id);
            if (category._id && category._id !== 'all-products') {
                params.set('categoryId', category._id);
            }
            params.set('page', page.toString());
            params.set('limit', pagination.limit.toString());
            params.set('sort', currentSort);

            // Add active filters
            if (activeFilters.price) {
                params.set('price', `${activeFilters.price.min}-${activeFilters.price.max === Infinity ? '' : activeFilters.price.max}`);
            }
            if (activeFilters.brands?.length) {
                params.set('brand', activeFilters.brands.join(','));
            }
            if (activeFilters.tags?.length) {
                params.set('tags', activeFilters.tags.join(','));
            }
            if (activeFilters.rating) {
                params.set('rating', activeFilters.rating.toString());
            }
            if (activeFilters.stockStatus?.length) {
                params.set('stock', activeFilters.stockStatus.join(','));
            }
            if (activeFilters.attributes) {
                Object.entries(activeFilters.attributes).forEach(([key, values]) => {
                    params.set(key, values.join(','));
                });
            }

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
    }, [store?._id, category._id, pagination.limit, currentSort, activeFilters, api]);

    // Fetch available filters
    const fetchFilters = useCallback(async () => {

        if (!store?._id || availableFilters) return;

        // If "all-products", we now support fetching global filters.

        try {
            const response = await api.get(`/categories/${category._id}/filters?storeId=${store._id}`);
            setAvailableFilters(response);
        } catch (error) {
            console.error('Failed to fetch filters:', error);
        }
    }, [store?._id, category._id, availableFilters, api]);

    // Initial fetch
    useEffect(() => {
        fetchFilters();
    }, [fetchFilters]);

    useEffect(() => {
        // Fetch products when dependencies change (filters, sort, or URL params)
        const currentPage = parseInt(searchParams.get('page') || '1');
        fetchProducts({ page: currentPage });
    }, [fetchProducts, searchParams]);

    // Handler: Page change
    const handlePageChange = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, page }));
        router.push(buildFilterUrl({ page: page.toString() }), { scroll: false });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [router, buildFilterUrl]);

    // Handler: Load more
    const handleLoadMore = useCallback(async () => {
        if (!store?._id || isLoading) return;

        const nextPage = pagination.page + 1;
        if (nextPage > pagination.pages) return;

        await fetchProducts({ page: nextPage, append: true });
    }, [store?._id, isLoading, pagination.page, pagination.pages, fetchProducts]);

    // Handler: Sort change
    const handleSortChange = useCallback((sort: string) => {
        router.push(buildFilterUrl({ sort }), { scroll: false });
    }, [router, buildFilterUrl]);

    // Handler: Filter change (now stages changes locally)
    const handleFilterChange = useCallback((filterType: string, value: any) => {
        setStagedFilters(prev => {
            const updated = { ...prev };

            switch (filterType) {
                case 'price':
                    updated.price = value && (value.min > 0 || value.max < Infinity) ? value : undefined;
                    break;
                case 'brand':
                    updated.brands = value !== null ? value : undefined;
                    break;
                case 'tags':
                    updated.tags = value !== null ? value : undefined;
                    break;
                case 'rating':
                    updated.rating = value || undefined;
                    break;
                case 'stock':
                    updated.stockStatus = value !== null ? value : undefined;
                    break;
                default:
                    // Attribute filter
                    if (!updated.attributes) updated.attributes = {};
                    if (value !== null) {
                        updated.attributes[filterType] = value;
                    } else {
                        delete updated.attributes[filterType];
                    }
                    break;
            }

            return updated;
        });
        setHasUnappliedChanges(true);
    }, []);

    // Handler: Apply staged filters to URL (triggers API call)
    const handleApplyFilters = useCallback(() => {
        const updates: Record<string, string | null> = {};

        // Build updates from staged filters
        if (stagedFilters.price) {
            updates.price = `${stagedFilters.price.min}-${stagedFilters.price.max === Infinity ? '' : stagedFilters.price.max}`;
        }
        if (stagedFilters.brands !== undefined) {
            updates.brand = stagedFilters.brands.length ? stagedFilters.brands.join(',') : null;
        }
        if (stagedFilters.tags !== undefined) {
            updates.tags = stagedFilters.tags.length ? stagedFilters.tags.join(',') : null;
        }
        if (stagedFilters.rating) {
            updates.rating = stagedFilters.rating.toString();
        }
        if (stagedFilters.stockStatus !== undefined) {
            updates.stock = stagedFilters.stockStatus.length ? stagedFilters.stockStatus.join(',') : null;
        }
        if (stagedFilters.attributes) {
            Object.entries(stagedFilters.attributes).forEach(([key, values]) => {
                updates[key] = values.length ? values.join(',') : null;
            });
        }

        router.push(buildFilterUrl(updates), { scroll: false });
        setHasUnappliedChanges(false);
        setStagedFilters({});
    }, [stagedFilters, router, buildFilterUrl]);

    // Handler: Clear staged filters
    const handleClearStagedFilters = useCallback(() => {
        setStagedFilters({});
        setHasUnappliedChanges(false);
    }, []);

    // Handler: Clear single filter
    const handleClearFilter = useCallback((filterType: string) => {
        router.push(buildFilterUrl({ [filterType]: null }), { scroll: false });
    }, [router, buildFilterUrl]);

    // Handler: Clear all filters
    const handleClearAllFilters = useCallback(() => {
        const updates: Record<string, null> = {
            price: null,
            brand: null,
            tags: null,
            rating: null,
            stock: null,
        };

        // Also clear attribute filters
        availableFilters?.attributes.forEach(attr => {
            updates[attr.slug] = null;
        });

        router.push(buildFilterUrl(updates), { scroll: false });
    }, [router, buildFilterUrl, availableFilters]);

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

    // Get the template component
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
            availableFilters={availableFilters}
            activeFilters={activeFilters}
            activeFilterCount={activeFilterCount}
            onFilterChange={handleFilterChange}
            onClearFilter={handleClearFilter}
            onClearAllFilters={handleClearAllFilters}
            isFilterDrawerOpen={isFilterDrawerOpen}
            onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
            onCloseFilterDrawer={() => setIsFilterDrawerOpen(false)}
            config={config}
            currencySymbol={currencySymbol}
            exchangeRate={exchangeRate}
            currency={currentCurrency || 'USD'}
            templateId={templateId}
            layout={initialLayout}
            stagedFilters={stagedFilters}
            hasUnappliedChanges={hasUnappliedChanges}
            onApplyFilters={handleApplyFilters}
            onClearStagedFilters={handleClearStagedFilters}
        />
    );
}
