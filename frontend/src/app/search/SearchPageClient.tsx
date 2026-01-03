// SearchPage Client Component - Receives pre-fetched SSR data
// Uses template-based rendering with store context

'use client';

import { useEffect } from 'react';
import { getComponent } from '@/components/templates/registry';
import { useStore } from '@/providers/StoreProvider';
import { useInterest } from '@/providers/InterestProvider';

interface SearchPageClientProps {
    searchQuery: string;
    initialProducts?: any[];
    initialFilters?: any;
    initialLayout?: any;
    initialPagination?: any;
    didYouMean?: string;
}

export default function SearchPageClient({
    searchQuery,
    initialProducts = [],
    initialFilters = null,
    initialLayout = null,
    initialPagination = null,
    didYouMean,
}: SearchPageClientProps) {
    const { store } = useStore();
    const { trackSearch } = useInterest();
    const templateId = store?.theme?.templateId || 'modern-clean';

    // Track search query for personalized recommendations
    useEffect(() => {
        if (searchQuery && searchQuery.trim().length > 1) {
            trackSearch(searchQuery);
        }
    }, [searchQuery, trackSearch]);

    // Get the SearchPage container component
    const SearchPage = getComponent('SearchPage', templateId);

    return (
        <SearchPage
            searchQuery={searchQuery}
            initialProducts={initialProducts}
            initialFilters={initialFilters}
            initialLayout={initialLayout}
            initialPagination={initialPagination}
            didYouMean={didYouMean}
        />
    );
}

