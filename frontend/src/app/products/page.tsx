import { Suspense } from 'react';
import { Metadata } from 'next';
import { getServerStore } from '@/lib/api/server-store';
import CategoryPageClient from '@/components/slug-pages/category/CategoryPageClient';
import CategoryPageSkeleton from '@/components/slug-pages/category/CategoryPageSkeleton';

export const revalidate = 120;

interface ProductsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
    const store = await getServerStore();

    return {
        title: `All Products | ${store?.name || 'Store'}`,
        description: 'Browse our complete collection of products',
    };
}

async function fetchProductsPageData(storeId: string, searchParams: Record<string, any>) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        const params = new URLSearchParams();
        params.append('storeId', storeId);
        params.append('page', searchParams.page || '1');
        params.append('limit', searchParams.limit || '24');
        params.append('sort', searchParams.sort || 'featured');

        // Add filters
        if (searchParams.minPrice) params.append('minPrice', searchParams.minPrice);
        if (searchParams.maxPrice) params.append('maxPrice', searchParams.maxPrice);
        if (searchParams.brands) params.append('brands', searchParams.brands);
        if (searchParams.tags) params.append('tags', searchParams.tags);
        if (searchParams.rating) params.append('rating', searchParams.rating);
        if (searchParams.stockStatus) params.append('stockStatus', searchParams.stockStatus);

        // Add attribute filters
        Object.keys(searchParams).forEach(key => {
            if (key.startsWith('attr_')) {
                params.append(key, searchParams[key]);
            }
        });

        params.append('view', 'listing');

        const response = await fetch(`${apiUrl}/products?${params.toString()}`, {
            next: { revalidate: 120 },
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            return { products: [], filters: null, pagination: { page: 1, limit: 24, total: 0, pages: 1 } };
        }

        const data = await response.json();

        // Fetch available filters
        let filters = null;
        try {
            const filtersResponse = await fetch(`${apiUrl}/products/filters?storeId=${storeId}`, {
                next: { revalidate: 300 }, // Cache filters for 5 minutes
                headers: { 'Content-Type': 'application/json' },
            });

            if (filtersResponse.ok) {
                filters = await filtersResponse.json();
            }
        } catch (err) {
            console.error('Failed to fetch filters:', err);
        }

        return {
            products: data.products || [],
            filters,
            pagination: data.pagination || { page: 1, limit: 24, total: 0, pages: 1 },
        };
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return { products: [], filters: null, pagination: { page: 1, limit: 24, total: 0, pages: 1 } };
    }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const store = await getServerStore();
    const resolvedSearchParams = await searchParams;

    if (!store?._id) {
        return <div>Store not found</div>;
    }

    // Convert searchParams to simple object
    const params: Record<string, string> = {};
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
        if (typeof value === 'string') {
            params[key] = value;
        } else if (Array.isArray(value)) {
            params[key] = value.join(',');
        }
    });

    const { products, filters, pagination } = await fetchProductsPageData(store._id, params);

    // Fetch layout for products page
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    let layout = null;
    try {
        const layoutResponse = await fetch(
            `${apiUrl}/layouts/resolve?storeId=${store._id}&type=category`,
            {
                next: { revalidate: 300 },
                headers: { 'Content-Type': 'application/json' },
            }
        );
        if (layoutResponse.ok) {
            const layoutData = await layoutResponse.json();
            layout = layoutData.layout || null;
        }
    } catch (err) {
        console.error('Failed to fetch layout:', err);
    }

    // Create a virtual "All Products" category
    const allProductsCategory = {
        _id: 'all-products',
        title: 'All Products',
        slug: 'products',
        description: 'Browse our complete collection of products',
    };

    return (
        
            <CategoryPageClient
                category={allProductsCategory}
                initialProducts={products}
                initialFilters={filters}
                initialLayout={layout}
                initialPagination={pagination}
            />
        
    );
}
