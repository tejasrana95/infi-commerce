'use client';

import React, { useState, useRef, useEffect } from 'react';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
import Link from 'next/link';
import { ModuleProps } from '../..';
import styles from './ImageGallery.module.scss';

interface GalleryImage {
    src: string;
    alt?: string;
    link?: string;
    caption?: string;
}

interface ImageGalleryConfig {
    images: GalleryImage[];
    layout?: 'grid' | 'masonry' | 'carousel';
    columns?: 2 | 3 | 4 | 5 | 6;
    gap?: number;
    aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto' | '4:3' | '16:9' | '3:2' | '21:9';
    lightbox?: boolean;
    showCaptions?: boolean;
    borderRadius?: number;
    // Carousel specific
    autoplay?: boolean;
    autoplayInterval?: number;
}

// Map aspect ratio config values to CSS class names
const aspectRatioClassMap: Record<string, string> = {
    'square': 'aspectSquare',
    'landscape': 'aspectLandscape',
    'portrait': 'aspectPortrait',
    'auto': 'aspectAuto',
    '4:3': 'aspect4x3',
    '16:9': 'aspect16x9',
    '3:2': 'aspect3x2',
    '21:9': 'aspect21x9',
};


export default function ImageGalleryModule({ config }: ModuleProps) {
    const {
        images = [],
        layout = 'grid',
        columns = 3,
        gap = 16,
        aspectRatio = 'square',
        lightbox = false,
        showCaptions = false,
        borderRadius = 8,
        autoplay = false,
        autoplayInterval = 4000,
    } = config as ImageGalleryConfig;

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Carousel autoplay
    useEffect(() => {
        if (layout !== 'carousel' || !autoplay || images.length <= 1) return;

        const timer = setInterval(() => {
            setCarouselIndex((prev) => (prev + 1) % images.length);
        }, autoplayInterval);

        return () => clearInterval(timer);
    }, [layout, autoplay, autoplayInterval, images.length]);

    if (!images || images.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={styles.container}>
                    <div className={styles.emptyState}>
                        <span>🖼️</span>
                        <p>No images in gallery</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const openLightbox = (index: number) => {
        if (lightbox) {
            setActiveIndex(index);
            setLightboxOpen(true);
            document.body.style.overflow = 'hidden';
        }
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        const activeOverlays = document.querySelectorAll('[role="dialog"], [class*="overlay"], [class*="modal"], [class*="drawer"]');
        if (activeOverlays.length <= 1) {
            document.body.style.overflow = '';
        }
    };

    const nextImage = () => {
        setActiveIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    };

    const scrollCarousel = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setCarouselIndex((prev) => (prev - 1 + images.length) % images.length);
        } else {
            setCarouselIndex((prev) => (prev + 1) % images.length);
        }
    };

    const aspectClass = styles[aspectRatioClassMap[aspectRatio] || 'aspectSquare'];
    const columnClass = styles[`columns${columns}`];

    // Render image item
    const renderImageItem = (image: GalleryImage, index: number, isCarousel = false) => {
        const caption = image.caption || image.alt;

        const imageContent = (
            <div
                className={`${styles.imageItem} ${aspectClass}`}
                style={{ borderRadius: `${borderRadius}px` }}
                onClick={() => !image.link && openLightbox(index)}
            >
                <ImageWithDimensions
                    src={image.src}
                    alt={image.alt || `Gallery image ${index + 1}`}
                    fill
                    className={styles.image}
                    aspectRatio={aspectRatio === 'square' ? '1x1' : (aspectRatio === 'auto' ? 'auto' : '16x9')}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {lightbox && !image.link && (
                    <div className={styles.overlay}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                    </div>
                )}
                {showCaptions && caption && (
                    <div className={styles.caption}>
                        {caption}
                    </div>
                )}
            </div>
        );

        if (image.link) {
            return (
                <Link key={index} href={image.link} className={styles.link}>
                    {imageContent}
                </Link>
            );
        }

        return (
            <div key={index} className={lightbox ? styles.clickable : ''}>
                {imageContent}
            </div>
        );
    };

    // Lightbox render function - defined before usage
    const renderLightbox = () => (
        lightbox && lightboxOpen && (
            <div
                className={styles.lightbox}
                onClick={closeLightbox}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="dialog"
                aria-modal="true"
            >
                <button
                    className={styles.closeBtn}
                    onClick={closeLightbox}
                    aria-label="Close lightbox"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <button
                    className={`${styles.navBtn} ${styles.prevBtn}`}
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    aria-label="Previous image"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                    <ImageWithDimensions
                        src={images[activeIndex].src}
                        alt={images[activeIndex].alt || `Gallery image ${activeIndex + 1}`}
                        fill
                        className={styles.lightboxImage}
                        aspectRatio="auto"
                        priority
                    />
                    {showCaptions && (images[activeIndex].caption || images[activeIndex].alt) && (
                        <div className={styles.lightboxCaption}>
                            {images[activeIndex].caption || images[activeIndex].alt}
                        </div>
                    )}
                </div>

                <button
                    className={`${styles.navBtn} ${styles.nextBtn}`}
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    aria-label="Next image"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                <div className={styles.counter}>
                    {activeIndex + 1} / {images.length}
                </div>
            </div>
        )
    );

    // Carousel Layout
    if (layout === 'carousel') {
        return (
            <div className={styles.container}>
                <div className={styles.carouselWrapper}>
                    <div
                        className={styles.carousel}
                        ref={carouselRef}
                    >
                        <div
                            className={styles.carouselTrack}
                            style={{
                                transform: `translateX(-${carouselIndex * 100}%)`
                            }}
                        >
                            {images.map((image, index) => (
                                <div key={index} className={styles.carouselSlide}>
                                    {renderImageItem(image, index, true)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {images.length > 1 && (
                        <>
                            <button
                                className={`${styles.carouselBtn} ${styles.carouselPrev}`}
                                onClick={() => scrollCarousel('prev')}
                                aria-label="Previous"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                className={`${styles.carouselBtn} ${styles.carouselNext}`}
                                onClick={() => scrollCarousel('next')}
                                aria-label="Next"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <div className={styles.carouselDots}>
                                {images.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`${styles.carouselDot} ${index === carouselIndex ? styles.active : ''}`}
                                        onClick={() => setCarouselIndex(index)}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Lightbox */}
                {renderLightbox()}
            </div>
        );
    }

    // Grid/Masonry Layout
    const layoutClass = layout === 'masonry' ? styles.masonry : styles.grid;

    return (
        <div className={styles.container}>
            <div
                className={`${styles.gallery} ${layoutClass} ${columnClass}`}
                style={{ gap: `${gap}px` }}
            >
                {images.map((image, index) => renderImageItem(image, index))}
            </div>

            {renderLightbox()}
        </div>
    );
}
