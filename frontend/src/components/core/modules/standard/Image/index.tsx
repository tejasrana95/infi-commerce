'use client';

import React from 'react';
import NextImage from 'next/image';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
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
    fullHeight?: boolean; // Take full section height
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    alignment?: 'left' | 'center' | 'right';
    borderRadius?: number;
    shadow?: 'none' | 'small' | 'medium' | 'large';
    openInNewTab?: boolean;
}


export default function ImageModule({ config }: ModuleProps) {
    const {
        src,
        alt = 'Image',
        link,
        width = 'full',
        customWidth,
        height,
        fullHeight = false,
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

    const alignClass = styles[`align${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`];
    const shadowClass = shadow !== 'none' ? styles[`shadow${shadow.charAt(0).toUpperCase() + shadow.slice(1)}`] : '';

    // Determine dimensions
    const imageWidth = width === 'custom' && customWidth ? customWidth : 800;
    const imageHeight = height || 400;

    const imageElement = (
        <div
            className={`${styles.imageWrapper} ${shadowClass} ${fullHeight ? styles.fullHeight : ''}`}
            style={{
                width: fullHeight ? '100%' : width === 'custom' && customWidth ? `${customWidth}px` : width === 'full' ? '100%' : undefined,
                height: fullHeight ? '100%' : undefined,
                borderRadius: `${borderRadius}px`,
            }}
        >
            <ImageWithDimensions
                src={src}
                alt={alt}
                width={imageWidth}
                height={imageHeight}
                className={styles.image}
                fullHeight={fullHeight}
                aspectRatio={fullHeight ? undefined : height ? 'auto' : '16x9'}
                style={{
                    width: fullHeight ? '100%' : width === 'full' ? '100%' : width === 'custom' && customWidth ? `${customWidth}px` : 'auto',
                    height: fullHeight ? '100%' : height ? `${height}px` : 'auto',
                    objectFit: fullHeight ? 'cover' : objectFit,
                    borderRadius: `${borderRadius}px`,
                }}
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
        <div
            className={`${styles.container} ${alignClass} ${fullHeight ? styles.fullHeight : ''}`}
        >
            {content}
        </div>
    );
}
