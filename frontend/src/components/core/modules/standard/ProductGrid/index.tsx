'use client';

import React, { useEffect, useState } from 'react';
import { getComponent } from '@/components/templates/registry';
import { ModuleProps } from '../..';
import api from '@/lib/api';

interface ProductGridConfig {
    source: 'best-sellers' | 'new-arrivals' | 'custom' | 'category';
    limit: number;
    columns: number;
    showPrice: boolean;
    showRating: boolean;
    productIds?: string[];
    categoryIds?: string[];
    title?: string;
}

interface Product {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images?: string[];
    averageRating?: number;
    reviewCount?: number;
}

export default function ProductGridModule({ config }: ModuleProps) {
    const {
        source,
        limit,
        columns,
        showPrice,
        showRating,
        productIds,
        categoryIds,
        title,
    } = config as ProductGridConfig;

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const ProductCard = getComponent('ProductCard');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);

                // Build query parameters
                const params = new URLSearchParams();
                params.append('limit', limit.toString());
                params.append('isActive', 'true');

                if (source === 'custom' && productIds && productIds.length > 0) {
                    params.append('ids', productIds.join(','));
                } else if (source === 'category' && categoryIds && categoryIds.length > 0) {
                    params.append('categoryIds', categoryIds.join(','));
                } else if (source === 'best-sellers') {
                    params.append('sort', 'salesCount');
                } else if (source === 'new-arrivals') {
                    params.append('sort', 'createdAt');
                }

                // Use centralized API client
                const data = await api.get<Product[] | { products: Product[] }>(`/products?${params.toString()}`);
                setProducts(Array.isArray(data) ? data : data.products || []);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError(err instanceof Error ? err.message : 'Failed to load products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [source, limit, categoryIds, productIds]);

    if (loading) {
        return (
            <div className="w-full py-12">
                <div className="max-w-7xl mx-auto px-4">
                    {title && <h2 className="text-2xl font-bold mb-6 h-8 bg-gray-200 animate-pulse w-48 rounded" />}
                    <div
                        className="grid gap-6"
                        style={{
                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        }}
                    >
                        {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
                            <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || products.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className="w-full p-8">
                    <div className="max-w-7xl mx-auto bg-red-50 border border-red-200 rounded-lg p-8">
                        <p className="text-red-600">Error loading products: {error || 'No products found'}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="w-full py-12">
            <div className="max-w-7xl mx-auto px-4">
                {title && (
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{title}</h2>
                )}

                <div
                    className="grid gap-6"
                    style={{
                        gridTemplateColumns: `repeat(auto-fill, minmax(${100 / columns}%, 1fr))`,
                    }}
                >
                    {products.map((product) => (
                        <div key={product._id}>
                            <ProductCard
                                product={product}
                                showPrice={showPrice}
                                showRating={showRating}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
