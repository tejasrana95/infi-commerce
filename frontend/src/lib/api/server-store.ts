import { headers } from 'next/headers';
import { cache } from 'react';
import { Store } from '@/types';
import { getCacheOptions } from '@/lib/revalidation';
import { getForwardedHeaders } from '@/lib/api/forwarded-headers';
import { AppliedFilters, appliedFiltersToApiQuery } from '@/lib/filters/category-filters';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const FALLBACK_STORE_ID = process.env.FALLBACK_STORE_ID || '675bd1d5334c9f136d8849b2';

// ============================================
// Core Store Fetching
// ============================================

import { resolveStoreByDomain } from '@/lib/store-cache';

/**
 * Get store from request headers (for SSR pages)
 * This is the main entry point - always uses cache layer
 */
// NOTE: intentionally NOT wrapped in React `cache()` — this is also called
// from Route Handlers / metadata files (sitemap, robots, api routes) where the
// React cache dispatcher may not be available. The store-cache layer already
// memoises the expensive lookup.
export async function getServerStore(): Promise<Store | null> {
    const headersList = await headers();
    const domain = headersList.get('host') || 'localhost:3000';

    // Always use caching layer (memory → file → API)
    const result = await resolveStoreByDomain(domain, async (d) => {
        // First try domain lookup
        let store = await fetchStoreByDomain(d);
        // Localhost fallback
        if (!store && d.includes('localhost')) {
            store = await fetchStoreById(FALLBACK_STORE_ID);
        }
        return store;
    });

    return result.store;
}

async function fetchStoreByDomain(domain: string): Promise<Store | null> {
    try {
        const forwardedHeaders = await getForwardedHeaders();
        const res = await fetch(`${API_BASE}/stores/domain/${encodeURIComponent(domain)}`, {
            ...getCacheOptions('storeDomain'),
            headers: {
                'Content-Type': 'application/json',
                'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB',
                ...forwardedHeaders,
            },
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
        const forwardedHeaders = await getForwardedHeaders();
        const res = await fetch(`${API_BASE}/stores/${storeId}`, {
            ...getCacheOptions('store'),
            headers: {
                'Content-Type': 'application/json',
                'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB',
                ...forwardedHeaders,
            },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.store || data;
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
// Memoised per request — both `generateMetadata` and the page resolve the same
// category, so the second call is free.
export const fetchCategoryBySlug = cache(async (storeId: string, slug: string): Promise<CategoryData | null> => {
    try {
        const res = await fetch(`${API_BASE}/categories/slug/${storeId}/${slug}`, {
            ...getCacheOptions('categoryData'),
            headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.category || null;
    } catch (error) {
        console.error('Error fetching category by slug:', error);
        return null;
    }
});

/**
 * Fetch categories list by IDs or storeId with Next.js caching
 */
export async function fetchCategories(
    storeId: string,
    categoryIds?: string[]
): Promise<any[]> {
    try {
        const params = new URLSearchParams({ storeId, sort: 'false' });
        if (categoryIds && categoryIds.length > 0) {
            params.set('ids', categoryIds.join(','));
        }
        const res = await fetch(`${API_BASE}/categories?${params.toString()}`, {
            ...getCacheOptions('categories'),
            headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
        });

        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data?.categories) ? data.categories : [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

/**
 * Fetch products for a category (or all products if categoryId is null)
 */
export async function fetchCategoryProducts(
    storeId: string,
    categoryId: string | null,
    options: { page?: number; limit?: number; sort?: string; appliedFilters?: AppliedFilters } = {}
): Promise<{ products: any[]; pagination: any }> {
    const { page = 1, limit = 24, sort = 'featured', appliedFilters } = options;
    try {
        let url = `${API_BASE}/products?storeId=${storeId}&page=${page}&limit=${limit}&sort=${sort}&view=listing`;
        if (categoryId) {
            url += `&categoryId=${categoryId}`;
        }
        // Apply the very same filter params the client writes to the URL.
        if (appliedFilters) {
            const filterQuery = appliedFiltersToApiQuery(appliedFilters);
            if (filterQuery) url += `&${filterQuery}`;
        }

        const res = await fetch(url, {
            ...getCacheOptions('productList'),
            headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
        });

        if (!res.ok) return { products: [], pagination: null };
        const data = await res.json();
        return {
            products: data.products || [],
            pagination: data.pagination || null
        };
    } catch (error) {
        console.error('Error fetching category products:', error);
        return { products: [], pagination: null };
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
                ...getCacheOptions('filters'),
                headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
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
 * Fetch available filters for the virtual "All Products" listing (no category).
 */
export async function fetchProductFilters(storeId: string): Promise<any | null> {
    try {
        const res = await fetch(
            `${API_BASE}/products/filters?storeId=${storeId}`,
            {
                ...getCacheOptions('filters'),
                headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
            }
        );

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching product filters:', error);
        return null;
    }
}

// ============================================
// Layout Data Fetching
// ============================================

/**
 * Fetch layout by type and optional slug with fallback
 * Uses the /resolve endpoint which handles slug-specific → default fallback automatically
 */
export async function fetchLayout(storeId: string, type: string, slug?: string): Promise<any | null> {
    try {
        let url = `${API_BASE}/layouts/resolve?storeId=${storeId}&type=${type}`;
        if (slug) {
            url += `&slug=${encodeURIComponent(slug)}`;
        }

        const res = await fetch(url, {
            ...getCacheOptions('layout'),
            headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.layout || null;
    } catch (error) {
        console.error('Error fetching layout:', error);
        return null;
    }
}

/**
 * Fetch all category page data in one call
 * Optimized for SSR - fetches everything in parallel
 */
export async function fetchCategoryPageData(
    storeId: string,
    slug: string | null,
    options: { page?: number; sort?: string; appliedFilters?: AppliedFilters } = {}
) {
    let category: CategoryData | null = null;
    let categoryId: string | null = null;
    const storeConfig = await fetchStoreById(storeId);
    if (slug) {
        // Fetch specific category
        category = await fetchCategoryBySlug(storeId, slug);
        if (!category) {
            return { category: null, products: [], filters: null, layout: null };
        }
        categoryId = category._id;
    } else {
        // "All Products" virtual category
        category = {
            _id: 'all-products',
            title: 'All Products',
            slug: 'products',
            description: 'Browse our complete collection of products.',
            seo: {
                metaTitle: 'All Products',
                metaDescription: 'Browse our complete collection of products.'
            }
        };
    }

    // 2. Fetch layout first to get configuration (like products per page)
    const layout = await fetchLayout(storeId, 'category', slug || undefined);
    // 3. Determine limit from layout or use default (must match the client fallback).
    const limit = storeConfig?.theme?.category?.grid?.productsPerPage || 24;

    // 4. Fetch products and filters in parallel using the correct limit
    const [productData, filters] = await Promise.all([
        fetchCategoryProducts(storeId, categoryId, {
            page: options.page,
            sort: options.sort,
            limit: limit,
            appliedFilters: options.appliedFilters,
        }),
        categoryId ? fetchCategoryFilters(storeId, categoryId) : fetchProductFilters(storeId),
    ]);

    return {
        category,
        products: productData.products,
        pagination: productData.pagination,
        filters,
        layout
    };
}

// ============================================
// Search Page Data Fetching
// ============================================

/**
 * Fetch products by search query
 */
export async function fetchSearchProducts(
    storeId: string,
    searchQuery: string,
    options: { limit?: number; sort?: string; appliedFilters?: AppliedFilters } = {}
): Promise<{ products: any[]; pagination: any; didYouMean?: string }> {
    const { limit = 24, sort = 'featured', appliedFilters } = options;
    try {
        let url = `${API_BASE}/products?storeId=${storeId}&limit=${limit}&sort=${sort}&search=${encodeURIComponent(searchQuery)}&view=listing`;
        if (appliedFilters) {
            const filterQuery = appliedFiltersToApiQuery(appliedFilters);
            if (filterQuery) url += `&${filterQuery}`;
        }
        const forwardedHeaders = await getForwardedHeaders();

        const res = await fetch(url, {
            ...getCacheOptions('search'),
            headers: {
                'Content-Type': 'application/json',
                'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB',
                ...forwardedHeaders,
            },
        });

        if (!res.ok) return { products: [], pagination: null };
        const data = await res.json();
        return {
            products: data.products || [],
            pagination: data.pagination || null,
            didYouMean: data.didYouMean
        };
    } catch (error) {
        console.error('Error fetching search products:', error);
        return { products: [], pagination: null };
    }
}

/**
 * Fetch filters for search results (computed from matching products)
 * Uses the /products/search/filters endpoint to get search-specific filters
 */
export async function fetchSearchFilters(storeId: string, searchQuery: string): Promise<any | null> {
    try {
        const forwardedHeaders = await getForwardedHeaders();
        const res = await fetch(
            `${API_BASE}/products/search/filters?storeId=${storeId}&search=${encodeURIComponent(searchQuery)}`,
            {
                ...getCacheOptions('filters'),
                headers: {
                    'Content-Type': 'application/json',
                    'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB',
                    'x-skip-activity-log': 'true',
                    ...forwardedHeaders,
                },
            }
        );

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching search filters:', error);
        return null;
    }
}

/**
 * Fetch all search page data in one call
 * Optimized for SSR - fetches everything in parallel
 */
export async function fetchSearchPageData(
    storeId: string,
    searchQuery: string,
    options: { sort?: string; appliedFilters?: AppliedFilters } = {}
) {
    if (!searchQuery || searchQuery.trim() === '') {
        return {
            searchQuery: '',
            products: [],
            filters: null,
            layout: null,
            pagination: null
        };
    }

    // Fetch products, search-specific filters, and search layout in parallel
    const [searchResult, filters, layout] = await Promise.all([
        fetchSearchProducts(storeId, searchQuery, { sort: options.sort, appliedFilters: options.appliedFilters }),
        fetchSearchFilters(storeId, searchQuery), // Fetch filters from search results
        fetchLayout(storeId, 'search'), // Use 'search' layout from layout builder
    ]);

    return {
        searchQuery: searchQuery.trim(),
        products: searchResult.products,
        pagination: searchResult.pagination,
        didYouMean: searchResult.didYouMean,
        filters, // Global store filters for search
        layout
    };
}


export async function fetchProductBySlug(storeId: string, slug: string): Promise<any | null> {
    try {
        const res = await fetch(`${API_BASE}/products/slug/${storeId}/${slug}`, {
            ...getCacheOptions('productData'),
            headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.product || null;
    } catch (error) {
        console.error('Error fetching product by slug:', error);
        return null;
    }
}


export async function fetchBlogPostBySlug(storeId: string, slug: string): Promise<any | null> {
    try {

        const [postsRes, layout] = await Promise.all([
            fetch(`${API_BASE}/blog/posts/slug/${slug}`, {
                ...getCacheOptions('blogPosts'),
                headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
            }),
            fetchLayout(storeId, 'blog-post', slug),  // Pass slug for slug-specific layout
        ]);

        if (!postsRes.ok) return { data: null, layout: null };
        const data = await postsRes.json();

        return {
            data,
            layout,
        };
    } catch (error) {
        console.error('Error fetching blog post by slug:', error);
        return { data: null, layout: null };
    }
}

/**
 * Fetch all blog listing page data in one call
 * Optimized for SSR - fetches everything in parallel
 */
export async function fetchBlogPageData(
    storeId: string,
    options: { page?: number; limit?: number; category?: string; tag?: string; search?: string } = {}
) {
    const { page = 1, limit = 12, category, tag, search } = options;

    try {
        // Build blog posts query string
        let postsUrl = `${API_BASE}/blog/posts?storeId=${storeId}&page=${page}&limit=${limit}`;
        if (category) postsUrl += `&category=${encodeURIComponent(category)}`;
        if (tag) postsUrl += `&tag=${encodeURIComponent(tag)}`;
        if (search) postsUrl += `&search=${encodeURIComponent(search)}`;

        // Fetch posts, categories, tags, and layout in parallel
        let categoriesUrl = `${API_BASE}/blog/categories?storeId=${storeId}`;
        if (search) categoriesUrl += `&postSearch=${encodeURIComponent(search)}`;

        let tagsUrl = `${API_BASE}/blog/tags?storeId=${storeId}`;
        if (search) tagsUrl += `&search=${encodeURIComponent(search)}`;

        const [postsRes, categoriesRes, tagsRes, layout] = await Promise.all([
            fetch(postsUrl, {
                ...getCacheOptions('blogPosts'),
                headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
            }),
            fetch(categoriesUrl, {
                ...getCacheOptions('blogMeta'),
                headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
            }),
            fetch(tagsUrl, {
                ...getCacheOptions('blogMeta'),
                headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
            }),
            fetchLayout(storeId, 'blog-list'),
        ]);

        // Parse responses
        const postsData = postsRes.ok ? await postsRes.json() : { data: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } };
        const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { data: [] };
        const tagsData = tagsRes.ok ? await tagsRes.json() : { data: [] };

        return {
            posts: postsData.data || [],
            pagination: postsData.pagination || { page: 1, limit: 12, total: 0, pages: 0 },
            totalPosts: typeof categoriesData.totalPosts === 'number' ? categoriesData.totalPosts : (postsData.pagination?.total || 0),
            categories: categoriesData.categories || categoriesData.data || [],
            tags: tagsData.data || tagsData || [],
            layout,
        };
    } catch (error) {
        console.error('Error fetching blog page data:', error);
        return {
            posts: [],
            pagination: { page: 1, limit: 12, total: 0, pages: 0 },
            categories: [],
            tags: [],
            layout: null,
        };
    }
}

// ============================================
// Static Page Data Fetching
// ============================================

export async function fetchPageBySlug(storeId: string, slug: string): Promise<any | null> {
    try {
        const [pageRes, layout] = await Promise.all([
            fetch(`${API_BASE}/pages/slug/${slug}?storeId=${storeId}`, {
                ...getCacheOptions('page'),
                headers: { 'Content-Type': 'application/json', 'x-channel': process.env.NEXT_PUBLIC_CHANNEL_CODE || 'WEB' },
            }),
            fetchLayout(storeId, 'page', slug),  // Pass slug for slug-specific layout
        ]);
        if (!pageRes.ok) return null;
        const data = await pageRes.json();
        return {
            data,
            layout,
        };
    } catch (error) {
        console.error('Error fetching page by slug:', error);
        return null;
    }
}
