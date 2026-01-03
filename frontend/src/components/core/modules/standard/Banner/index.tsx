'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
import Link from 'next/link';
import { ModuleProps } from '../..';
import api from '@/lib/api';
import styles from './Banner.module.scss';

interface BannerConfig {
    bannerId: string;
}

interface BannerData {
    _id: string;
    name: string;
    image: string;
    mobileImage?: string;
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    alignment: 'left' | 'center' | 'right';
    overlay: {
        enabled: boolean;
        color: string;
        opacity: number;
    };
    textColor?: string;
}


export default function BannerModule({ config }: ModuleProps) {
    const { bannerId } = config as BannerConfig;
    const [banner, setBanner] = useState<BannerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const fetchBanner = async () => {
            if (!bannerId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await api.get<{ banner: BannerData }>(`banners/${bannerId}`);
                setBanner(data.banner);
            } catch (err) {
                console.error('Error fetching banner:', err);
                setError(err instanceof Error ? err.message : 'Failed to load banner');
            } finally {
                setLoading(false);
            }
        };

        fetchBanner();
    }, [bannerId]);

    // Loading skeleton
    if (loading) {
        return (
            <div className={styles.bannerContainer}>
                <div className={styles.skeleton} />
            </div>
        );
    }

    // Error state (only show in development)
    if (error || !banner) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={styles.bannerContainer}>
                    <div className={styles.errorState}>
                        <span className={styles.errorIcon}>⚠️</span>
                        <p>Banner not found: {error || 'No banner ID provided'}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const desktopImage = banner.image;
    const mobileImage = banner.mobileImage || desktopImage;
    const hasContent = banner.title || banner.subtitle || banner.ctaText;

    return (
        <div className={styles.bannerContainer}>
            <div
                className={`${styles.banner} ${styles[`align${banner.alignment.charAt(0).toUpperCase() + banner.alignment.slice(1)}`]}`}
            >
                {/* Desktop Image */}
                <div className={styles.imageWrapper}>
                    {desktopImage && !imageError ? (
                        <>
                            <ImageWithDimensions
                                src={desktopImage}
                                alt={banner.title || banner.name}
                                fill
                                className={`${styles.bannerImage} ${styles.desktopImage}`}
                                priority
                                sizes="100vw"
                            />
                            <ImageWithDimensions
                                src={mobileImage}
                                alt={banner.title || banner.name}
                                fill
                                className={`${styles.bannerImage} ${styles.mobileImage}`}
                                priority
                                sizes="100vw"
                            />
                        </>
                    ) : (
                        <div className={styles.imagePlaceholder}>
                            <span>🖼️</span>
                            <p>Image unavailable</p>
                        </div>
                    )}

                    {/* Gradient overlay for text visibility */}
                    {hasContent && <div className={styles.gradientOverlay} />}

                    {/* Custom overlay */}
                    {banner.overlay?.enabled && (
                        <div
                            className={styles.customOverlay}
                            style={{
                                backgroundColor: banner.overlay.color,
                                opacity: banner.overlay.opacity,
                            }}
                        />
                    )}
                </div>

                {/* Content */}
                {hasContent && (
                    <div className={styles.content}>
                        <div className={styles.contentInner}>
                            {banner.title && (
                                <h2
                                    className={styles.title}
                                    style={{ color: banner.textColor || '#ffffff' }}
                                >
                                    {banner.title}
                                </h2>
                            )}

                            {banner.subtitle && (
                                <p
                                    className={styles.subtitle}
                                    style={{ color: banner.textColor || '#ffffff' }}
                                >
                                    {banner.subtitle}
                                </p>
                            )}

                            {banner.ctaText && banner.ctaLink && (
                                <Link href={banner.ctaLink} className={styles.ctaButton}>
                                    {banner.ctaText}
                                    <svg className={styles.ctaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
