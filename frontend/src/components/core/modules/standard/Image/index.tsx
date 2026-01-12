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

    // Text Overlay
    overlayTitle?: string;
    overlaySubtitle?: string;
    titleColor?: string;
    subtitleColor?: string;
    textPosition?: 'top' | 'center' | 'bottom';

    // CTA Button
    ctaText?: string;
    ctaLink?: string;
    ctaNewTab?: boolean;
    ctaStyle?: 'solid' | 'outline' | 'text';

    // Overlay Settings
    overlayEnabled?: boolean;
    overlayColor?: string;
    overlayOpacity?: number; // 0-100
    hoverEffect?: boolean;
    hoverOpacity?: number; // 0-100
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
        overlayTitle,
        overlaySubtitle,
        titleColor = '#ffffff',
        subtitleColor = '#ffffff',
        textPosition = 'center',
        ctaText,
        ctaLink,
        ctaNewTab = false,
        ctaStyle = 'solid',
        overlayEnabled = false,
        overlayColor = '#000000',
        overlayOpacity = 50,
        hoverEffect = false,
        hoverOpacity = 70,
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

    // Check if we have any overlay content
    const hasOverlayContent = overlayTitle || overlaySubtitle || ctaText;
    const showOverlay = overlayEnabled && hasOverlayContent;

    const imageElement = (
        <div
            className={`${styles.imageWrapper} ${shadowClass} ${fullHeight ? styles.fullHeight : ''} ${showOverlay ? styles.hasOverlay : ''}`}
            style={{
                width: fullHeight ? '100%' : width === 'custom' && customWidth ? `${customWidth}px` : width === 'full' ? '100%' : undefined,
                height: fullHeight ? '100%' : undefined,
                borderRadius: `${borderRadius}px`,
                position: 'relative',
                ...(hoverEffect && showOverlay ? {
                    '--base-opacity': (overlayOpacity / 100).toString(),
                    '--hover-opacity': (hoverOpacity / 100).toString(),
                } as React.CSSProperties : {})
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

            {showOverlay && (
                <div
                    className={`${styles.overlay} ${hoverEffect ? styles.overlayHover : ""} ${textPosition && styles[`position${textPosition.charAt(0).toUpperCase() + textPosition.slice(1)}`] || ""}`}
                    style={{
                        backgroundColor: overlayColor,
                        '--base-opacity': (overlayOpacity / 100).toString(),
                        '--hover-opacity': (hoverOpacity / 100).toString(),
                        borderRadius: `${borderRadius}px`,
                    } as React.CSSProperties}
                >
                    <div className={styles.overlayContent}>
                        {overlayTitle && (
                            <h3 className={styles.overlayTitle} style={{ color: titleColor }}>
                                {overlayTitle}
                            </h3>
                        )}
                        {overlaySubtitle && (
                            <p className={styles.overlaySubtitle} style={{ color: subtitleColor }}>
                                {overlaySubtitle}
                            </p>
                        )}
                        {ctaText && (
                            <a
                                href={ctaLink || '#!'}
                                target={ctaNewTab ? '_blank' : undefined}
                                rel={ctaNewTab ? 'noopener noreferrer' : undefined}
                                className={`${styles.ctaButton} ${styles[`cta${ctaStyle.charAt(0).toUpperCase() + ctaStyle.slice(1)}`]}`}
                                onClick={(e) => {
                                    if (!ctaLink || ctaLink === '#' || ctaLink === '#!') {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                {ctaText}
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // If there's a main link and no CTA (to avoid nested links), wrap the whole image
    const content = link && !ctaText ? (
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
