import { NextResponse } from 'next/server';
import { getServerStore } from '@/lib/api/server-store';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

interface AIProduct {
    id: string;
    sku: string;
    name: string;
    category: string;
    price: number;
    salePrice?: number;
    url: string;
    image: string;
    inStock: boolean;
    brand?: string;
    rating?: number;
    reviewCount?: number;
    description?: string;
}

interface AIProductFeed {
    store: string;
    storeUrl: string;
    currency: string;
    lastUpdated: string;
    totalProducts: number;
    products: AIProduct[];
}

async function fetchAllProducts(storeId: string, domain: string): Promise<AIProduct[]> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const products: AIProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await fetch(
                `${apiUrl}/products?storeId=${storeId}&isActive=true&limit=100&page=${page}`,
                {
                    next: { revalidate: 300 },
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (!response.ok) break;

            const data = await response.json();
            const rawProducts = data.data || data.products || [];

            for (const product of rawProducts) {
                // Build category path
                const categoryPath = product.categoryIds
                    ?.map((cat: any) => cat.title || cat.name)
                    .filter(Boolean)
                    .join(' > ') || 'Uncategorized';

                products.push({
                    id: product._id,
                    sku: product.sku,
                    name: product.name,
                    category: categoryPath,
                    price: product.price,
                    salePrice: product.isOnSale ? product.salePrice : undefined,
                    url: `https://${domain}/${product.slug}`,
                    image: product.featuredImage || product.images?.[0] || '',
                    inStock: product.stockStatus === 'in_stock',
                    brand: typeof product.brand === 'object' ? product.brand?.name : product.brand,
                    rating: product.averageRating,
                    reviewCount: product.reviewCount,
                    description: product.shortDescription?.substring(0, 200),
                });
            }

            hasMore = data.pagination?.page < data.pagination?.pages;
            page++;
        } catch (error) {
            console.error('Error fetching products for AI feed:', error);
            break;
        }
    }

    return products;
}

export async function GET() {
    try {
        const store = await getServerStore();

        if (!store?._id) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            );
        }

        const domain = (store.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002';
        const products = await fetchAllProducts(store._id, domain);

        const feed: AIProductFeed = {
            store: store.name,
            storeUrl: `https://${domain}`,
            currency: store.currency || 'USD',
            lastUpdated: new Date().toISOString(),
            totalProducts: products.length,
            products,
        };

        return NextResponse.json(feed, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                'X-Robots-Tag': 'noindex', // Don't index directly, but allow AI to read
            },
        });
    } catch (error) {
        console.error('AI Product Feed Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate product feed' },
            { status: 500 }
        );
    }
}
