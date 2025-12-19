'use client';

import React, { useEffect, useState } from 'react';
import { getComponent } from '@/components/templates/registry';
import { ModuleProps } from '../..';
import api from '@/lib/api';
import styles from './ProductGrid.module.scss';

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
    isNew?: boolean;
    inStock?: boolean;
}

export default function ProductGridModule({ config }: ModuleProps) {
    const {
        source,
        limit = 8,
        columns = 4,
        showPrice = true,
        showRating = true,
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

                const data = await api.get<Product[] | { products: Product[] }>(`products?${params.toString()}`);
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

    const columnClass = styles[`columns${Math.min(Math.max(columns, 2), 6)}`];

    if (loading) {
        return (
            <div className={styles.container}>
                {title && <div className={styles.skeletonTitle} />}
                <div className={styles.skeletonGrid}>
                    {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
                        <div key={i} className={styles.skeleton} />
                    ))}
                </div>
            </div>
        );
    }

    if (error || products.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={styles.container}>
                    <div className={styles.errorState}>
                        <span>📦</span>
                        <p>Error: {error || 'No products found'}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div className={styles.container}>
            {title && (
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                </div>
            )}

            <div className={`${styles.grid} ${columnClass}`}>
                {products.map((product) => (
                    <ProductCard
                        key={product._id}
                        product={product}
                        showRating={showRating}
                    />
                ))}
            </div>
        </div>
    );
}
