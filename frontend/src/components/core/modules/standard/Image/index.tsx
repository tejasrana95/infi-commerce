'use client';

import React from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { ModuleProps } from '../..';
import styles from './Image.module.scss';

interface ImageConfig {
    src: string;
    alt?: string;
    link?: string;
    width?: 'full' | 'container' | 'custom';
    customWidth?: number;
    height?: number;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    alignment?: 'left' | 'center' | 'right';
    borderRadius?: number;
    shadow?: 'none' | 'small' | 'medium' | 'large';
    openInNewTab?: boolean;
}

// Helper to clean image URLs
const cleanImageUrl = (url: string): string => {
    if (!url) return '';
    return url.replace(/([^:]\/)\/+/g, '$1');
};

export default function ImageModule({ config }: ModuleProps) {
    const {
        src,
        alt = 'Image',
        link,
        width = 'full',
        customWidth,
        height,
        objectFit = 'cover',
        alignment = 'center',
        borderRadius = 0,
        shadow = 'none',
        openInNewTab = false,
    } = config as ImageConfig;

    if (!src) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={styles.container}>
                    <div className={styles.placeholder}>
                        <span>🖼️</span>
                        <p>No image source provided</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const cleanedSrc = cleanImageUrl(src);
    const alignClass = styles[`align${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`];
    const shadowClass = shadow !== 'none' ? styles[`shadow${shadow.charAt(0).toUpperCase() + shadow.slice(1)}`] : '';

    // Determine dimensions
    const imageWidth = width === 'custom' && customWidth ? customWidth : 800;
    const imageHeight = height || 400;

    const imageElement = (
        <div
            className={`${styles.imageWrapper} ${shadowClass}`}
            style={{
                width: width === 'custom' && customWidth ? `${customWidth}px` : width === 'full' ? '100%' : undefined,
                borderRadius: `${borderRadius}px`,
            }}
        >
            <NextImage
                src={cleanedSrc}
                alt={alt}
                width={imageWidth}
                height={imageHeight}
                className={styles.image}
                style={{
                    width: width === 'full' ? '100%' : width === 'custom' && customWidth ? `${customWidth}px` : 'auto',
                    height: height ? `${height}px` : 'auto',
                    objectFit: objectFit,
                    borderRadius: `${borderRadius}px`,
                }}
                unoptimized
            />
        </div>
    );

    const content = link ? (
        <Link
            href={link}
            target={openInNewTab ? '_blank' : undefined}
            rel={openInNewTab ? 'noopener noreferrer' : undefined}
            className={styles.link}
        >
            {imageElement}
        </Link>
    ) : imageElement;

    return (
        <div className={`${styles.container} ${alignClass}`}>
            {content}
        </div>
    );
}
