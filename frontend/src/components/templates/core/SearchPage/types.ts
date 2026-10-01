// SearchPage Types - Extends CategoryPage types with search-specific props

export * from '../CategoryPage/types';

import { CategoryPageTemplateProps } from '../CategoryPage/types';
import { AppliedFilters } from '@/lib/filters/category-filters';

// Search page container props
export interface SearchPageContainerProps {
    searchQuery: string;
    initialProducts?: any[];
    initialFilters?: any;
    initialLayout?: any;
    initialPagination?: any;
    didYouMean?: string;
    /** Filters parsed from the URL on the server. */
    initialAppliedFilters: AppliedFilters;
    /** Raw server query string (updates on every navigation). */
    initialQueryString: string;
}

// Search page template props - extends category template with search query
export interface SearchPageTemplateProps extends Omit<CategoryPageTemplateProps, 'category'> {
    searchQuery: string;
    didYouMean?: string;
    // Override category to be optional since search doesn't have a real category
    category?: CategoryPageTemplateProps['category'];
}
