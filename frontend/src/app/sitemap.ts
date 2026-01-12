import { MetadataRoute } from 'next';
import { getServerStore } from '@/lib/api/server-store';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

interface SitemapEntry {
    url: string;
    lastModified?: Date;
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
}

async function fetchProducts(storeId: string): Promise<any[]> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    try {
        const response = await fetch(
            `${apiUrl}/products?storeId=${storeId}&isActive=true&limit=1000`,
            { next: { revalidate: 3600 } }
        );
        if (!response.ok) return [];
        const data = await response.json();
        return data.products || data.data || [];
    } catch {
        return [];
    }
}

async function fetchCategories(storeId: string): Promise<any[]> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    try {
        const response = await fetch(
            `${apiUrl}/categories?storeId=${storeId}&status=active`,
            { next: { revalidate: 3600 } }
        );
        if (!response.ok) return [];
        const data = await response.json();
        return data.data || data.categories || [];
    } catch {
        return [];
    }
}

async function fetchBlogPosts(storeId: string): Promise<any[]> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    try {
        const response = await fetch(
            `${apiUrl}/blog/posts?storeId=${storeId}&status=published&limit=500`,
            { next: { revalidate: 3600 } }
        );
        if (!response.ok) return [];
        const data = await response.json();
        return data.data || data.posts || [];
    } catch {
        return [];
    }
}

async function fetchPages(storeId: string): Promise<any[]> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    try {
        const response = await fetch(
            `${apiUrl}/pages?storeId=${storeId}&status=published`,
            { next: { revalidate: 3600 } }
        );
        if (!response.ok) return [];
        const data = await response.json();

        return data.data || data.pages || [];
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const store = await getServerStore();
    const domain = (store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002';
    const baseUrl = `https://${domain}`;

    const entries: SitemapEntry[] = [];

    // Homepage
    entries.push({
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
    });

    if (store?._id) {
        // Products
        const products = await fetchProducts(store._id);
        for (const product of products) {
            entries.push({
                url: `${baseUrl}/${product.slug}`,
                lastModified: new Date(product.updatedAt || product.createdAt),
                changeFrequency: 'weekly',
                priority: 0.8,
            });
        }

        // Categories
        const categories = await fetchCategories(store._id);
        for (const category of categories) {
            entries.push({
                url: `${baseUrl}/${category.slug}`,
                lastModified: new Date(category.updatedAt || category.createdAt),
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        }

        // Blog Posts
        const posts = await fetchBlogPosts(store._id);
        for (const post of posts) {
            entries.push({
                url: `${baseUrl}/blog/${post.slug}`,
                lastModified: new Date(post.updatedAt || post.publishedAt || post.createdAt),
                changeFrequency: 'monthly',
                priority: 0.6,
            });
        }

        // Static Pages
        const pages = await fetchPages(store._id);
        for (const page of pages) {
            entries.push({
                url: `${baseUrl}/${page.slug}`,
                lastModified: new Date(page.updatedAt || page.createdAt),
                changeFrequency: 'monthly',
                priority: 0.5,
            });
        }
    }

    return entries;
}
