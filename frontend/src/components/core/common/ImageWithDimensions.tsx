'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import styles from './ImageWithDimensions.module.scss';

interface ImageWithDimensionsProps extends Omit<ImageProps, 'onError' | 'className' | 'src'> {
    src?: string | any;
    className?: string;
    aspectRatio?: '1x1' | '3x4' | '4x3' | '16x9' | 'auto';
    fallback?: React.ReactNode;
    fetchPriority?: 'high' | 'low' | 'auto';
    fullHeight?: boolean;
}

const cleanImageUrl = (url: string | any): string => {
    if (!url || typeof url !== 'string') return '';
    // Remove triple/quadruple slashes but keep protocol
    return url.replace(/([^:]\/)\/+/g, '$1');
};

/**
 * ImageWithDimensions - A wrapper around next/image that handles:
 * 1. URL cleaning
 * 2. Aspect ratio to prevent CLS
 * 3. Fallback to placeholder/error state
 * 4. Automatic optimization (removing explicit unoptimized prop)
 */
export default function ImageWithDimensions({
    src,
    alt,
    className = '',
    aspectRatio = 'auto',
    fallback,
    fill: explicitFill,
    priority,
    fullHeight,
    sizes,
    width,
    height,
    fetchPriority,
    ...props
}: ImageWithDimensionsProps) {
    const [error, setError] = useState(false);
    const cleanedSrc = cleanImageUrl(src);

    // Determine if we should use fill
    // If explicitFill is provided, use it.
    // Otherwise, if width/height are provided, don't use fill.
    // Otherwise, if aspectRatio is set, use fill.
    const shouldFill = explicitFill !== undefined
        ? explicitFill
        : (width || height)
            ? false
            : aspectRatio !== 'auto';
    const containerClasses = [
        styles.imageContainer,
        styles[`aspect${aspectRatio}`],
        (shouldFill) ? styles.fill : '',
        fullHeight ? styles.fill : '',
        className
    ].filter(Boolean).join(' ');

    if (!cleanedSrc || error) {
        return (
            <div className={containerClasses}>
                <div className={styles.placeholder}>
                    {fallback || (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`${containerClasses}`}>
            <Image
                src={cleanedSrc}
                alt={alt || ''}
                fill={shouldFill}
                width={!shouldFill ? width : undefined}
                height={!shouldFill ? height : undefined}
                priority={priority}
                sizes={sizes || (shouldFill ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : undefined)}
                className={`${styles.image} ${!shouldFill && aspectRatio === 'auto' ? styles.responsive : ''}`}
                onError={() => setError(true)}
                // @ts-ignore - fetchPriority is supported in recent Next.js/React versions
                fetchPriority={fetchPriority}
                {...props}
            />
        </div>
    );
}
