// Category Page - Server Component with full SSR support
// Fetches all data server-side for SEO and passes to client component

import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import CategoryPageSkeleton from './[slug]/CategoryPageSkeleton';
import CategoryPageClient from './[slug]/CategoryPageClient';
import {
    getServerStore,
    fetchCategoryPageData,
} from '@/lib/api/server-store';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
    const store = await getServerStore();
    if (!store?._id) {
        return { title: 'Store Not Found' };
    }

    return {
        title: `All Products | ${store.name}`,
        description: `Browse all products at ${store.name}`,
        openGraph: {
            title: `All Products | ${store.name}`,
            description: `Browse all products at ${store.name}`,
        },
    };
}

// Server Component - Fetches all data for SSR
export default async function AllProductsPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const store = await getServerStore();

    if (!store?._id) {
        notFound();
    }

    // Get sort from URL params (use default if not specified)
    const sort = typeof resolvedSearchParams.sort === 'string'
        ? resolvedSearchParams.sort
        : store?.theme?.category?.sorting?.defaultSort || 'featured';

    // Fetch all category data server-side with sort, passing null for slug to indicate "All Products"
    const { category, products, filters, layout } = await fetchCategoryPageData(
        store._id,
        null,
        { sort }
    );

    if (!category) {
        notFound();
    }

    return (
        <Suspense fallback={<CategoryPageSkeleton />}>
            <CategoryPageClient
                category={category}
                initialProducts={products}
                initialFilters={filters}
                initialLayout={layout}
            />
        </Suspense>
    );
}
