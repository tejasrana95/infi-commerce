'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { ModuleProps } from '../..';
import api from '@/lib/api';
import styles from './Testimonials.module.scss';

interface TestimonialsConfig {
    testimonialIds: string[];
    layout?: 'grid' | 'carousel' | 'featured';
    autoplay?: boolean;
    autoplayInterval?: number;
    showQuoteIcon?: boolean;
    theme?: 'light' | 'dark' | 'gradient';
}

interface TestimonialData {
    _id: string;
    customerName: string;
    customerTitle?: string;
    customerImage?: string;
    content: string;
    rating?: number;
    company?: string;
}

// Helper to clean image URLs
const cleanImageUrl = (url: string): string => {
    if (!url) return '';
    return url.replace(/([^:]\/)\/+/g, '$1');
};

export default function TestimonialsModule({ config }: ModuleProps) {
    const {
        testimonialIds,
        layout = 'carousel',
        autoplay = true,
        autoplayInterval = 5000,
        showQuoteIcon = true,
        theme = 'gradient',
    } = config as TestimonialsConfig;

    const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                setLoading(true);
                const ids = testimonialIds.join(',');
                const data = await api.get<TestimonialData[] | { testimonials: TestimonialData[] }>(`testimonials?ids=${ids}`);
                setTestimonials(Array.isArray(data) ? data : data.testimonials || []);
            } catch (err) {
                console.error('Error fetching testimonials:', err);
                setError(err instanceof Error ? err.message : 'Failed to load testimonials');
            } finally {
                setLoading(false);
            }
        };

        if (testimonialIds && testimonialIds.length > 0) {
            fetchTestimonials();
        } else {
            setLoading(false);
        }
    }, [testimonialIds]);

    const goToSlide = useCallback((index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 600);
    }, [isTransitioning]);

    const nextSlide = useCallback(() => {
        goToSlide((currentIndex + 1) % testimonials.length);
    }, [currentIndex, testimonials.length, goToSlide]);

    const prevSlide = useCallback(() => {
        goToSlide((currentIndex - 1 + testimonials.length) % testimonials.length);
    }, [currentIndex, testimonials.length, goToSlide]);

    // Auto-play for carousel layout
    useEffect(() => {
        if ((layout === 'carousel' || layout === 'featured') && autoplay && testimonials.length > 1 && !isPaused) {
            const timer = setInterval(() => {
                nextSlide();
            }, autoplayInterval);

            return () => clearInterval(timer);
        }
    }, [layout, autoplay, autoplayInterval, testimonials.length, isPaused, nextSlide]);

    // Render star rating
    const renderStars = (rating?: number) => {
        if (!rating) return null;

        return (
            <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`${styles.star} ${star <= rating ? styles.starFilled : styles.starEmpty}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    // Loading state
    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.skeletonWrapper}>
                    <div className={styles.skeleton} />
                </div>
            </div>
        );
    }

    // Error state
    if (error || testimonials.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={styles.container}>
                    <div className={styles.errorState}>
                        <span>💬</span>
                        <p>Error: {error || 'No testimonials found'}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const themeClass = styles[`theme${theme.charAt(0).toUpperCase() + theme.slice(1)}`];

    // Grid Layout
    if (layout === 'grid') {
        return (
            <div className={`${styles.container} ${themeClass}`}>
                <div className={styles.grid}>
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={testimonial._id}
                            className={styles.gridCard}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {showQuoteIcon && (
                                <div className={styles.quoteIcon}>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                    </svg>
                                </div>
                            )}

                            {renderStars(testimonial.rating)}

                            <p className={styles.content}>{testimonial.content}</p>

                            <div className={styles.author}>
                                <div className={styles.avatar}>
                                    {testimonial.customerImage ? (
                                        <Image
                                            src={cleanImageUrl(testimonial.customerImage)}
                                            alt={testimonial.customerName}
                                            fill
                                            className={styles.avatarImage}
                                            unoptimized
                                        />
                                    ) : (
                                        <span className={styles.avatarInitial}>
                                            {testimonial.customerName.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.authorInfo}>
                                    <p className={styles.authorName}>{testimonial.customerName}</p>
                                    {(testimonial.customerTitle || testimonial.company) && (
                                        <p className={styles.authorTitle}>
                                            {testimonial.customerTitle}
                                            {testimonial.customerTitle && testimonial.company && ' at '}
                                            {testimonial.company}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Featured / Carousel Layout
    return (
        <div
            className={`${styles.container} ${themeClass}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className={styles.carouselWrapper}>
                {/* Background decoration */}
                <div className={styles.bgDecoration}>
                    <div className={styles.blob1} />
                    <div className={styles.blob2} />
                </div>

                {/* Large quote icon */}
                {showQuoteIcon && (
                    <div className={styles.largeQuote}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                    </div>
                )}

                {/* Carousel track */}
                <div className={styles.carouselViewport}>
                    <div
                        className={styles.carouselTrack}
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={testimonial._id}
                                className={styles.carouselSlide}
                            >
                                <div className={styles.featuredCard}>
                                    {renderStars(testimonial.rating)}

                                    <blockquote className={styles.quote}>
                                        {testimonial.content}
                                    </blockquote>

                                    <div className={styles.authorFeatured}>
                                        <div className={styles.avatarLarge}>
                                            {testimonial.customerImage ? (
                                                <Image
                                                    src={cleanImageUrl(testimonial.customerImage)}
                                                    alt={testimonial.customerName}
                                                    fill
                                                    className={styles.avatarImage}
                                                    unoptimized
                                                />
                                            ) : (
                                                <span className={styles.avatarInitialLarge}>
                                                    {testimonial.customerName.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.authorInfoFeatured}>
                                            <p className={styles.authorNameFeatured}>{testimonial.customerName}</p>
                                            {(testimonial.customerTitle || testimonial.company) && (
                                                <p className={styles.authorTitleFeatured}>
                                                    {testimonial.customerTitle}
                                                    {testimonial.customerTitle && testimonial.company && ' · '}
                                                    {testimonial.company}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation arrows */}
                {testimonials.length > 1 && (
                    <>
                        <button
                            className={`${styles.navButton} ${styles.navPrev}`}
                            onClick={prevSlide}
                            aria-label="Previous testimonial"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            className={`${styles.navButton} ${styles.navNext}`}
                            onClick={nextSlide}
                            aria-label="Next testimonial"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Dots navigation */}
                {testimonials.length > 1 && (
                    <div className={styles.dots}>
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
                                onClick={() => goToSlide(index)}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Progress bar */}
                {autoplay && testimonials.length > 1 && (
                    <div className={styles.progressWrapper}>
                        <div
                            className={styles.progress}
                            style={{
                                animationDuration: `${autoplayInterval}ms`,
                                animationPlayState: isPaused ? 'paused' : 'running'
                            }}
                            key={currentIndex}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
