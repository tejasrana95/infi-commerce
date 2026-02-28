'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getComponent } from '@/components/templates/registry';
import { ModuleProps } from '../..';
import api from '@/lib/api';
import { useStore } from '@/providers/StoreProvider';
import styles from './CategoryShowcase.module.scss';

interface CategoryShowcaseConfig {
    categoryIds: string[];
    title?: string;
    titleTypography?: {
        fontFamily?: string;
        fontSize?: number;
        color?: string;
        alignment?: 'left' | 'center' | 'right';
    };
    layout?: 'grid' | 'carousel';
    style?: 'card' | 'banner' | 'minimal' | 'overlay';
    columns?: number;
    gap?: number;
    showDescription?: boolean;
}

interface Category {
    _id: string;
    title: string;
    slug: string;
    image?: string;
    description?: string;
    productCount?: number;
}

export default function CategoryShowcaseModule({ config, sectionType }: ModuleProps) {
    const {
        categoryIds,
        title,
        titleTypography,
        layout = 'grid',
        style = 'card',
        columns = 4,
        gap = 16,
        showDescription = true,
    } = config as CategoryShowcaseConfig;

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const { store } = useStore();

    const CategoryCard = getComponent('CategoryCard');

    // Only apply container styling if not in a full-width section
    const isFullWidth = sectionType === 'full-width';
    const containerClass = isFullWidth ? styles.fluidContainer : styles.container;

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const ids = categoryIds.join(',');
                const params = new URLSearchParams({ ids });
                if (store?._id) {
                    params.set('storeId', store._id);
                }
                const data = await api.get<{ categories: Category[] }>(`categories?${params.toString()}`);
                setCategories(Array.isArray(data.categories) ? data.categories : []);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError(err instanceof Error ? err.message : 'Failed to load categories');
            } finally {
                setLoading(false);
            }
        };

        if (categoryIds && categoryIds.length > 0 && store?._id) {
            fetchCategories();
        } else {
            setLoading(false);
        }
    }, [categoryIds, store?._id]);

    const columnClass = styles[`columns${Math.min(Math.max(columns, 2), 6)}`];
    const titleAlignment = titleTypography?.alignment || 'left';
    const titleStyle: React.CSSProperties = {
        fontFamily: titleTypography?.fontFamily || undefined,
        fontSize: titleTypography?.fontSize ? `${titleTypography.fontSize}px` : undefined,
        color: titleTypography?.color || undefined,
        textAlign: titleAlignment,
    };
    const headerStyle: React.CSSProperties | undefined = layout === 'carousel'
        ? undefined
        : { justifyContent: titleAlignment === 'center' ? 'center' : titleAlignment === 'right' ? 'flex-end' : 'flex-start' };

    // Responsive columns for carousel
    const [visibleColumns, setVisibleColumns] = useState(columns);

    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setVisibleColumns(2);
            } else if (width < 1024) {
                setVisibleColumns(Math.min(columns, 3)); // Max 3 on tablet
            } else {
                setVisibleColumns(columns);
            }
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, [columns]);

    // Carousel navigation handlers
    const scrollCarousel = (direction: 'left' | 'right') => {
        if (!carouselRef.current) return;
        const scrollAmount = carouselRef.current.offsetWidth * 0.8;
        carouselRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    };

    if (loading) {
        return (
            <div className={`${containerClass}`}>
                {title && (
                    <div className={styles.header} style={headerStyle}>
                        <h2 className={styles.title} style={titleStyle}>{title}</h2>
                    </div>
                )}
                <div className={`${styles.skeletonGrid} ${columnClass}`}>
                    {Array.from({ length: categoryIds.length }).map((_, i) => (
                        <div key={i} className={styles.skeleton} />
                    ))}
                </div>
            </div>
        );
    }

    if (error || categories.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={containerClass}>
                    <div className={styles.errorState}>
                        <span>📁</span>
                        <p>Error: {error || 'No categories found'}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div className={containerClass}>
            {title && (
                <div className={styles.header} style={headerStyle}>
                    <h2 className={styles.title} style={titleStyle}>{title}</h2>
                    {layout === 'carousel' && (
                        <div className={styles.navButtons}>
                            <button
                                className={styles.navButton}
                                onClick={() => scrollCarousel('left')}
                                aria-label="Previous"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                className={styles.navButton}
                                onClick={() => scrollCarousel('right')}
                                aria-label="Next"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {layout === 'carousel' ? (
                <div
                    ref={carouselRef}
                    className={styles.carousel}
                    style={{ gap: `${gap}px` }}
                >
                    {categories.map((category, index) => (
                        // Prioritize first visible cards to improve mobile LCP.
                        <div
                            key={category._id}
                            className={styles.carouselItem}
                            style={{ minWidth: `calc((100% - ${gap * (visibleColumns - 1)}px) / ${visibleColumns})` }}
                        >
                            <CategoryCard
                                category={{ ...category, showDescription }}
                                style={style}
                                imagePriority={index < 2}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    className={`${styles.grid} ${columnClass}`}
                    style={{ gap: `${gap}px` }}
                >
                    {categories.map((category, index) => (
                        <CategoryCard
                            key={category._id}
                            category={{ ...category, showDescription }}
                            style={style}
                            imagePriority={index < 2}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
