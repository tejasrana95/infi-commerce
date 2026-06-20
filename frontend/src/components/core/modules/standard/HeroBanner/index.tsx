'use client';

import React, { useEffect, useState } from 'react';
import { ModuleProps } from '../..';
import api from '@/lib/api';
import DynamicIcon from '../../../common/DynamicIcon';
import styles from './HeroBanner.module.css';

interface HeroBannerData {
    _id: string;
    storeId: string;
    name: string;
    isActive: boolean;
    title: {
        text: string;
        color?: string;
        highlightColor?: string;
        highlightFontFamily?: string;
        fontSize?: string;
        fontSizeTablet?: string;
        fontSizeMobile?: string;
        fontFamily?: string;
        fontWeight?: string;
        textAlign?: {
            desktop?: string;
            tablet?: string;
            mobile?: string;
        };
        lineHeight?: string;
    };
    description: {
        text: string;
        color?: string;
        fontSize?: string;
        fontSizeTablet?: string;
        fontSizeMobile?: string;
        fontFamily?: string;
        fontWeight?: string;
        textAlign?: {
            desktop?: string;
            tablet?: string;
            mobile?: string;
        };
        lineHeight?: string;
    };
    stats?: Array<{
        number: string;
        label: string;
        icon?: string;
        color?: string;
        numberColor?: string;
        labelColor?: string;
        fontSize?: string;
        numberFontSize?: string;
        labelFontSize?: string;
        fontFamily?: string;
        numberFontFamily?: string;
        labelFontFamily?: string;
        fontWeight?: string;
        numberFontWeight?: string;
        labelFontWeight?: string;
        textAlign?: {
            desktop?: string;
            tablet?: string;
            mobile?: string;
        };
        lineHeight?: string;
    }>;
    chips?: Array<{
        label: string;
        icon?: string;
        color?: string;
        fontSize?: string;
        fontFamily?: string;
        fontWeight?: string;
        textAlign?: {
            desktop?: string;
            tablet?: string;
            mobile?: string;
        };
        lineHeight?: string;
        backgroundColor?: string;
        borderRadius?: string;
        borderColor?: string;
    }>;
    image?: {
        src: string;
        borderRadius?: string;
        borderColor?: string;
        borderWidth?: string;
        highlights?: Array<{
            label?: string;
            value?: string;
            position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
            backgroundColor?: string;
            textColor?: string;
            labelColor?: string;
            labelFontFamily?: string;
            labelFontSize?: string;
            labelFontWeight?: string;
            valueColor?: string;
            valueFontFamily?: string;
            valueFontSize?: string;
            valueFontWeight?: string;
        }>;
    };
    ctas?: Array<{
        label: string;
        link: string;
        target?: string;
        color?: string;
        fontSize?: string;
        fontFamily?: string;
        fontWeight?: string;
        textAlign?: {
            desktop?: string;
            tablet?: string;
            mobile?: string;
        };
        lineHeight?: string;
        backgroundColor?: string;
        borderRadius?: string;
        borderColor?: string;
    }>;
    config?: {
        backgroundGradient?: string;
        padding?: string;
        margin?: string;
    };
}

interface HeroBannerProps extends ModuleProps {
    initialData?: HeroBannerData;
}

export default function HeroBannerModule({ config, initialData }: HeroBannerProps) {
    const bannerId = config?.bannerId;
    const [banner, setBanner] = useState<HeroBannerData | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        if (initialData) return;

        const fetchBanner = async () => {
            if (!bannerId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await api.get<{ success: boolean; heroBanner: HeroBannerData }>(`/hero-banners/${bannerId}`);
                if (response?.success && response.heroBanner) {
                    setBanner(response.heroBanner);
                }
            } catch (error) {
                console.error('Error fetching hero banner:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBanner();
    }, [bannerId, initialData]);

    if (loading) {
        return <div className={styles.skeletonContainer} />;
    }

    if (!banner || !banner.isActive) {
        return null;
    }

    const { title, description, stats = [], chips = [], image, ctas = [], config: bannerConfig } = banner;

    const titleTextAlign = title.textAlign || {};
    const titleStyles = {
        color: title.color || '#111827',
        fontFamily: title.fontFamily || 'inherit',
        fontWeight: title.fontWeight || 'bold',
        lineHeight: title.lineHeight || '1.2',
        '--title-highlight-color': title.highlightColor || '#b45309',
        '--title-highlight-font-family': title.highlightFontFamily || undefined,
        '--title-font-size-desktop': title.fontSize || '4.5rem',
        '--title-font-size-tablet': title.fontSizeTablet || title.fontSize || '3.5rem',
        '--title-font-size-mobile': title.fontSizeMobile || title.fontSizeTablet || title.fontSize || '2.5rem',
        '--title-text-align-desktop': titleTextAlign.desktop || 'left',
        '--title-text-align-tablet': titleTextAlign.tablet || titleTextAlign.desktop || 'left',
        '--title-text-align-mobile': titleTextAlign.mobile || titleTextAlign.tablet || titleTextAlign.desktop || 'left',
    } as React.CSSProperties;

    const descTextAlign = description.textAlign || {};
    const descriptionStyles = {
        color: description.color || '#4b5563',
        fontFamily: description.fontFamily || 'inherit',
        fontWeight: description.fontWeight || 'normal',
        lineHeight: description.lineHeight || '1.6',
        '--description-font-size-desktop': description.fontSize || '1.125rem',
        '--description-font-size-tablet': description.fontSizeTablet || description.fontSize || '1rem',
        '--description-font-size-mobile': description.fontSizeMobile || description.fontSizeTablet || description.fontSize || '0.875rem',
        '--description-text-align-desktop': descTextAlign.desktop || 'left',
        '--description-text-align-tablet': descTextAlign.tablet || descTextAlign.desktop || 'left',
        '--description-text-align-mobile': descTextAlign.mobile || descTextAlign.tablet || descTextAlign.desktop || 'left',
    } as React.CSSProperties;

    const containerStyles = {
        background: bannerConfig?.backgroundGradient || 'linear-gradient(135deg, #fefaf4 0%, #f7ebd9 100%)',
    } as React.CSSProperties;
    
    const innerSectionStyles = {
        padding: bannerConfig?.padding || '80px 0',
            margin: bannerConfig?.margin || '0',
    } as React.CSSProperties;

    return (
        <section style={containerStyles} className={styles.section}>
            <div className={`${styles.overlayPattern}`} ></div>
            <div className={styles.container} style={innerSectionStyles}>
                <div className={styles.leftColumn}>
                    {chips.length > 0 && (
                        <div className={styles.chipsContainer}>
                            {chips.map((chip, idx) => (
                                <div
                                    key={idx}
                                    className={styles.chip}
                                    style={{
                                        color: chip.color || '#b45309',
                                        backgroundColor: chip.backgroundColor || '#fffaf2',
                                        borderColor: chip.borderColor || '#e8d8bd',
                                        borderRadius: chip.borderRadius || '30px',
                                        fontSize: chip.fontSize || '0.875rem',
                                        fontFamily: chip.fontFamily || 'inherit',
                                        fontWeight: chip.fontWeight || '500',
                                        lineHeight: chip.lineHeight || '1.2',
                                    }}
                                >
                                    {chip.icon && (
                                        <span className={styles.chipIcon}>
                                            <DynamicIcon name={chip.icon} size={16} />
                                        </span>
                                    )}
                                    <span>{chip.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div
                        className={styles.title}
                        style={titleStyles}
                        dangerouslySetInnerHTML={{ __html: title.text }}
                    />

                    <p className={styles.description} style={descriptionStyles}>
                        {description.text}
                    </p>

                    {ctas.length > 0 && (
                        <div className={styles.ctaContainer}>
                            {ctas.map((cta, idx) => (
                                <a
                                    key={idx}
                                    href={cta.link}
                                    target={cta.target || '_self'}
                                    className={styles.ctaButton}
                                    style={{
                                        color: cta.color || '#ffffff',
                                        backgroundColor: cta.backgroundColor || '#b45309',
                                        borderColor: cta.borderColor || 'transparent',
                                        borderRadius: cta.borderRadius || '8px',
                                        fontSize: cta.fontSize || '1rem',
                                        fontFamily: cta.fontFamily || 'inherit',
                                        fontWeight: cta.fontWeight || '600',
                                        lineHeight: cta.lineHeight || '1.2',
                                    }}
                                >
                                    {cta.label}
                                </a>
                            ))}
                        </div>
                    )}

                    {stats.length > 0 && (
                        <div className={styles.statsContainer}>
                            {stats.map((stat, idx) => (
                                <div key={idx} className={styles.statBox}>
                                    <div
                                        className={styles.statNumber}
                                        style={{
                                            color: stat.numberColor || stat.color || '#111827',
                                            fontSize: stat.numberFontSize || stat.fontSize || '1.875rem',
                                            fontFamily: stat.numberFontFamily || stat.fontFamily || 'inherit',
                                            fontWeight: stat.numberFontWeight || stat.fontWeight || '700',
                                            lineHeight: stat.lineHeight || '1.2',
                                        }}
                                    >
                                        {stat.icon && (
                                            <span className={styles.statIcon}>
                                                <DynamicIcon name={stat.icon} size={20} />
                                            </span>
                                        )}
                                        {stat.number}
                                    </div>
                                    <div
                                        className={styles.statLabel}
                                        style={{
                                            color: stat.labelColor || '#6b7280',
                                            fontSize: stat.labelFontSize || '0.875rem',
                                            fontFamily: stat.labelFontFamily || 'inherit',
                                            fontWeight: stat.labelFontWeight || '500',
                                        }}
                                    >
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {image?.src && (
                    <div className={styles.rightColumn}>
                        <div
                            className={styles.imageWrapper}
                            style={{
                                borderRadius: image.borderRadius || '24px',
                                borderColor: image.borderColor || 'transparent',
                                borderWidth: image.borderWidth || '0px',
                                borderStyle: 'solid',
                            }}
                        >
                            <img src={image.src} alt={banner.name} className={styles.mainImage} />

                            {image.highlights && image.highlights.map((highlight, idx) => {
                                const positionClass = styles[highlight.position || 'top-right'];
                                return (
                                    <div
                                        key={idx}
                                        className={`${styles.highlightCard} ${positionClass}`}
                                        style={{
                                            backgroundColor: highlight.backgroundColor || '#ffffff',
                                            color: highlight.textColor || '#111827',
                                        }}
                                    >
                                        {highlight.label && (
                                            <span
                                                className={styles.highlightLabel}
                                                style={{
                                                    color: highlight.labelColor || undefined,
                                                    fontFamily: highlight.labelFontFamily || undefined,
                                                    fontSize: highlight.labelFontSize || undefined,
                                                    fontWeight: highlight.labelFontWeight || undefined,
                                                }}
                                            >
                                                {highlight.label}
                                            </span>
                                        )}
                                        {highlight.value && (
                                            <span
                                                className={styles.highlightValue}
                                                style={{
                                                    color: highlight.valueColor || undefined,
                                                    fontFamily: highlight.valueFontFamily || undefined,
                                                    fontSize: highlight.valueFontSize || undefined,
                                                    fontWeight: highlight.valueFontWeight || undefined,
                                                }}
                                            >
                                                {highlight.value}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
