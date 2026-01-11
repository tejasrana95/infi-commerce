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
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate static params for all categories at build time
export async function generateStaticParams() {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        // Fetch all stores
        const storesRes = await fetch(`${apiUrl}/stores`, {
            next: { revalidate: false }
        });

        if (!storesRes.ok) return [];

        const storesData = await storesRes.json();
        const stores = Array.isArray(storesData) ? storesData : storesData.data || [];

        const paths = [];

        // For each store, fetch all active categories
        for (const store of stores) {
            try {
                const categoriesRes = await fetch(
                    `${apiUrl}/categories?storeId=${store._id}&status=active`,
                    { next: { revalidate: false } }
                );

                if (categoriesRes.ok) {
                    const categoriesData = await categoriesRes.json();
                    const categories = categoriesData.data || [];

                    for (const category of categories) {
                        if (category.slug) {
                            paths.push({ slug: category.slug });
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch categories for store ${store._id}:`, error);
            }
        }

        console.log(`Generated ${paths.length} static category pages`);
        return paths;
    } catch (error) {
        console.error('Failed to generate static params for categories:', error);
        return [];
    }
}

// Revalidate every 30 minutes
export const revalidate = 1800;
export const dynamic = 'force-dynamic'; // Allow headers() usage in getServerStore()

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
export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const store = await getServerStore();

    if (!store?._id) {
        notFound();
    }

    // Get sort from URL params (use default if not specified)
    const sort = typeof resolvedSearchParams.sort === 'string'
        ? resolvedSearchParams.sort
        : store?.theme?.category?.sorting?.defaultSort || 'featured';

    // Fetch all category data server-side with sort
    const { category, products, filters, layout } = await fetchCategoryPageData(
        store._id,
        slug,
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
