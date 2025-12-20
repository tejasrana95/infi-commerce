// Category Page - Server Component with full SSR support
// Fetches all data server-side for SEO and passes to client component

import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import CategoryPageSkeleton from './CategoryPageSkeleton';
import CategoryPageClient from './CategoryPageClient';
import {
    getServerStore,
    fetchCategoryBySlug,
    fetchCategoryPageData,
} from '@/lib/api/server-store';

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const store = await getServerStore();

    if (!store?._id) {
        return { title: 'Category Not Found' };
    }

    const category = await fetchCategoryBySlug(store._id, slug);

    if (!category) {
        return { title: 'Category Not Found' };
    }

    return {
        title: category.seo?.metaTitle || `${category.title} | ${store.name}`,
        description: category.seo?.metaDescription || category.description || `Browse ${category.title} products`,
        keywords: category.seo?.metaKeywords?.join(', '),
        openGraph: {
            title: category.seo?.metaTitle || category.title,
            description: category.seo?.metaDescription || category.description,
            images: category.image ? [category.image] : [],
        },
    };
}

// Server Component - Fetches all data for SSR
export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;
    const store = await getServerStore();

    if (!store?._id) {
        notFound();
    }

    // Fetch all category data server-side
    const { category, products, filters } = await fetchCategoryPageData(store._id, slug);

    if (!category) {
        notFound();
    }

    return (
        <Suspense fallback={<CategoryPageSkeleton />}>
            <CategoryPageClient
                category={category}
                initialProducts={products}
                initialFilters={filters}
            />
        </Suspense>
    );
}
