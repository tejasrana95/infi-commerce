import { NextRequest, NextResponse } from 'next/server';
import { getServerStore } from '@/lib/api/server-store';

export const dynamic = 'force-dynamic';

interface PublicProduct {
    id: string;
    sku: string;
    name: string;
    slug: string;
    category: string;
    price: number;
    salePrice?: number;
    currency: string;
    url: string;
    image: string;
    inStock: boolean;
    brand?: string;
    rating?: number;
    reviewCount?: number;
    description?: string;
}

export async function GET(request: NextRequest) {
    try {
        const store = await getServerStore();

        if (!store?._id) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            );
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || searchParams.get('q') || '';
        const category = searchParams.get('category') || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const page = parseInt(searchParams.get('page') || '1');

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const domain = (store.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002';

        // Build query params for backend
        const params = new URLSearchParams({
            storeId: store._id,
            isActive: 'true',
            limit: limit.toString(),
            page: page.toString(),
        });

        if (query) params.append('search', query);
        if (category) params.append('category', category);

        const response = await fetch(`${apiUrl}/products?${params}`, {
            next: { revalidate: 60 },
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch products' },
                { status: 500 }
            );
        }

        const data = await response.json();
        const rawProducts = data.products || data.data || [];

        // Transform to clean AI-friendly format
        const products: PublicProduct[] = rawProducts.map((product: any) => ({
            id: product._id,
            sku: product.sku,
            name: product.name,
            slug: product.slug,
            category: product.categoryIds
                ?.map((cat: any) => cat.title || cat.name)
                .filter(Boolean)
                .join(' > ') || 'Uncategorized',
            price: product.price,
            salePrice: product.isOnSale ? product.salePrice : undefined,
            currency: store.currency || 'USD',
            url: `https://${domain}/product/${product.slug}`,
            image: product.featuredImage || product.images?.[0] || '',
            inStock: product.stockStatus === 'in_stock',
            brand: typeof product.brand === 'object' ? product.brand?.name : product.brand,
            rating: product.averageRating,
            reviewCount: product.reviewCount,
            description: product.shortDescription?.substring(0, 200),
        }));

        return NextResponse.json({
            query,
            store: store.name,
            currency: store.currency || 'USD',
            totalResults: data.pagination?.total || products.length,
            page,
            limit,
            products,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('Public Products API Error:', error);
        return NextResponse.json(
            { error: 'Failed to search products' },
            { status: 500 }
        );
    }
}
