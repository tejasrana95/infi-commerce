'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ModuleProps } from '../..';
import DynamicIcon from '@/components/core/common/DynamicIcon';
import styles from './IconBox.module.scss';
import { useStore } from '@/providers/StoreProvider';
import { formatFontFamily } from '@/lib/fonts';
import { useDynamicFonts } from '@/hooks/useDynamicFonts';

interface IconBoxItem {
    id: string;
    icon?: string;
    image?: string;
    title: string;
    description?: string;
    link?: string;
    ctaText?: string;
    iconColor?: string;
    ctaColor?: string;
    bgColor?: string;
}

interface IconBoxConfig {
    items: IconBoxItem[];
    layout: 'icon-top' | 'icon-left' | 'icon-right' | 'icon-bottom';
    displayMode: 'grid' | 'carousel';
    columns: number;
    iconType: 'icon' | 'image';
    textAlign: 'left' | 'center' | 'right';
    styles?: {
        borderColor?: string;
        borderRadius?: number;
        iconColor?: string;
        iconBgColor?: string;
        iconBgRadius?: number;
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        titleFontFamily?: string;
        titleFontSize?: number;
        titleFontWeight?: number;
        descFontFamily?: string;
        descFontSize?: number;
        descFontWeight?: number;
        bgColor?: string;
        ctaColor?: string;
        titleColor?: string;
        descColor?: string;
        iconSize?: number;
        iconBgSize?: number;
        iconBgPadding?: number;
        iconAlign?: string;
        hoverEffect?: string;
    };
}

export default function IconBoxModule({ config }: ModuleProps) {
    const {
        items = [],
        layout = 'icon-top',
        displayMode = 'grid',
        columns = 3,
        iconType = 'icon',
        textAlign = 'center',
        fullSizeImage = false,
        styles: customStyles = {}
    } = config as IconBoxConfig & { fullSizeImage?: boolean };

    const { themeConfig } = useStore();
    const primaryColor = themeConfig?.colors?.primary || '#3b82f6';
    const primaryLightColor = `${primaryColor}15`; // 10% opacity

    const [currentIndex, setCurrentIndex] = useState(0);

    // Dynamically load Title and Description fonts
    const fontsToLoad: string[] = [];
    if (customStyles?.titleFontFamily) fontsToLoad.push(customStyles.titleFontFamily);
    if (customStyles?.descFontFamily) fontsToLoad.push(customStyles.descFontFamily);
    useDynamicFonts(fontsToLoad);

    // For interaction logic (clamping index), we track visible items in JS
    // BUT rendering is handled by CSS to prevent FOUC
    const calculateVisibleCount = useCallback(() => {
        if (typeof window === 'undefined') return columns;
        if (window.innerWidth < 640) return 1;
        if (window.innerWidth < 1024) return Math.min(columns, 2);
        return columns;
    }, [columns]);

    const [visibleCount, setVisibleCount] = useState(columns);

    useEffect(() => {
        const handleResize = () => setVisibleCount(calculateVisibleCount());
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [calculateVisibleCount]);

    const maxIndex = Math.max(0, items.length - visibleCount);

    // Adjust currentIndex if window resize changes visibleCount
    useEffect(() => {
        if (currentIndex > maxIndex) {
            setCurrentIndex(Math.max(0, maxIndex));
        }
    }, [maxIndex, currentIndex]);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    }, [maxIndex]);

    const prevSlide = useCallback(() => {
        setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
    }, [maxIndex]);

    const goToSlide = (index: number) => {
        setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
    };

    const gridStyle = {
        '--desktop-columns': columns,
    } as React.CSSProperties;

    const boxStyle = {
        '--primary-color': primaryColor,
        '--primary-color-light': primaryLightColor,
        textAlign: textAlign
    } as React.CSSProperties;

    const renderItem = (item: IconBoxItem, index: number) => {
        const Wrapper: any = item.link ? Link : 'div';
        const wrapperProps = item.link ? { href: item.link } : {};

        const isFullImage = fullSizeImage && iconType === 'image' && item.image;

        // Custom styling for this card/box
        const itemBg = item.bgColor || customStyles.bgColor || undefined;
        const itemStyle = {
            ...boxStyle,
            backgroundColor: itemBg,
            background: itemBg,
        } as React.CSSProperties;

        // Hover effect styles
        const hoverEffect = customStyles.hoverEffect || 'default';
        if (hoverEffect === 'none') {
            (itemStyle as any)['--hover-y'] = '0px';
            (itemStyle as any)['--hover-scale'] = '1';
            (itemStyle as any)['--hover-shadow'] = 'none';
            (itemStyle as any)['--hover-line-opacity'] = '0';
            (itemStyle as any)['--hover-icon-scale'] = '1';
            (itemStyle as any)['--hover-border'] = 'transparent';
        } else if (hoverEffect === 'lift') {
            (itemStyle as any)['--hover-y'] = '-12px';
            (itemStyle as any)['--hover-scale'] = '1';
            (itemStyle as any)['--hover-shadow'] = '0 20px 40px rgba(0, 0, 0, 0.08)';
            (itemStyle as any)['--hover-line-opacity'] = '0';
            (itemStyle as any)['--hover-icon-scale'] = '1.05';
        } else if (hoverEffect === 'zoom') {
            (itemStyle as any)['--hover-y'] = '0px';
            (itemStyle as any)['--hover-scale'] = '1.04';
            (itemStyle as any)['--hover-shadow'] = '0 12px 24px rgba(0, 0, 0, 0.05)';
            (itemStyle as any)['--hover-line-opacity'] = '0';
            (itemStyle as any)['--hover-icon-scale'] = '1.1';
        } else if (hoverEffect === 'shadow') {
            (itemStyle as any)['--hover-y'] = '0px';
            (itemStyle as any)['--hover-scale'] = '1';
            (itemStyle as any)['--hover-shadow'] = '0 0 35px rgba(59, 130, 246, 0.25)';
            (itemStyle as any)['--hover-line-opacity'] = '1';
            (itemStyle as any)['--hover-icon-scale'] = '1.15';
        }

        // Custom borders
        if (customStyles.borderColor) {
            itemStyle.borderColor = customStyles.borderColor;
            itemStyle.borderStyle = 'solid';
        }
        if (customStyles.borderRadius !== undefined) {
            itemStyle.borderRadius = `${customStyles.borderRadius}px`;
        }

        // Custom paddings
        if (customStyles.paddingTop !== undefined) itemStyle.paddingTop = `${customStyles.paddingTop}px`;
        if (customStyles.paddingBottom !== undefined) itemStyle.paddingBottom = `${customStyles.paddingBottom}px`;
        if (customStyles.paddingLeft !== undefined) itemStyle.paddingLeft = `${customStyles.paddingLeft}px`;
        if (customStyles.paddingRight !== undefined) itemStyle.paddingRight = `${customStyles.paddingRight}px`;

        // Custom icon styles
        const iconStyle = {
            color: item.iconColor || customStyles.iconColor || undefined,
        } as React.CSSProperties;

        if (customStyles.iconBgColor) {
            iconStyle.background = customStyles.iconBgColor;
        }
        if (customStyles.iconBgRadius !== undefined) {
            iconStyle.borderRadius = `${customStyles.iconBgRadius}px`;
            iconStyle.overflow = 'hidden'; // clip any custom image or content
        }
        if (customStyles.iconSize !== undefined) {
            (iconStyle as any)['--icon-size'] = `${customStyles.iconSize}px`;
        }
        if (customStyles.iconBgSize !== undefined) {
            iconStyle.width = `${customStyles.iconBgSize}px`;
            iconStyle.height = `${customStyles.iconBgSize}px`;
        }
        if (customStyles.iconBgPadding !== undefined) {
            iconStyle.padding = `${customStyles.iconBgPadding}px`;
        }
        if (customStyles.iconAlign) {
            iconStyle.alignSelf = customStyles.iconAlign;
            if (customStyles.iconAlign === 'flex-start') {
                iconStyle.marginLeft = '0';
                iconStyle.marginRight = 'auto';
            } else if (customStyles.iconAlign === 'center') {
                iconStyle.marginLeft = 'auto';
                iconStyle.marginRight = 'auto';
            } else if (customStyles.iconAlign === 'flex-end') {
                iconStyle.marginLeft = 'auto';
                iconStyle.marginRight = '0';
            }
        }

        const ctaStyle = {
            color: item.ctaColor || customStyles.ctaColor || undefined,
        } as React.CSSProperties;

        // Typography Styles
        const titleStyle = {
            fontFamily: formatFontFamily(customStyles.titleFontFamily),
            fontSize: customStyles.titleFontSize ? `${customStyles.titleFontSize}px` : undefined,
            fontWeight: customStyles.titleFontWeight || undefined,
            color: customStyles.titleColor || undefined,
        } as React.CSSProperties;

        const descStyle = {
            fontFamily: formatFontFamily(customStyles.descFontFamily),
            fontSize: customStyles.descFontSize ? `${customStyles.descFontSize}px` : undefined,
            fontWeight: customStyles.descFontWeight || undefined,
            color: customStyles.descColor || undefined,
        } as React.CSSProperties;

        return (
            <Wrapper
                key={item.id || index}
                {...wrapperProps}
                className={`${styles.iconBox} ${styles[`layout-${layout}`]} ${isFullImage ? styles.fullSizeImage : ''}`}
                style={itemStyle as any}
                {...(item.link ? {
                    'data-track': 'icon_box_click',
                    'data-icon-box-title': item.title
                } : {})}
            >
                <div className={styles.iconWrapper} style={iconStyle}>
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
                        <DynamicIcon name={item.icon || 'FaStar'} size={customStyles.iconSize || 24} />
                    )}
                </div>

                <div className={styles.content}>
                    <h3 className={styles.title} style={titleStyle}>{item.title}</h3>
                    {item.description && <p className={styles.description} style={descStyle}>{item.description}</p>}

                    {item.link && item.ctaText && (
                        <span className={styles.ctaLink} style={ctaStyle}>
                            {item.ctaText}
                            <DynamicIcon name="FaArrowRight" size={12} className="ml-1" />
                        </span>
                    )}
                </div>
            </Wrapper>
        );
    };

    if (displayMode === 'carousel') {
        const carouselStyle = {
            '--desktop-columns': columns,
            '--item-count': items.length,
            '--current-index': currentIndex
        } as React.CSSProperties;

        return (
            <div className={styles.iconBoxContainer}>
                <div className={styles.carouselWrapper}>
                    <div className={styles.carouselViewport}>
                        <div
                            className={styles.carouselTrack}
                            style={carouselStyle}
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
