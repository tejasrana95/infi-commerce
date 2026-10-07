// All Products page — fully server-rendered, filter-aware.
//
// Uses the SAME data pipeline and the SAME filter query contract as the
// category ([...slug]) route, so `/products?brand=x` and `/[category]?brand=x`
// behave identically and the SSR payload always matches the URL.

import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getServerStore, fetchCategoryPageData } from '@/lib/api/server-store';
import CategoryPageClient from '@/components/slug-pages/category/CategoryPageClient';
import {
    hasActiveFilters,
    parseAppliedFilters,
    searchParamsFromRecord,
} from '@/lib/filters/category-filters';

// Rendered per-request so `useSearchParams()` on the client sees the same
// query string the server used (no hydration mismatch for the filter UI).
export const dynamic = 'force-dynamic';

interface ProductsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
    const store = await getServerStore();
    const headersList = await headers();
    const requestHost = headersList.get('host');
    const domain = requestHost || ((store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002');
    const resolvedSearchParams = await searchParams;
    const params = searchParamsFromRecord(resolvedSearchParams);
    const filtered = hasActiveFilters(params);

    return {
        title: `All Products | ${store?.name || 'Store'}`,
        description: 'Browse our complete collection of products',
        alternates: { canonical: `https://${domain}/products` },
        // Filtered permutations are thin/duplicate content — don't index them.
        robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
    };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const store = await getServerStore();
    const resolvedSearchParams = await searchParams;

    if (!store?._id) {
        return <div>Store not found</div>;
    }

    const params = searchParamsFromRecord(resolvedSearchParams);

    const pageParam = parseInt(params.get('page') || '1', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const sort = params.get('sort') || store?.theme?.category?.sorting?.defaultSort || 'featured';
    const appliedFilters = parseAppliedFilters(params);

    // Single shared fetcher — products are already filtered for this URL.
    const { category, products, filters, layout, pagination } = await fetchCategoryPageData(
        store._id,
        null, // virtual "All Products" category
        { page, sort, appliedFilters }
    );

    return (
        <CategoryPageClient
            category={category!}
            initialProducts={products}
            initialFilters={filters}
            initialLayout={layout}
            initialPagination={pagination}
            initialAppliedFilters={appliedFilters}
            initialQueryString={params.toString()}
        />
    );
}
