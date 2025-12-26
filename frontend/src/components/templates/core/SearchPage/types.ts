// Search Page Types - Cloned from CategoryPage for strict parity

import {
    Category,
    ProductListItem,
    PaginationState,
    AvailableFilters,
    BreadcrumbItem,
    BrandInfo,
    ActiveFilters,
    SortOption,
    CategoryPageTemplateProps as BaseCategoryPageTemplateProps
} from '../CategoryPage/types';
import { CategoryConfig } from '@/types/store';

// Re-export shared types
export type {
    Category,
    ProductListItem,
    PaginationState,
    AvailableFilters,
    BreadcrumbItem,
    BrandInfo,
    ActiveFilters,
    SortOption
};

// Search Page Specific Props
// We extend the base props but override specific needs or just strictly copy properties
export interface SearchPageTemplateProps {
    // We emulate Category object for compatibility or use 'query' as title
    query: string;
    breadcrumbs: BreadcrumbItem[];

    // Products
    products: ProductListItem[];
    isLoading: boolean;

    // Pagination
    pagination: PaginationState;
    onPageChange: (page: number) => void;
    onLoadMore: () => void; // Added to match CategoryPage

    // Sorting
    currentSort: string;
    sortOptions: SortOption[];
    onSortChange: (sort: string) => void;

    // Filters
    availableFilters: AvailableFilters | null;
    activeFilters: ActiveFilters;
    activeFilterCount: number;
    onFilterChange: (filterType: string, value: any) => void;
    onClearFilter: (filterType: string) => void;
    onRemoveFilterValue: (filterType: string, valueToRemove: string) => void;
    onClearAllFilters: () => void;

    // Staged filters
    stagedFilters?: Partial<ActiveFilters>;
    hasUnappliedChanges?: boolean;
    onApplyFilters?: () => void;
    onClearStagedFilters?: () => void;

    // Brand display helpers
    brandLookup?: Record<string, BrandInfo>;
    getBrandDisplay?: (brandId: string) => string;
    isFilterValueActive?: (filterType: string, value: string) => boolean;

    // Mobile filter state
    isFilterDrawerOpen: boolean;
    onOpenFilterDrawer: () => void;
    onCloseFilterDrawer: () => void;

    // Configuration
    config: CategoryConfig;
    currencySymbol: string;
    exchangeRate: number;
    currency: any;
    templateId: string;

    // Layout
    layout?: any;

    // Search Results Count
    totalProducts: number;
}

// Default Sort Options (Clone from CategoryPage or specific to search)
export const DEFAULT_SEARCH_SORT_OPTIONS: SortOption[] = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'bestselling', label: 'Best Selling' },
    { value: 'rating', label: 'Top Rated' },
];
