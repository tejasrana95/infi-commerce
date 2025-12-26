// SearchPage Client Component - Receives pre-fetched SSR data
// Uses template-based rendering with store context

'use client';

import { getComponent } from '@/components/templates/registry';
import { useStore } from '@/providers/StoreProvider';
import { ProductListItem, AvailableFilters } from '@/components/templates/core/SearchPage/types';

interface SearchPageClientProps {
    initialQuery?: string;
    initialProducts?: ProductListItem[];
    initialFilters?: AvailableFilters | null;
    initialLayout?: any;
}

export default function SearchPageClient({
    initialQuery = '',
    initialProducts = [],
    initialFilters = null,
    initialLayout = null,
}: SearchPageClientProps) {
    const { store } = useStore();
    const templateId = store?.theme?.templateId || 'modern-clean';

    // Get the SearchPage container component
    const SearchPage = getComponent('SearchPage', templateId);

    return (
        <SearchPage
            initialQuery={initialQuery}
            initialProducts={initialProducts}
            initialFilters={initialFilters}
            initialLayout={initialLayout}
        />
    );
}
