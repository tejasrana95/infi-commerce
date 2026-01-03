'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
import styles from './index.module.scss';

interface PageHeroProps {
    config: {
        showTitle?: boolean;
        showBreadcrumbs?: boolean;
        height?: 'auto' | 'small' | 'medium' | 'large';
        alignment?: 'left' | 'center' | 'right';
        containerWidth?: 'narrow' | 'medium' | 'full';
        customTitle?: string;
        customFeaturedImage?: string;
        pageData?: {
            title: string;
            slug: string;
            featuredImage?: string;
        };
    };
}

export default function PageHero({ config }: PageHeroProps) {
    const {
        showTitle = true,
        showBreadcrumbs = true,
        height = 'medium',
        alignment = 'left',
        containerWidth = 'medium',
        customTitle,
        customFeaturedImage,
        pageData
    } = config;

    const title = customTitle || pageData?.title || 'Page';
    const featuredImage = customFeaturedImage || pageData?.featuredImage;
    const hasImage = !!featuredImage;

    const containerClass = `${styles.documentContainer} ${styles[containerWidth] || styles.medium}`;
    const heroClass = `${styles.hero} ${hasImage ? styles.withImage : styles.noImage} ${styles[height]} ${styles[alignment]}`;

    return (
        <section className={heroClass}>
            {hasImage && (
                <ImageWithDimensions
                    src={featuredImage}
                    alt={title}
                    fill
                    priority
                    className={styles.backgroundImage}
                    sizes="100vw"
                />
            )}
            {hasImage && <div className={styles.overlay} />}
            <div className={styles.heroContent}>
                <div className={containerClass}>
                    {showBreadcrumbs && (
                        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
                            <Link href="/" className={styles.breadcrumbLink}>
                                <Home size={14} />
                                <span>Home</span>
                            </Link>
                            <ChevronRight size={14} className={styles.separatorIcon} />
                            <span className={styles.breadcrumbCurrent}>{title}</span>
                        </nav>
                    )}

                    {showTitle && (
                        <header className={styles.header}>
                            <h1 className={styles.title}>{title}</h1>
                        </header>
                    )}
                </div>
            </div>
        </section>
    );
}
