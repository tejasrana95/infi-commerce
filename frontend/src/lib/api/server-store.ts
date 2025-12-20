// Server-side store utilities for SSR pages
// These functions should only be called from Server Components
// They use Next.js headers() and fetch with caching

import { headers } from 'next/headers';
import { Store } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const FALLBACK_STORE_ID = process.env.FALLBACK_STORE_ID || '675bd1d5334c9f136d8849b2';

// ============================================
// Core Store Fetching
// ============================================

/**
 * Get store from request headers (for SSR pages)
 * This is the main entry point - caches the result
 */
export async function getServerStore(): Promise<Store | null> {
    const headersList = await headers();
    const domain = headersList.get('host') || 'localhost:3000';

    // Try to get store by domain
    let store = await fetchStoreByDomain(domain);

    // Fallback for localhost development
    if (!store && domain.includes('localhost')) {
        console.log(`Using fallback store for localhost. Domain was: ${domain}`);
        store = await fetchStoreById(FALLBACK_STORE_ID);
    }

    return store;
}

async function fetchStoreByDomain(domain: string): Promise<Store | null> {
    try {
        const res = await fetch(`${API_BASE}/stores/domain/${encodeURIComponent(domain)}`, {
            next: { revalidate: 60 },
            headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching store by domain:', error);
        return null;
    }
}

async function fetchStoreById(storeId: string): Promise<Store | null> {
    try {
        const res = await fetch(`${API_BASE}/stores/${storeId}`, {
            next: { revalidate: 60 },
            headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching store by ID:', error);
        return null;
    }
}

// ============================================
// Category Page Data Fetching
// ============================================

export interface CategoryData {
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

/**
 * Fetch category by slug
 */
export async function fetchCategoryBySlug(storeId: string, slug: string): Promise<CategoryData | null> {
    try {
        const res = await fetch(`${API_BASE}/categories/slug/${storeId}/${slug}`, {
            next: { revalidate: 60 },
            headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.category || null;
    } catch (error) {
        console.error('Error fetching category by slug:', error);
        return null;
    }
}

/**
 * Fetch products for a category
 */
export async function fetchCategoryProducts(storeId: string, categoryId: string, limit = 24): Promise<any[]> {
    try {
        const res = await fetch(
            `${API_BASE}/products?storeId=${storeId}&categoryId=${categoryId}&limit=${limit}`,
            {
                next: { revalidate: 60 },
                headers: { 'Content-Type': 'application/json' },
            }
        );

        if (!res.ok) return [];
        const data = await res.json();
        return data.products || [];
    } catch (error) {
        console.error('Error fetching category products:', error);
        return [];
    }
}

/**
 * Fetch available filters for a category
 */
export async function fetchCategoryFilters(storeId: string, categoryId: string): Promise<any | null> {
    try {
        const res = await fetch(
            `${API_BASE}/categories/${categoryId}/filters?storeId=${storeId}`,
            {
                next: { revalidate: 0 },
                headers: { 'Content-Type': 'application/json' },
            }
        );
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching category filters:', error);
        return null;
    }
}

/**
 * Fetch all category page data in one call
 * Optimized for SSR - fetches everything in parallel
 */
export async function fetchCategoryPageData(storeId: string, slug: string) {
    // First fetch the category
    const category = await fetchCategoryBySlug(storeId, slug);

    if (!category) {
        return { category: null, products: [], filters: null };
    }

    // Then fetch products and filters in parallel
    const [products, filters] = await Promise.all([
        fetchCategoryProducts(storeId, category._id),
        fetchCategoryFilters(storeId, category._id),
    ]);

    return { category, products, filters };
}

// ============================================
// Product Page Data Fetching (for future use)
// ============================================

export async function fetchProductBySlug(storeId: string, slug: string): Promise<any | null> {
    try {
        const res = await fetch(`${API_BASE}/products/slug/${slug}?storeId=${storeId}`, {
            next: { revalidate: 60 },
            headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.product || null;
    } catch (error) {
        console.error('Error fetching product by slug:', error);
        return null;
    }
}

// ============================================
// Blog Page Data Fetching (for future use)
// ============================================

export async function fetchBlogPostBySlug(storeId: string, slug: string): Promise<any | null> {
    try {
        const res = await fetch(`${API_BASE}/blog/posts/slug/${slug}?storeId=${storeId}`, {
            next: { revalidate: 60 },
            headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.post || null;
    } catch (error) {
        console.error('Error fetching blog post by slug:', error);
        return null;
    }
}
