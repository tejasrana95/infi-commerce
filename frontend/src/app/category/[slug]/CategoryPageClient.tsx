// CategoryPage Client Component - Receives pre-fetched SSR data
// Uses template-based rendering with store context

'use client';

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
}

export default function CategoryPageClient({
    category,
    initialProducts = [],
    initialFilters = null,
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
        />
    );
}
