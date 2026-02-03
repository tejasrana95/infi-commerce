'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getComponent } from '@/components/templates/registry';
import { ModuleProps } from '../..';
import api from '@/lib/api';
import styles from './ProductCarousel.module.scss';
import { Box } from 'lucide-react';

interface ProductCarouselConfig {
    source: 'best-sellers' | 'new-arrivals' | 'custom' | 'category';
    limit: number;
    columns: number;
    showPrice: boolean;
    showRating: boolean;
    autoplay: boolean;
    autoplayInterval?: number;
    categoryIds?: string[];
    productIds?: string[];
    title?: string;
    viewAllLink?: string;
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

export default function ProductCarouselModule({ config, initialData }: ModuleProps) {
    const {
        source,
        limit = 8,
        columns = 4,
        showPrice = true,
        showRating = true,
        autoplay = false,
        autoplayInterval = 4000,
        categoryIds,
        productIds,
        title,
        viewAllLink,
    } = config as ProductCarouselConfig;

    const initialProducts = initialData as Product[];

    // Use initialProducts if provided (SSR), otherwise start empty
    const hasSSRData = initialProducts && initialProducts.length > 0;
    const [products, setProducts] = useState<Product[]>(initialProducts || []);
    const [loading, setLoading] = useState(!hasSSRData);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const ProductCard = getComponent('ProductCard');

    // Calculate visible slides based on columns
    const getVisibleCount = () => {
        if (typeof window === 'undefined') return columns;
        if (window.innerWidth < 768) return 1;
        if (window.innerWidth < 1024) return Math.min(columns, 3);
        return columns;
    };

    const [visibleCount, setVisibleCount] = useState(columns);

    useEffect(() => {
        const handleResize = () => setVisibleCount(getVisibleCount());
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [columns]);

    // Only fetch client-side if no initialProducts provided
    useEffect(() => {
        if (hasSSRData) return; // Skip fetch if SSR data exists

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, limit, categoryIds, productIds]);

    // Navigation
    const maxIndex = Math.max(0, products.length - visibleCount);

    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
    }, [maxIndex]);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
    }, [maxIndex]);

    const prevSlide = useCallback(() => {
        setCurrentIndex(prev => prev <= 0 ? maxIndex : prev - 1);
    }, [maxIndex]);

    // Auto-play
    useEffect(() => {
        if (autoplay && products.length > visibleCount && !isPaused) {
            const timer = setInterval(nextSlide, autoplayInterval);
            return () => clearInterval(timer);
        }
    }, [autoplay, autoplayInterval, products.length, visibleCount, isPaused, nextSlide]);

    const columnClass = styles[`columns${Math.min(Math.max(columns, 2), 6)}`];

    if (loading) {
        return (
            <div className={styles.container}>
                {title && <div className={styles.skeletonTitle} />}
                <div className={styles.skeletonGrid}>
                    {Array.from({ length: 4 }).map((_, i) => (
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
                        <span><Box /></span>
                        <p>Error: {error || 'No products found'}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const slideWidth = 100 / visibleCount;
    const translateX = currentIndex * slideWidth;

    return (
        <div className={styles.container}>
            {/* Header */}
            {title && (
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    {viewAllLink && (
                        <a href={viewAllLink} className={styles.viewAllLink}>
                            View All
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    )}
                </div>
            )}

            {/* Carousel */}
            <div
                className={styles.carouselWrapper}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className={styles.carouselViewport}>
                    <div
                        className={`${styles.carouselTrack} ${columnClass}`}
                        style={{ transform: `translateX(-${translateX}%)` }}
                    >
                        {products.map((product) => (
                            <div key={product._id} className={styles.carouselSlide}>
                                <ProductCard
                                    product={product}
                                    showRating={showRating}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Arrows */}
                {products.length > visibleCount && (
                    <>
                        <button
                            className={`${styles.navButton} ${styles.navPrev}`}
                            onClick={prevSlide}
                            disabled={currentIndex === 0 && !autoplay}
                            aria-label="Previous products"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            className={`${styles.navButton} ${styles.navNext}`}
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

            {/* Dots Navigation */}
            {products.length > visibleCount && (
                <div className={styles.dots}>
                    {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                        <button
                            key={index}
                            className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
