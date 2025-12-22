// CategoryPage Types - Shared props for container and templates

import { CategoryConfig } from '@/types/store';

// Category data from API
export interface Category {
    _id: string;
    title: string;
    slug: string;
    description?: string;
    image?: string;
    parentCategory?: {
        _id: string;
        title: string;
        slug: string;
    };
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
    };
}

// Product data (simplified for listing)
export interface ProductListItem {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images: string[];
    brand?: string;
    averageRating?: number;
    reviewCount?: number;
    stockStatus?: string;
    isNew?: boolean;
    isOnSale?: boolean;
    discountPercent?: number;
}

// Filter option with count
export interface FilterOption {
    value: string;
    label?: string;
    count: number;
}

// Attribute filter definition
export interface AttributeFilter {
    _id: string;
    name: string;
    slug: string;
    type: 'select' | 'color' | 'size' | 'text';
    values: FilterOption[];
    options?: Array<{ value: string; label: string; colorCode?: string }>;
}

// Available filters from API
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

// Active filters state
export interface ActiveFilters {
    price?: { min: number; max: number };
    brands?: string[];
    tags?: string[];
    rating?: number;
    stockStatus?: string[];
    attributes?: Record<string, string[]>;
}

// Breadcrumb item
export interface BreadcrumbItem {
    label: string;
    href?: string;
}

// Pagination state
export interface PaginationState {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

// Sort option
export interface SortOption {
    value: string;
    label: string;
}

// Container props (passed to template)
export interface CategoryPageTemplateProps {
    // Category data
    category: Category;
    breadcrumbs: BreadcrumbItem[];

    // Products
    products: ProductListItem[];
    isLoading: boolean;

    // Pagination
    pagination: PaginationState;
    onPageChange: (page: number) => void;
    onLoadMore: () => void;

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
    onClearAllFilters: () => void;

    // Staged filters (Apply Filters button)
    stagedFilters?: ActiveFilters;
    hasUnappliedChanges?: boolean;
    onApplyFilters?: () => void;
    onClearStagedFilters?: () => void;

    // Mobile filter state
    isFilterDrawerOpen: boolean;
    onOpenFilterDrawer: () => void;
    onCloseFilterDrawer: () => void;

    // Configuration
    config: CategoryConfig;
    currencySymbol: string;
    exchangeRate: number;  // Exchange rate for multi-currency price conversion
    templateId: string;

    // Layout
    layout?: any;
}

// Default sort options
export const DEFAULT_SORT_OPTIONS: SortOption[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'bestselling', label: 'Best Selling' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'alphabetical', label: 'A - Z' },
];
