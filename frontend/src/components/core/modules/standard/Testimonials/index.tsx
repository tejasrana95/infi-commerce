'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
import { ModuleProps } from '../..';
import api from '@/lib/api';
import styles from './Testimonials.module.scss';

interface TestimonialsConfig {
    testimonialIds: string[];
    layout?: 'grid' | 'carousel' | 'featured' | 'single' | 'multi-carousel';
    visibleCards?: number;
    borderColor?: string;
    backgroundColor?: string;
    themeColor?: string;
    customerNameColor?: string;
    customerTitleColor?: string;
    productPurchasedColor?: string;
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
    productPurchased?: string;
    content: string;
    rating?: number;
    company?: string;
}

interface TestimonialsProps extends ModuleProps {
    initialData?: TestimonialData[];
}


export default function TestimonialsModule({ config, initialData }: ModuleProps) {
    const {
        testimonialIds,
        layout = 'single',
        visibleCards = 3,
        borderColor,
        backgroundColor,
        themeColor,
        customerNameColor,
        customerTitleColor,
        productPurchasedColor,
        autoplay = true,
        autoplayInterval = 5000,
        showQuoteIcon = true,
        theme = 'gradient',
    } = config as TestimonialsConfig;

    // Use initialData if provided (SSR), otherwise start empty
    const [testimonials, setTestimonials] = useState<TestimonialData[]>(initialData || []);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [visibleCardsActive, setVisibleCardsActive] = useState(1);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Responsive visible cards count
    useEffect(() => {
        if (layout !== 'multi-carousel') {
            setVisibleCardsActive(1);
            return;
        }
        const handleResize = () => {
            const width = window.innerWidth;
            if (width >= 1024) {
                setVisibleCardsActive(visibleCards || 3);
            } else if (width >= 768) {
                setVisibleCardsActive(Math.min(visibleCards || 3, 2));
            } else {
                setVisibleCardsActive(1);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [visibleCards, layout]);

    // Only fetch client-side if no initialData provided
    useEffect(() => {
        if (initialData) return; // Skip fetch if SSR data exists

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
    }, [testimonialIds, initialData]);

    // Clamp currentIndex if window resizes and changes visibleCardsActive
    useEffect(() => {
        const maxIndex = Math.max(0, testimonials.length - (layout === 'multi-carousel' ? visibleCardsActive : 1));
        if (currentIndex > maxIndex) {
            setCurrentIndex(maxIndex);
        }
    }, [visibleCardsActive, testimonials.length, layout, currentIndex]);

    const goToSlide = useCallback((index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 600);
    }, [isTransitioning]);

    const nextSlide = useCallback(() => {
        const isMulti = layout === 'multi-carousel';
        const step = isMulti ? visibleCardsActive : 1;
        const maxIndex = Math.max(0, testimonials.length - step);

        if (maxIndex === 0) return;

        if (isMulti) {
            goToSlide(currentIndex >= maxIndex ? 0 : currentIndex + 1);
        } else {
            goToSlide((currentIndex + 1) % testimonials.length);
        }
    }, [currentIndex, testimonials.length, visibleCardsActive, layout, goToSlide]);

    const prevSlide = useCallback(() => {
        const isMulti = layout === 'multi-carousel';
        const step = isMulti ? visibleCardsActive : 1;
        const maxIndex = Math.max(0, testimonials.length - step);

        if (maxIndex === 0) return;

        if (isMulti) {
            goToSlide(currentIndex <= 0 ? maxIndex : currentIndex - 1);
        } else {
            goToSlide((currentIndex - 1 + testimonials.length) % testimonials.length);
        }
    }, [currentIndex, testimonials.length, visibleCardsActive, layout, goToSlide]);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const diff = touchStart - touchEnd;
        const minSwipeDistance = 50;

        if (diff > minSwipeDistance) {
            nextSlide();
        } else if (diff < -minSwipeDistance) {
            prevSlide();
        }

        setTouchStart(null);
        setTouchEnd(null);
    };

    // Auto-play
    useEffect(() => {
        const canAutoplay = layout === 'carousel' || layout === 'featured' || layout === 'single' || layout === 'multi-carousel';
        if (canAutoplay && autoplay && testimonials.length > (layout === 'multi-carousel' ? visibleCardsActive : 1) && !isPaused) {
            const timer = setInterval(() => {
                nextSlide();
            }, autoplayInterval);

            return () => clearInterval(timer);
        }
    }, [layout, autoplay, autoplayInterval, testimonials.length, isPaused, nextSlide, visibleCardsActive]);

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
    const isCustomStyled = !!(borderColor || backgroundColor || themeColor || customerNameColor || customerTitleColor || productPurchasedColor);
    const containerClass = `${styles.container} ${themeClass} ${layout === 'multi-carousel' ? styles.multiCarouselContainer : ''} ${isCustomStyled ? styles.customStyled : ''}`;

    const customStyles = {
        '--card-bg-color': backgroundColor,
        '--card-border-color': borderColor,
        '--theme-color': themeColor,
        '--customer-name-color': customerNameColor,
        '--customer-title-color': customerTitleColor,
        '--product-purchased-color': productPurchasedColor,
        '--visible-cards': visibleCardsActive,
        '--current-index': currentIndex,
    } as React.CSSProperties;
    // Multi Card Carousel Layout
    if (layout === 'multi-carousel') {
        return (
            <div
                className={containerClass}
                style={customStyles}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className={styles.multiCarouselWrapper}>
                    <div
                        className={styles.multiCarouselViewport}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div
                            className={styles.multiCarouselTrack}
                            style={{
                                transform: `translateX(calc(-1 * ${currentIndex} * (100% + 1.5rem) / ${visibleCardsActive}))`,
                            }}
                        >
                            {testimonials.map((testimonial) => (
                                <div
                                    key={testimonial._id}
                                    className={styles.multiCarouselSlide}
                                >
                                    <div className={styles.multiCard}>
                                        <div>
                                            <div className={styles.cardHeader}>
                                                {renderStars(testimonial.rating)}
                                                {showQuoteIcon && (
                                                    <div className={styles.cardQuote}>
                                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            <p className={styles.cardContent}>"{testimonial.content}"</p>
                                        </div>

                                        <div>
                                            <div className={styles.cardDivider} />

                                            <div className={styles.cardFooter}>
                                                <div className={styles.cardAvatar}>
                                                    {testimonial.customerImage ? (
                                                        <ImageWithDimensions
                                                            src={testimonial.customerImage}
                                                            alt={testimonial.customerName}
                                                            fill
                                                            aspectRatio="1x1"
                                                            className={styles.avatarImage}
                                                            sizes="48px"
                                                        />
                                                    ) : (
                                                        <span className={styles.cardAvatarInitial}>
                                                            {testimonial.customerName.substring(0, 2).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={styles.cardAuthorInfo}>
                                                    <p className={styles.cardAuthorName}>{testimonial.customerName}</p>
                                                    {(testimonial.customerTitle || testimonial.company) && (
                                                        <p className={styles.cardAuthorTitle}>
                                                            {testimonial.customerTitle}
                                                            {testimonial.customerTitle && testimonial.company && ', '}
                                                            {testimonial.company}
                                                        </p>
                                                    )}
                                                    {testimonial.productPurchased && (
                                                        <p className={styles.cardPurchased}>
                                                            <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
                                                            </svg>
                                                            Purchased: {testimonial.productPurchased}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation arrows */}
                    {testimonials.length > visibleCardsActive && (
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
                    {testimonials.length > visibleCardsActive && (
                        <div className={styles.dots}>
                            {Array.from({ length: testimonials.length - visibleCardsActive + 1 }).map((_, index) => (
                                <button
                                    key={index}
                                    className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
                                    onClick={() => goToSlide(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Grid Layout
    if (layout === 'grid') {
        return (
            <div className={containerClass} style={customStyles}>
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
                                        <ImageWithDimensions
                                            src={testimonial.customerImage}
                                            alt={testimonial.customerName}
                                            fill
                                            aspectRatio="1x1"
                                            className={styles.avatarImage}
                                            sizes="48px"
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
                                    {testimonial.productPurchased && (
                                        <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
                                            </svg>
                                            Verified: {testimonial.productPurchased}
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

    // Default / Single Card Carousel Layout
    return (
        <div
            className={containerClass}
            style={customStyles}
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
                <div
                    className={styles.carouselViewport}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div
                        className={styles.carouselTrack}
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial._id}
                                className={styles.carouselSlide}
                            >
                                <div className={styles.featuredCard}>
                                    {renderStars(testimonial.rating)}

                                    <blockquote className={styles.quote}>
                                        "{testimonial.content}"
                                    </blockquote>

                                    <div className={styles.authorFeatured}>
                                        <div className={styles.avatarLarge}>
                                            {testimonial.customerImage ? (
                                                <ImageWithDimensions
                                                    src={testimonial.customerImage}
                                                    alt={testimonial.customerName}
                                                    fill
                                                    aspectRatio="1x1"
                                                    className={styles.avatarImage}
                                                    sizes="80px"
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
                                            {testimonial.productPurchased && (
                                                <p style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                                                    <svg style={{ width: '13px', height: '13px' }} viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
                                                    </svg>
                                                    Verified Purchase: {testimonial.productPurchased}
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

