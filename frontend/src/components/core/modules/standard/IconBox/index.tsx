'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ModuleProps } from '../..';
import DynamicIcon from '@/components/core/common/DynamicIcon';
import styles from './IconBox.module.scss';
import { useStore } from '@/providers/StoreProvider';

interface IconBoxItem {
    id: string;
    icon?: string;
    image?: string;
    title: string;
    description?: string;
    link?: string;
    ctaText?: string;
}

interface IconBoxConfig {
    items: IconBoxItem[];
    layout: 'icon-top' | 'icon-left' | 'icon-right' | 'icon-bottom';
    displayMode: 'grid' | 'carousel';
    columns: number;
    iconType: 'icon' | 'image';
    textAlign: 'left' | 'center' | 'right';
}

export default function IconBoxModule({ config }: ModuleProps) {
    const {
        items = [],
        layout = 'icon-top',
        displayMode = 'grid',
        columns = 3,
        iconType = 'icon',
        textAlign = 'center'
    } = config as IconBoxConfig;

    const { themeConfig } = useStore();
    const primaryColor = themeConfig?.colors?.primary || '#3b82f6';
    const primaryLightColor = `${primaryColor}15`; // 10% opacity

    const [currentIndex, setCurrentIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(columns);

    // Responsive columns calculation
    const calculateVisibleCount = useCallback(() => {
        if (typeof window === 'undefined') return columns;
        if (window.innerWidth < 640) return 1;
        if (window.innerWidth < 1024) return Math.min(columns, 2);
        return columns;
    }, [columns]);

    useEffect(() => {
        const handleResize = () => setVisibleCount(calculateVisibleCount());
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [calculateVisibleCount]);

    const maxIndex = Math.max(0, items.length - visibleCount);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    }, [maxIndex]);

    const prevSlide = useCallback(() => {
        setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
    }, [maxIndex]);

    const goToSlide = (index: number) => {
        setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
    };

    const [gridColumns, setGridColumns] = useState(columns);

    // Responsive grid columns calculation
    useEffect(() => {
        const calculateColumns = () => {
            if (typeof window === 'undefined') return columns;
            if (window.innerWidth < 768) return 1;  // Mobile
            if (window.innerWidth < 1024) return 2; // Tablet
            return columns; // Desktop - use configured value
        };

        const handleResize = () => setGridColumns(calculateColumns());
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [columns]);

    const gridStyle = {
        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
    } as React.CSSProperties;

    const boxStyle = {
        '--primary-color': primaryColor,
        '--primary-color-light': primaryLightColor,
        textAlign: textAlign
    } as React.CSSProperties;

    const renderItem = (item: IconBoxItem, index: number) => {
        const Wrapper: any = item.link ? Link : 'div';
        const wrapperProps = item.link ? { href: item.link } : {};

        return (
            <Wrapper
                key={item.id || index}
                {...wrapperProps}
                className={`${styles.iconBox} ${styles[`layout-${layout}`]}`}
                style={boxStyle as any}
            >
                <div className={styles.iconWrapper}>
                    {iconType === 'image' && item.image ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                sizes="60px"
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <DynamicIcon name={item.icon || 'FaStar'} size={24} />
                    )}
                </div>

                <div className={styles.content}>
                    <h3 className={styles.title}>{item.title}</h3>
                    {item.description && <p className={styles.description}>{item.description}</p>}

                    {item.link && item.ctaText && (
                        <span className={styles.ctaLink}>
                            {item.ctaText}
                            <DynamicIcon name="FaArrowRight" size={12} className="ml-1" />
                        </span>
                    )}
                </div>
            </Wrapper>
        );
    };

    if (displayMode === 'carousel') {
        const translateX = currentIndex * (100 / visibleCount);

        return (
            <div className={styles.iconBoxContainer}>
                <div className={styles.carouselWrapper}>
                    <div className={styles.carouselViewport}>
                        <div
                            className={styles.carouselTrack}
                            style={{
                                transform: `translateX(-${translateX}%)`,
                                gridTemplateColumns: `repeat(${items.length}, ${100 / visibleCount}%)`
                            }}
                        >
                            {items.map((item, index) => (
                                <div key={index} className={styles.carouselSlide}>
                                    {renderItem(item, index)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {items.length > visibleCount && (
                        <>
                            <button
                                className={`${styles.navButton} ${styles.prev}`}
                                onClick={prevSlide}
                                aria-label="Previous slide"
                            >
                                <DynamicIcon name="FaChevronLeft" size={20} />
                            </button>
                            <button
                                className={`${styles.navButton} ${styles.next}`}
                                onClick={nextSlide}
                                aria-label="Next slide"
                            >
                                <DynamicIcon name="FaChevronRight" size={20} />
                            </button>
                        </>
                    )}
                </div>

                {items.length > visibleCount && (
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

    return (
        <div className={styles.iconBoxContainer}>
            <div className={styles.grid} style={gridStyle}>
                {items.map((item, index) => renderItem(item, index))}
            </div>
        </div>
    );
}
