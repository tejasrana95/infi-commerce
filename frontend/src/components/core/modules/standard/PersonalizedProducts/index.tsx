'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getComponent } from '@/components/templates/registry';
import { ModuleProps } from '../..';
import { useStore } from '@/providers/StoreProvider';
import { useInterest } from '@/providers/InterestProvider';
import api from '@/lib/api';
import styles from './PersonalizedProducts.module.scss';
import carouselStyles from '../ProductCarousel/ProductCarousel.module.scss';

interface ResponsiveColumns {
    desktop: number;
    tablet: number;
    mobile: number;
}

interface PersonalizedProductsConfig {
    titleTypography?: {
        fontFamily?: string;
        fontSize?: number;
        color?: string;
        alignment?: 'left' | 'center' | 'right';
    };
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
    categories?: Array<{ _id?: string } | string>;
    brand?: unknown;
}

interface RecommendationResponse {
    success: boolean;
    isPersonalized: boolean;
    fallback: string | null;
    total: number;
    products: Product[];
}

function ensureReadableColor(color?: string): string | undefined {
    if (!color) return undefined;
    const hex = color.trim().replace('#', '');
    const normalized = hex.length === 3 ? hex.split('').map((c) => `${c}${c}`).join('') : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return color;

    const r = parseInt(normalized.slice(0, 2), 16) / 255;
    const g = parseInt(normalized.slice(2, 4), 16) / 255;
    const b = parseInt(normalized.slice(4, 6), 16) / 255;
    const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    const contrastOnWhite = 1.05 / (luminance + 0.05);

    // Keep custom color if it has at least AA contrast against white backgrounds.
    return contrastOnWhite >= 4.5 ? color : '#1a1a1a';
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
        titleTypography,
        limit = 8,
        columns = { desktop: 4, tablet: 3, mobile: 2 },
        layout = 'grid',
        exclusionScope = 'category',
        exclusionDays = 30,
        retentionDays = 30,
        fallback = 'featured',
        showRating = true,
        autoplay = false,
    } = config as PersonalizedProductsConfig;

    const { store } = useStore();
    const { getLocalData } = useInterest();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPersonalized, setIsPersonalized] = useState(false);

    // Carousel state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [visibleCount, setVisibleCount] = useState(
        typeof columns === 'number' ? columns : (columns as { desktop: number }).desktop
    );

    const ProductCard = getComponent('ProductCard');

    // Normalize columns config
    const normalizedColumns = useMemo(() => {
        if (typeof columns === 'number') {
            return { desktop: columns, tablet: Math.max(2, columns - 1), mobile: 2 };
        }
        return columns;
    }, [columns]);

    // Responsive visible count for carousel
    useEffect(() => {
        if (layout !== 'carousel') return;
        const update = () => {
            if (window.innerWidth < 768) setVisibleCount(1);
            else if (window.innerWidth < 1024) setVisibleCount(Math.min(normalizedColumns.tablet, 3));
            else setVisibleCount(normalizedColumns.desktop);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [layout, normalizedColumns]);

    const maxIndex = Math.max(0, products.length - visibleCount);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
    }, [maxIndex]);

    const prevSlide = useCallback(() => {
        setCurrentIndex(prev => prev <= 0 ? maxIndex : prev - 1);
    }, [maxIndex]);

    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
    }, [maxIndex]);

    // Auto-play for carousel
    useEffect(() => {
        if (layout === 'carousel' && autoplay && products.length > visibleCount && !isPaused) {
            const timer = setInterval(nextSlide, 4000);
            return () => clearInterval(timer);
        }
    }, [layout, autoplay, products.length, visibleCount, isPaused, nextSlide]);

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
                            const productCategoryIds = product.categories
                                .map((c) => (typeof c === 'string' ? c : c._id || ''))
                                .filter(Boolean);
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

    const titleAlignment = titleTypography?.alignment || 'left';
    const headerStyle: React.CSSProperties = {
        alignItems: titleAlignment === 'center' ? 'center' : titleAlignment === 'right' ? 'flex-end' : 'flex-start',
        textAlign: titleAlignment,
    };
    const titleStyle: React.CSSProperties = {
        fontFamily: titleTypography?.fontFamily || undefined,
        fontSize: titleTypography?.fontSize ? `${titleTypography.fontSize}px` : undefined,
        color: ensureReadableColor(titleTypography?.color),
    };

    if (loading) {
        const header = (
            (title || subtitle) && (
                <div className={styles.header} style={headerStyle}>
                    {title && <h2 className={styles.title} style={titleStyle}>{title}</h2>}
                    {subtitle && <span className={styles.personalizedBadge}>{subtitle}</span>}
                </div>
            )
        );

        if (layout === 'carousel') {
            const slideWidth = 100 / visibleCount;
            return (
                <div className={styles.container}>
                    {header}
                    <div className={carouselStyles.carouselViewport}>
                        <div className={carouselStyles.carouselTrack}>
                            {Array.from({ length: visibleCount }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={carouselStyles.carouselSlide}
                                    style={{ width: `${slideWidth}%` }}
                                >
                                    <div className={styles.skeleton} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.container}>
                {header}
                <div 
                    className={styles.grid}
                    style={{
                        '--columns-desktop': normalizedColumns.desktop,
                        '--columns-tablet': normalizedColumns.tablet,
                        '--columns-mobile': normalizedColumns.mobile,
                    } as React.CSSProperties}
                >
                    {Array.from({ length: Math.min(limit, normalizedColumns.desktop) }).map((_, i) => (
                        <div key={i} className={styles.skeleton} />
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return null; // Don't show empty section
    }

    const header = (
        (title || subtitle) && (
            <div className={styles.header} style={headerStyle}>
                {title && <h2 className={styles.title} style={titleStyle}>{title}</h2>}
                {(subtitle || isPersonalized) && (
                    <span className={styles.personalizedBadge}>{subtitle || '✨ Personalized for you'}</span>
                )}
            </div>
        )
    );

    // ── Carousel layout ────────────────────────────────────────────────────────
    if (layout === 'carousel') {
        const slideWidth = 100 / visibleCount;
        const translateX = currentIndex * slideWidth;

        return (
            <section className={styles.container}>
                {header}

                <div
                    className={carouselStyles.carouselWrapper}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div className={carouselStyles.carouselViewport}>
                        <div
                            className={carouselStyles.carouselTrack}
                            style={{ transform: `translateX(-${translateX}%)` }}
                        >
                            {products.map((product) => (
                                <div 
                                    key={product._id} 
                                    className={carouselStyles.carouselSlide}
                                    style={{ width: `${slideWidth}%` }}
                                >
                                    <ProductCard product={product} showRating={showRating} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {products.length > visibleCount && (
                        <>
                            <button
                                className={`${carouselStyles.navButton} ${carouselStyles.navPrev}`}
                                onClick={prevSlide}
                                disabled={currentIndex === 0 && !autoplay}
                                aria-label="Previous products"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                className={`${carouselStyles.navButton} ${carouselStyles.navNext}`}
                                onClick={nextSlide}
                                disabled={currentIndex >= maxIndex && !autoplay}
                                aria-label="Next products"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>

                {products.length > visibleCount && (
                    <div className={carouselStyles.dots}>
                        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                            <button
                                key={index}
                                className={`${carouselStyles.dot} ${index === currentIndex ? carouselStyles.dotActive : ''}`}
                                onClick={() => goToSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </section>
        );
    }

    // ── Grid layout (default) ──────────────────────────────────────────────────
    return (
        <section className={styles.container}>
            {header}
            <div 
                className={styles.grid}
                style={{
                    '--columns-desktop': normalizedColumns.desktop,
                    '--columns-tablet': normalizedColumns.tablet,
                    '--columns-mobile': normalizedColumns.mobile,
                } as React.CSSProperties}
            >
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

