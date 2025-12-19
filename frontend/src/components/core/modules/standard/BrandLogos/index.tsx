'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModuleProps } from '../..';
import api from '@/lib/api';
import styles from './BrandLogos.module.scss';

interface BrandLogo {
    image: string;
    alt: string;
    link?: string;
    order?: number;
}

interface BrandShowcaseSettings {
    layout?: 'grid' | 'carousel';
    columns?: number;
    grayscale?: boolean;
    hoverEffect?: boolean;
    autoplay?: boolean;
    interval?: number;
}

interface BrandShowcaseData {
    _id: string;
    name: string;
    logos: BrandLogo[];
    settings?: BrandShowcaseSettings;
    isActive: boolean;
}

interface BrandLogosConfig {
    showcaseId: string;
}

// Helper to clean image URLs
const cleanImageUrl = (url: string): string => {
    if (!url) return '';
    return url.replace(/([^:]\/)\/+/g, '$1');
};

export default function BrandLogosModule({ config }: ModuleProps) {
    const { showcaseId } = config as BrandLogosConfig;
    const [showcase, setShowcase] = useState<BrandShowcaseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchShowcase = async () => {
            try {
                setLoading(true);
                const data = await api.get<{ showcase: BrandShowcaseData }>(`brand-showcases/${showcaseId}`);
                setShowcase(data.showcase);
            } catch (err) {
                console.error('Error fetching brand showcase:', err);
                setError(err instanceof Error ? err.message : 'Failed to load brand showcase');
            } finally {
                setLoading(false);
            }
        };

        if (showcaseId) {
            fetchShowcase();
        } else {
            setLoading(false);
        }
    }, [showcaseId]);

    // Infinite scroll animation for carousel
    useEffect(() => {
        const settings = showcase?.settings;
        if (settings?.layout !== 'carousel' || !settings?.autoplay || isPaused) return;

        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationId: number;
        let scrollPos = 0;
        const speed = 0.5;

        const animate = () => {
            scrollPos += speed;
            if (scrollPos >= scrollContainer.scrollWidth / 2) {
                scrollPos = 0;
            }
            scrollContainer.scrollLeft = scrollPos;
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationId);
    }, [showcase?.settings, isPaused]);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.skeletonGrid}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={styles.skeleton} />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !showcase || !showcase.logos?.length) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={styles.container}>
                    <div className={styles.errorState}>
                        <span>🏷️</span>
                        <p>Error: {error || 'No brand logos found'}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const { logos, settings } = showcase;
    const sortedLogos = [...logos].sort((a, b) => (a.order || 0) - (b.order || 0));

    const layout = settings?.layout || 'grid';
    const columns = settings?.columns || 6;
    const grayscale = settings?.grayscale ?? true;
    const hoverEffect = settings?.hoverEffect ?? true;

    const columnClass = styles[`columns${Math.min(Math.max(columns, 2), 8)}`];
    const grayscaleClass = grayscale ? styles.grayscale : '';
    const hoverClass = hoverEffect ? styles.hoverEffect : '';

    const renderLogo = (logo: BrandLogo, index: number) => {
        const logoContent = (
            <div className={`${styles.logoItem} ${grayscaleClass} ${hoverClass}`}>
                <Image
                    src={cleanImageUrl(logo.image)}
                    alt={logo.alt || `Brand ${index + 1}`}
                    fill
                    className={styles.logoImage}
                    unoptimized
                />
            </div>
        );

        if (logo.link) {
            return (
                <Link
                    key={index}
                    href={logo.link}
                    className={styles.logoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {logoContent}
                </Link>
            );
        }

        return <div key={index} className={styles.logoWrapper}>{logoContent}</div>;
    };

    // Carousel Layout
    if (layout === 'carousel') {
        // Double the logos for infinite scroll effect
        const carouselLogos = [...sortedLogos, ...sortedLogos];

        return (
            <div className={styles.container}>
                <div
                    className={styles.carouselWrapper}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div className={styles.carouselFade + ' ' + styles.fadeLeft} />
                    <div
                        className={styles.carouselTrack}
                        ref={scrollRef}
                    >
                        {carouselLogos.map((logo, index) => (
                            <div key={index} className={styles.carouselSlide}>
                                {renderLogo(logo, index)}
                            </div>
                        ))}
                    </div>
                    <div className={styles.carouselFade + ' ' + styles.fadeRight} />
                </div>
            </div>
        );
    }

    // Grid Layout
    return (
        <div className={styles.container}>
            <div className={`${styles.grid} ${columnClass}`}>
                {sortedLogos.map((logo, index) => renderLogo(logo, index))}
            </div>
        </div>
    );
}
