
// Modern Clean CategoryCard Template - Pure presentation
// Premium design with multiple style variants

'use client';

import React from 'react';
import Link from 'next/link';
import { CategoryTemplateProps } from '@/components/templates/core/CategoryCard/types';
import styles from './CategoryCard.module.scss';

export default function ModernCleanCategoryCardTemplate({
    title,
    description,
    imageUrl,
    imageAlt,
    categoryUrl,
    productCount,
    style = 'card',
    showDescription = true,
}: CategoryTemplateProps) {
    const styleClass = {
        card: styles.styleCard,
        banner: styles.styleBanner,
        minimal: styles.styleMinimal,
        overlay: styles.styleOverlay,
    }[style] || styles.styleCard;

    return (
        <Link href={categoryUrl} className={`${styles.card} ${styleClass}`}>
            {/* Image Container */}
            <div className={styles.imageContainer}>
                <div className={styles.imageInner}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={imageAlt}
                            className={styles.image}
                        />
                    ) : (
                        <div className={styles.placeholder}>
                            {title}
                        </div>
                    )}
                </div>

                {/* Overlay for hover effect */}
                <div className={styles.overlay} />

                {/* Gradient overlay for banner style */}
                {style === 'banner' && <div className={styles.overlayGradient} />}
            </div>

            {/* Content */}
            <div className={styles.content}>
                <h3 className={styles.name}>{title}</h3>

                {showDescription && description && style === 'card' && (
                    <div
                        className={styles.description}
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                )}

                {productCount !== undefined && (
                    <p className={styles.productCount}>
                        {productCount} {productCount === 1 ? 'Product' : 'Products'}
                    </p>
                )}

                {style === 'card' && (
                    <div className={styles.cta}>
                        Shop Now
                        <span className={styles.arrow}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
}
