'use client';

import React, { useEffect, useState } from 'react';
import { getComponent } from '@/components/templates/registry';
import { ModuleProps } from '../..';
import api from '@/lib/api';

interface ProductCarouselConfig {
    source: 'best-sellers' | 'new-arrivals' | 'custom' | 'category';
    limit: number;
    columns: number;
    showPrice: boolean;
    showRating: boolean;
    autoplay: boolean;
    categoryIds?: string[];
    productIds?: string[];
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

export default function ProductCarouselModule({ config }: ModuleProps) {
    const {
        source,
        limit,
        columns,
        showPrice,
        showRating,
        autoplay,
        categoryIds,
        productIds,
        title,
    } = config as ProductCarouselConfig;

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentOffset, setCurrentOffset] = useState(0);

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

    // Auto-play functionality
    useEffect(() => {
        if (autoplay && products.length > columns) {
            const timer = setInterval(() => {
                setCurrentOffset((prev) => {
                    const maxOffset = Math.max(0, products.length - columns);
                    return prev >= maxOffset ? 0 : prev + 1;
                });
            }, 3000);

            return () => clearInterval(timer);
        }
    }, [autoplay, products.length, columns]);

    const scrollLeft = () => {
        setCurrentOffset((prev) => Math.max(0, prev - 1));
    };

    const scrollRight = () => {
        setCurrentOffset((prev) => Math.min(products.length - columns, prev + 1));
    };

    if (loading) {
        return (
            <div className="w-full py-12">
                <div className="max-w-7xl mx-auto px-4">
                    {title && <h2 className="text-2xl font-bold mb-6 h-8 bg-gray-200 animate-pulse w-48 rounded" />}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
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
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
                    </div>
                )}

                <div className="relative">
                    {/* Navigation Arrows */}
                    {products.length > columns && (
                        <>
                            <button
                                onClick={scrollLeft}
                                disabled={currentOffset === 0}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Previous products"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={scrollRight}
                                disabled={currentOffset >= products.length - columns}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Next products"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}

                    {/* Product Grid/Carousel */}
                    <div className="overflow-hidden">
                        <div
                            className="grid gap-6 transition-transform duration-300"
                            style={{
                                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                                transform: `translateX(-${(currentOffset * 100) / columns}%)`,
                                width: `${(products.length * 100) / columns}%`,
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
            </div>
        </div>
    );
}
