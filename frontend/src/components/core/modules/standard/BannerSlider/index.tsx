'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModuleProps } from '../..';
import api from '@/lib/api';
import styles from './BannerSlider.module.scss';

interface BannerSliderConfig {
    sliderId: string;
}

interface BannerSlide {
    bannerId?: string;
    image?: string;
    mobileImage?: string;
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    alignment?: 'left' | 'center' | 'right';
    textColor?: string;
    order: number;
}

interface BannerSliderData {
    _id: string;
    name: string;
    slides: BannerSlide[];
    settings: {
        autoplay: boolean;
        interval: number;
        showArrows: boolean;
        showDots: boolean;
        pauseOnHover: boolean;
        effect: 'slide' | 'fade';
    };
}

// Helper to clean image URLs
const cleanImageUrl = (url: string): string => {
    if (!url) return '';
    return url.replace(/([^:]\/)\/+/g, '$1');
};

export default function BannerSliderModule({ config }: ModuleProps) {
    const { sliderId } = config as BannerSliderConfig;
    const [slider, setSlider] = useState<BannerSliderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);

    useEffect(() => {
        const fetchSlider = async () => {
            if (!sliderId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await api.get<{ slider: BannerSliderData }>(`banner-sliders/${sliderId}`);
                setSlider(data.slider);
            } catch (err) {
                console.error('Error fetching banner slider:', err);
                setError(err instanceof Error ? err.message : 'Failed to load banner slider');
            } finally {
                setLoading(false);
            }
        };

        fetchSlider();
    }, [sliderId]);

    const goToSlide = useCallback((index: number) => {
        if (isTransitioning || !slider) return;
        setIsTransitioning(true);
        setCurrentSlide(index);
        setTimeout(() => setIsTransitioning(false), 600);
    }, [isTransitioning, slider]);

    const nextSlide = useCallback(() => {
        if (slider) {
            goToSlide((currentSlide + 1) % slider.slides.length);
        }
    }, [slider, currentSlide, goToSlide]);

    const prevSlide = useCallback(() => {
        if (slider) {
            goToSlide((currentSlide - 1 + slider.slides.length) % slider.slides.length);
        }
    }, [slider, currentSlide, goToSlide]);

    // Auto-play functionality
    useEffect(() => {
        if (!slider || !slider.settings.autoplay || isPaused || slider.slides.length <= 1) {
            return;
        }

        const timer = setInterval(() => {
            nextSlide();
        }, slider.settings.interval || 5000);

        return () => clearInterval(timer);
    }, [slider, isPaused, nextSlide]);

    // Touch handlers for mobile swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        const diff = touchStartX.current - touchEndX.current;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.skeleton} />
            </div>
        );
    }

    // Error state
    if (error || !slider || slider.slides.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={styles.container}>
                    <div className={styles.errorState}>
                        <span className={styles.errorIcon}>⚠️</span>
                        <p>Banner slider error: {error || 'No slides found'}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const { settings, slides } = slider;

    return (
        <div className={styles.container}>
            <div
                className={styles.slider}
                onMouseEnter={() => settings.pauseOnHover && setIsPaused(true)}
                onMouseLeave={() => settings.pauseOnHover && setIsPaused(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Slides Track */}
                <div className={styles.track}>
                    {slides.map((slide, index) => {
                        const desktopImage = slide.image ? cleanImageUrl(slide.image) : '';
                        const mobileImage = slide.mobileImage ? cleanImageUrl(slide.mobileImage) : desktopImage;
                        const isActive = index === currentSlide;
                        const alignmentClass = styles[`align${(slide.alignment || 'center').charAt(0).toUpperCase() + (slide.alignment || 'center').slice(1)}`];

                        return (
                            <div
                                key={index}
                                className={`${styles.slide} ${isActive ? styles.active : ''} ${settings.effect === 'slide' ? styles.slideEffect : styles.fadeEffect}`}
                                style={settings.effect === 'slide' ? {
                                    transform: `translateX(${(index - currentSlide) * 100}%)`
                                } : undefined}
                            >
                                {/* Desktop Image */}
                                {desktopImage && (
                                    <div className={styles.imageDesktop}>
                                        <Image
                                            src={desktopImage}
                                            alt={slide.title || `Slide ${index + 1}`}
                                            fill
                                            className={styles.image}
                                            priority={index === 0}
                                            unoptimized
                                        />
                                    </div>
                                )}

                                {/* Mobile Image */}
                                {mobileImage && (
                                    <div className={styles.imageMobile}>
                                        <Image
                                            src={mobileImage}
                                            alt={slide.title || `Slide ${index + 1}`}
                                            fill
                                            className={styles.image}
                                            priority={index === 0}
                                            unoptimized
                                        />
                                    </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className={`${styles.overlay} ${alignmentClass}`} />

                                {/* Content */}
                                {(slide.title || slide.subtitle || slide.ctaText) && (
                                    <div className={`${styles.content} ${alignmentClass}`}>
                                        <div className={styles.contentInner}>
                                            {slide.title && (
                                                <h2
                                                    className={styles.title}
                                                    style={{ color: slide.textColor || '#ffffff' }}
                                                >
                                                    {slide.title}
                                                </h2>
                                            )}

                                            {slide.subtitle && (
                                                <p
                                                    className={styles.subtitle}
                                                    style={{ color: slide.textColor || '#ffffff' }}
                                                >
                                                    {slide.subtitle}
                                                </p>
                                            )}

                                            {slide.ctaText && slide.ctaLink && (
                                                <Link href={slide.ctaLink} className={styles.ctaButton}>
                                                    {slide.ctaText}
                                                    <svg className={styles.ctaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Arrows */}
                {settings.showArrows && slides.length > 1 && (
                    <>
                        <button
                            onClick={prevSlide}
                            className={`${styles.navButton} ${styles.navPrev}`}
                            aria-label="Previous slide"
                            disabled={isTransitioning}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={nextSlide}
                            className={`${styles.navButton} ${styles.navNext}`}
                            aria-label="Next slide"
                            disabled={isTransitioning}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Dots Navigation */}
                {settings.showDots && slides.length > 1 && (
                    <div className={styles.dots}>
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`${styles.dot} ${index === currentSlide ? styles.dotActive : ''}`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Progress Bar */}
                {settings.autoplay && slides.length > 1 && (
                    <div className={styles.progressWrapper}>
                        <div
                            className={styles.progress}
                            style={{
                                animationDuration: `${settings.interval || 5000}ms`,
                                animationPlayState: isPaused ? 'paused' : 'running'
                            }}
                            key={currentSlide}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
