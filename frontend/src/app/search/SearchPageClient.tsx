// SearchPage Client Component - Receives pre-fetched SSR data
// Uses template-based rendering with store context

'use client';

import { getComponent } from '@/components/templates/registry';
import { useStore } from '@/providers/StoreProvider';

interface SearchPageClientProps {
    searchQuery: string;
    initialProducts?: any[];
    initialFilters?: any;
    initialLayout?: any;
    initialPagination?: any;
}

export default function SearchPageClient({
    searchQuery,
    initialProducts = [],
    initialFilters = null,
    initialLayout = null,
    initialPagination = null,
}: SearchPageClientProps) {
    const { store } = useStore();
    const templateId = store?.theme?.templateId || 'modern-clean';

    // Get the SearchPage container component
    const SearchPage = getComponent('SearchPage', templateId);

    return (
        <SearchPage
            searchQuery={searchQuery}
            initialProducts={initialProducts}
            initialFilters={initialFilters}
            initialLayout={initialLayout}
            initialPagination={initialPagination}
        />
    );
}
