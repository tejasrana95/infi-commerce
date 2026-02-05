'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getComponent } from '@/components/templates/registry';
import { ModuleProps } from '../..';
import { useStore } from '@/providers/StoreProvider';
import { useInterest } from '@/providers/InterestProvider';
import api from '@/lib/api';
import styles from './PersonalizedProducts.module.scss';

interface ResponsiveColumns {
    desktop: number;
    tablet: number;
    mobile: number;
}

interface PersonalizedProductsConfig {
    title?: string;
    subtitle?: string;
    limit: number;
    columns: ResponsiveColumns | number;
    layout: 'grid' | 'carousel';
    exclusionScope: 'product' | 'category';
    exclusionDays: number;
    retentionDays: number;
    fallback: 'trending' | 'featured' | 'latest' | 'sale';
    showRating: boolean;
    showPrice: boolean;
    autoplay: boolean;
}

interface Product {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    images?: string[];
    featuredImage?: string;
    averageRating?: number;
    reviewCount?: number;
    isOnSale?: boolean;
    stockStatus?: string;
    categories?: any[];
    brand?: any;
}

interface RecommendationResponse {
    success: boolean;
    isPersonalized: boolean;
    fallback: string | null;
    total: number;
    products: Product[];
}

// Generate session ID for guests
function getSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = sessionStorage.getItem('interest_session_id');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        sessionStorage.setItem('interest_session_id', sessionId);
    }
    return sessionId;
}

export default function PersonalizedProductsModule({ config }: ModuleProps) {
    const {
        title = 'Recommended For You',
        subtitle,
        limit = 8,
        columns = { desktop: 4, tablet: 3, mobile: 2 },
        layout = 'grid',
        exclusionScope = 'category',
        exclusionDays = 30,
        retentionDays = 30,
        fallback = 'featured',
        showRating = true,
    } = config as PersonalizedProductsConfig;

    const { store } = useStore();
    const { getLocalData } = useInterest();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPersonalized, setIsPersonalized] = useState(false);

    const ProductCard = getComponent('ProductCard');

    // Normalize columns config
    const normalizedColumns = useMemo(() => {
        if (typeof columns === 'number') {
            return { desktop: columns, tablet: Math.max(2, columns - 1), mobile: 2 };
        }
        return columns;
    }, [columns]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!store?._id) return;

            try {
                setLoading(true);
                const sessionId = getSessionId();
                const localData = getLocalData();

                // Build query params
                const params = new URLSearchParams({
                    storeId: store._id,
                    limit: limit.toString(),
                    exclusionScope,
                    exclusionDays: exclusionDays.toString(),
                    retentionDays: retentionDays.toString(),
                    fallback,
                });

                if (sessionId) {
                    params.append('sessionId', sessionId);
                }

                // If we have local data but no auth, we need to use a different approach
                // For guests, we'll filter locally based on localStorage data
                let result: RecommendationResponse;
                let originalResult: RecommendationResponse['products'] = [];
                try {
                    result = await api.get<RecommendationResponse>(`interests/recommendations?${params}`);

                    originalResult = [...result.products];
                } catch {
                    // Fallback: fetch products directly with fallback type
                    const fallbackParams = new URLSearchParams({
                        limit: limit.toString(),
                        isActive: 'true',
                    });

                    switch (fallback) {
                        case 'trending':
                            fallbackParams.append('sort', 'salesCount');
                            break;
                        case 'featured':
                            fallbackParams.append('isFeatured', 'true');
                            break;
                        case 'latest':
                            fallbackParams.append('sort', 'createdAt');
                            break;
                        case 'sale':
                            fallbackParams.append('isOnSale', 'true');
                            break;
                    }

                    const fallbackData = await api.get<{ products: Product[] }>(`products?${fallbackParams}`);
                    result = {
                        success: true,
                        isPersonalized: false,
                        fallback,
                        total: fallbackData.products?.length || 0,
                        products: fallbackData.products || [],
                    };
                }

                // For guests with local data, filter out purchased products locally
                if (localData.purchasedProducts.length > 0 && result.products.length > 0) {
                    const purchaseCutoff = new Date();
                    purchaseCutoff.setDate(purchaseCutoff.getDate() - exclusionDays);

                    const excludeProductIds = new Set(
                        localData.purchasedProducts
                            .filter(p => new Date(p.purchasedAt) > purchaseCutoff)
                            .map(p => p.productId)
                    );

                    const excludeCategoryIds = new Set<string>();
                    if (exclusionScope === 'category') {
                        localData.purchasedProducts
                            .filter(p => new Date(p.purchasedAt) > purchaseCutoff)
                            .forEach(p => p.categoryIds.forEach(id => excludeCategoryIds.add(id)));
                    }

                    result.products = result.products.filter(product => {
                        if (excludeProductIds.has(product._id)) return false;
                        if (exclusionScope === 'category' && product.categories) {
                            const productCategoryIds = product.categories.map((c: any) => c._id || c);
                            if (productCategoryIds.some((id: string) => excludeCategoryIds.has(id))) {
                                return false;
                            }
                        }
                        return true;
                    });
                }
                setProducts(result.products.length > 0 ? result.products : originalResult);
                setIsPersonalized(result.isPersonalized);
            } catch (error) {
                console.error('Failed to fetch recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [store, limit, exclusionScope, exclusionDays, retentionDays, fallback, getLocalData]);

    const columnClass = styles[`columns${Math.min(Math.max(normalizedColumns.desktop, 2), 6)}`];

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

    if (products.length === 0) {
        return null; // Don't show empty section
    }

    return (
        <section className={styles.container}>
            {(title || subtitle) && (
                <div className={styles.header}>
                    {title && <h2 className={styles.title}>{title}</h2>}
                    {(subtitle || isPersonalized) && (
                        <span className={styles.personalizedBadge}>{subtitle || '✨ Personalized for you'}</span>
                    )}
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
        </section>
    );
}
