// Search Results Page - Server Component with full SSR support
// Fetches all data server-side for SEO and passes to client component

import { Suspense } from 'react';
import { Metadata } from 'next';


import SearchPageClient from './SearchPageClient';
import {
    getServerStore,
    fetchSearchPageData,
} from '@/lib/api/server-store';
import CategoryPageSkeleton from '@/components/slug-pages/category/CategoryPageSkeleton';

interface SearchPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate metadata for SEO
export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
    const resolvedSearchParams = await searchParams;
    const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : '';
    const store = await getServerStore();

    const title = query
        ? `Search results for "${query}" | ${store?.name || 'Store'}`
        : `Search | ${store?.name || 'Store'}`;

    return {
        title,
        description: query
            ? `Browse search results for "${query}"`
            : 'Search our products',
        robots: {
            index: false, // Don't index search result pages
            follow: true,
        },
    };
}

// Server Component - Fetches all data for SSR
export default async function SearchPage({ searchParams }: SearchPageProps) {
    const resolvedSearchParams = await searchParams;
    const store = await getServerStore();

    if (!store?._id) {
        return (
            <div className="container mx-auto py-8">
                <p>Store not found</p>
            </div>
        );
    }

    // Get search query and sort from URL params
    const searchQuery = typeof resolvedSearchParams.q === 'string'
        ? resolvedSearchParams.q
        : '';

    const sort = typeof resolvedSearchParams.sort === 'string'
        ? resolvedSearchParams.sort
        : store?.theme?.category?.sorting?.defaultSort || 'featured';

    // Fetch all search data server-side
    const { products, filters, layout, pagination, didYouMean } = await fetchSearchPageData(
        store._id,
        searchQuery,
        { sort }
    );

    return (
        <Suspense fallback={<CategoryPageSkeleton />}>
            <SearchPageClient
                searchQuery={searchQuery}
                initialProducts={products}
                initialFilters={filters}
                initialLayout={layout}
                initialPagination={pagination}
                didYouMean={didYouMean}
            />
        </Suspense>
    );
}
