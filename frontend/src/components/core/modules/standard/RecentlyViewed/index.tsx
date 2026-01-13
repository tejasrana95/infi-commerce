'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getComponent } from '@/components/templates/registry';
import { ModuleProps } from '../..';
import api from '@/lib/api';
import styles from './RecentlyViewed.module.scss';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_STORED = 20;

interface RecentlyViewedConfig {
    title?: string;
    limit?: number;
    columns?: number;
    layout?: 'carousel' | 'grid';
    showRating?: boolean;
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

interface RecentlyViewedProps extends ModuleProps {
    // Current product to exclude from display
    currentProductId?: string;
}

// Helper to get recently viewed IDs from localStorage
const getStoredProductIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Helper to add a product to recently viewed
export const addToRecentlyViewed = (productId: string) => {
    if (typeof window === 'undefined') return;
    try {
        let ids = getStoredProductIds();
        // Remove if already exists (to move to front)
        ids = ids.filter(id => id !== productId);
        // Add to front
        ids.unshift(productId);
        // Limit stored items
        ids = ids.slice(0, MAX_STORED);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
        console.error('Failed to save recently viewed:', error);
    }
};

export default function RecentlyViewedModule({
    config,
    currentProductId,
}: RecentlyViewedProps) {
    const {
        title = 'Recently Viewed',
        limit = 8,
        columns = 4,
        layout = 'carousel',
        showRating = true,
    } = config as RecentlyViewedConfig;

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const ProductCard = getComponent('ProductCard');

    // Get visible count based on screen size
    const getVisibleCount = () => {
        if (typeof window === 'undefined') return columns;
        if (window.innerWidth < 768) return 1;
        if (window.innerWidth < 1024) return Math.min(columns, 2);
        return columns;
    };

    const [visibleCount, setVisibleCount] = useState(columns);

    useEffect(() => {
        const handleResize = () => setVisibleCount(getVisibleCount());
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [columns]);

    // Fetch products from localStorage IDs
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);

                // Get stored product IDs
                let storedIds = getStoredProductIds();

                // Exclude current product
                if (currentProductId) {
                    storedIds = storedIds.filter(id => id !== currentProductId);
                }

                // Limit to requested amount
                storedIds = storedIds.slice(0, limit);

                if (storedIds.length === 0) {
                    setProducts([]);
                    setLoading(false);
                    return;
                }

                // Fetch product data from API
                const params = new URLSearchParams();
                params.append('ids', storedIds.join(','));
                params.append('limit', storedIds.length.toString());
                params.append('isActive', 'true');

                const data = await api.get<Product[] | { products: Product[] }>(`products?${params.toString()}`);
                const fetchedProducts = Array.isArray(data) ? data : data.products || [];

                // Sort products to match the order in localStorage (most recent first)
                const productMap = new Map(fetchedProducts.map(p => [p._id, p]));
                const orderedProducts = storedIds
                    .map(id => productMap.get(id))
                    .filter((p): p is Product => p !== undefined);

                setProducts(orderedProducts);
            } catch (err) {
                console.error('Error fetching recently viewed products:', err);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [limit, currentProductId]);

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

    // Don't render if no recently viewed products
    if (products.length === 0) {
        return null;
    }

    const slideWidth = 100 / visibleCount;
    const translateX = currentIndex * slideWidth;

    // Grid layout
    if (layout === 'grid') {
        return (
            <div className={styles.container}>
                {title && (
                    <div className={styles.header}>
                        <h2 className={styles.title}>{title}</h2>
                    </div>
                )}
                <div className={`${styles.grid} ${columnClass}`}>
                    {products.map((product) => (
                        <div key={product._id} className={styles.gridItem}>
                            <ProductCard
                                product={product}
                                showRating={showRating}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Carousel layout
    return (
        <div className={styles.container}>
            {title && (
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                </div>
            )}

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
                            disabled={currentIndex === 0}
                            aria-label="Previous products"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            className={`${styles.navButton} ${styles.navNext}`}
                            onClick={nextSlide}
                            disabled={currentIndex >= maxIndex}
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
