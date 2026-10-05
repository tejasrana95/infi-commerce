// CategoryPage Client Component - Receives pre-fetched SSR data
// Uses template-based rendering with store context

'use client';

import { memo } from 'react';
import { getComponent } from '@/components/templates/registry';
import { useStore } from '@/providers/StoreProvider';

interface Category {
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

interface CategoryPageClientProps {
    category: Category;
    initialProducts?: any[];
    initialFilters?: any;
    initialLayout?: any;
    initialPagination?: any;
    initialAppliedFilters: any;
    initialQueryString: string;
}

export function CategoryPageClient({
    category,
    initialProducts = [],
    initialFilters = null,
    initialLayout = null,
    initialPagination = null,
    initialAppliedFilters,
    initialQueryString,
}: CategoryPageClientProps) {
    const { store } = useStore();
    const templateId = store?.theme?.templateId || 'modern-clean';

    // Get the CategoryPage container component
    const CategoryPage = getComponent('CategoryPage', templateId);

    return (
        <CategoryPage
            category={category}
            initialProducts={initialProducts}
            initialFilters={initialFilters}
            initialLayout={initialLayout}
            initialPagination={initialPagination}
            initialAppliedFilters={initialAppliedFilters}
            initialQueryString={initialQueryString}
            Template={getComponent('CategoryPageTemplate', templateId)}
        />
    );
}

const MemoizedCategoryPageClient = memo(CategoryPageClient);
MemoizedCategoryPageClient.displayName = 'CategoryPageClient';

export default MemoizedCategoryPageClient;
