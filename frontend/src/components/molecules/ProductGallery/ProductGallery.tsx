'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import styles from './ProductGallery.module.scss';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';

interface ProductGalleryProps {
    images: string[];
    productName: string;
    hasDiscount?: boolean;
    discountPercent?: number;
    config?: {
        layout?: 'thumbnails-left' | 'thumbnails-bottom' | 'carousel' | 'grid';
        enableZoom?: boolean;
        zoomType?: 'hover' | 'magnify' | 'lightbox-only';
        enableLightbox?: boolean;
    };
}

export default function ProductGallery({
    images,
    productName,
    hasDiscount = false,
    discountPercent = 0,
    config = {},
}: ProductGalleryProps) {
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
    const [isZooming, setIsZooming] = useState(false);
    const [mainImageLoading, setMainImageLoading] = useState(false);

    const {
        layout = 'thumbnails-left',
        enableZoom = true,
        zoomType = 'hover',
        enableLightbox = true,
    } = config;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!enableZoom || zoomType === 'lightbox-only') return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPosition({ x, y });
    };

    const handleMouseEnter = () => {
        if (enableZoom && zoomType !== 'lightbox-only') {
            setIsZooming(true);
        }
    };

    const handleMouseLeave = () => {
        setIsZooming(false);
    };

    const handleImageClick = (index?: number) => {
        if (index !== undefined) {
            setMainImageLoading(true);
            setMainImageIndex(index);
        }
        if (enableLightbox) {
            setIsLightboxOpen(true);
        }
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
    };

    const navigateLightbox = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setMainImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        } else {
            setMainImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        }
    };

    const navigateCarousel = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setMainImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        } else {
            setMainImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        }
    };

    // Grid Layout
    if (layout === 'grid') {
        return (
            <>
                <div className={styles.gridGallery}>
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`${styles.gridItem} ${index === 0 ? styles.gridMain : ''}`}
                            onClick={() => handleImageClick(index)}
                        >
                            <ImageWithDimensions
                                src={image}
                                alt={`${productName} - ${index + 1}`}
                                fill
                                aspectRatio="1x1"
                                className={styles.productImage}
                                priority={index === 0}
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            {index === 0 && hasDiscount && discountPercent > 0 && (
                                <span className={styles.saleBadge}>-{discountPercent}%</span>
                            )}
                        </div>
                    ))}
                </div>
                {renderLightbox()}
            </>
        );
    }

    // Carousel Layout
    if (layout === 'carousel') {
        return (
            <>
                <div className={styles.carouselGallery}>
                    <button
                        className={`${styles.carouselNav} ${styles.prev}`}
                        onClick={() => navigateCarousel('prev')}
                        aria-label="Previous image"
                    >
                        ‹
                    </button>
                    <div
                        className={`${styles.carouselMain} ${isZooming && zoomType === 'hover' ? styles.zooming : ''}`}
                        onMouseMove={handleMouseMove}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleImageClick()}
                        style={{
                            cursor: enableLightbox ? 'zoom-in' : 'default',
                            '--zoom-x': `${zoomPosition.x}%`,
                            '--zoom-y': `${zoomPosition.y}%`,
                        } as React.CSSProperties}
                    >
                        {images[mainImageIndex] && (
                            <>
                                <ImageWithDimensions
                                    src={images[mainImageIndex]}
                                    alt={productName}
                                    fill
                                    aspectRatio="1x1"
                                    priority
                                    className={styles.productImage}
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    onLoadingComplete={() => setMainImageLoading(false)}
                                />
                                {mainImageLoading && (
                                    <div className={styles.overlay} aria-hidden>
                                        <div className={styles.loader} />
                                    </div>
                                )}
                            </>
                        )}
                        {hasDiscount && discountPercent > 0 && (
                            <span className={styles.saleBadge}>-{discountPercent}%</span>
                        )}
                    </div>
                    <button
                        className={`${styles.carouselNav} ${styles.next}`}
                        onClick={() => navigateCarousel('next')}
                        aria-label="Next image"
                    >
                        ›
                    </button>
                    <div className={styles.carouselDots}>
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    className={`${styles.dot} ${index === mainImageIndex ? styles.active : ''}`}
                                    onClick={() => { setMainImageLoading(true); setMainImageIndex(index); }}
                                    aria-label={`Go to image ${index + 1}`}
                                />
                            ))}
                    </div>
                    {hasDiscount && discountPercent > 0 && (
                        <span className={styles.saleBadge}>-{discountPercent}%</span>
                    )}
                </div>
                {/* Magnifier for carousel */}
                {isZooming && zoomType === 'magnify' && (
                    <div
                        className={styles.magnifier}
                        style={{
                            backgroundImage: `url(${images[mainImageIndex]})`,
                            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            backgroundSize: '550%',
                        }}
                    />
                )}
                {renderLightbox()}
            </>
        );
    }

    // Default: Thumbnails Layout (left or bottom)
    const layoutClass = layout === 'thumbnails-bottom' ? styles.thumbnailsBottom : styles.thumbnailsLeft;

    function renderLightbox() {
        if (!isLightboxOpen || !enableLightbox || typeof document === 'undefined') return null;

        return createPortal(
            <div className={styles.lightbox} onClick={closeLightbox}>
                <button className={styles.lightboxClose} onClick={closeLightbox}>
                    ×
                </button>
                <button
                    className={`${styles.lightboxNav} ${styles.prev}`}
                    onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                >
                    ‹
                </button>
                <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                    <ImageWithDimensions
                        src={images[mainImageIndex]}
                        alt={productName}
                        fill
                        aspectRatio="auto"
                        style={{ objectFit: 'contain' }}
                    />
                </div>
                <button
                    className={`${styles.lightboxNav} ${styles.next}`}
                    onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                >
                    ›
                </button>
                <div className={styles.lightboxThumbnails}>
                    {images.map((image, index) => (
                        <button
                            key={index}
                            className={`${styles.lightboxThumb} ${index === mainImageIndex ? styles.active : ''}`}
                            onClick={(e) => { e.stopPropagation(); setMainImageLoading(true); setMainImageIndex(index); }}
                        >
                            <ImageWithDimensions src={image} alt="" width={60} height={60} aspectRatio="1x1" />
                        </button>
                    ))}
                </div>
            </div>,
            document.body
        );
    }

    return (
        <>
            <div className={`${styles.gallery} ${layoutClass}`}>
                {/* Thumbnails */}
                <div className={styles.thumbnails}>
                    {images.map((image, index) => (
                        <button
                            key={index}
                            className={`${styles.thumbnail} ${index === mainImageIndex ? styles.active : ''}`}
                            onClick={() => { setMainImageLoading(true); setMainImageIndex(index); }}
                        >
                            <ImageWithDimensions
                                src={image}
                                alt={`${productName} - ${index + 1}`}
                                width={80}
                                height={80}
                                aspectRatio="1x1"
                            />
                        </button>
                    ))}
                </div>

                {/* Main Image */}
                <div
                    className={`${styles.mainImage} ${isZooming && zoomType === 'hover' ? styles.zooming : ''}`}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleImageClick()}
                    style={{
                        cursor: enableLightbox ? 'zoom-in' : enableZoom ? 'crosshair' : 'default',
                        '--zoom-x': `${zoomPosition.x}%`,
                        '--zoom-y': `${zoomPosition.y}%`,
                    } as React.CSSProperties}
                >
                    {images[mainImageIndex] && (
                        <>
                            <ImageWithDimensions
                                src={images[mainImageIndex]}
                                alt={productName}
                                fill
                                aspectRatio="1x1"
                                priority
                                className={styles.productImage}
                                sizes="(max-width: 768px) 100vw, 50vw"
                                onLoadingComplete={() => setMainImageLoading(false)}
                            />
                            {mainImageLoading && (
                                <div className={styles.overlay} aria-hidden>
                                    <div className={styles.loader} />
                                </div>
                            )}
                        </>
                    )}
                    {hasDiscount && discountPercent > 0 && (
                        <span className={styles.saleBadge}>-{discountPercent}%</span>
                    )}
                </div>

                {/* Magnifier Lens (for magnify zoom type) */}
                {isZooming && zoomType === 'magnify' && (
                    <div
                        className={styles.magnifier}
                        style={{
                            backgroundImage: `url(${images[mainImageIndex]})`,
                            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            backgroundSize: '250%',
                        }}
                    />
                )}
            </div>
            {renderLightbox()}
        </>
    );
}
