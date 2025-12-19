'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModuleProps } from '../..';
import api from '@/lib/api';

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

export default function BannerSliderModule({ config }: ModuleProps) {
    const { sliderId } = config as BannerSliderConfig;
    const [slider, setSlider] = useState<BannerSliderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const fetchSlider = async () => {
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

        if (sliderId) {
            fetchSlider();
        }
    }, [sliderId]);

    // Auto-play functionality
    useEffect(() => {
        if (!slider || !slider.settings.autoplay || isPaused || slider.slides.length <= 1) {
            return;
        }

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slider.slides.length);
        }, slider.settings.interval);

        return () => clearInterval(timer);
    }, [slider, isPaused]);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        if (slider) {
            setCurrentSlide((prev) => (prev + 1) % slider.slides.length);
        }
    };

    const prevSlide = () => {
        if (slider) {
            setCurrentSlide((prev) => (prev - 1 + slider.slides.length) % slider.slides.length);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-[400px] bg-gray-200 animate-pulse rounded-lg" />
        );
    }

    if (error || !slider || slider.slides.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className="w-full p-8 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">Error loading banner slider: {error || 'No slides found'}</p>
                </div>
            );
        }
        return null;
    }

    const currentSlideData = slider.slides[currentSlide];
    const alignmentClass = {
        left: 'items-start text-left',
        center: 'items-center text-center',
        right: 'items-end text-right',
    }[currentSlideData.alignment || 'center'];

    return (
        <div
            className="relative w-full overflow-hidden rounded-lg"
            onMouseEnter={() => slider.settings.pauseOnHover && setIsPaused(true)}
            onMouseLeave={() => slider.settings.pauseOnHover && setIsPaused(false)}
        >
            {/* Slides */}
            <div className="relative w-full aspect-[21/9]">
                {slider.slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-500 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        {slide.image && (
                            <>
                                <Image
                                    src={slide.image}
                                    alt={slide.title || `Slide ${index + 1}`}
                                    fill
                                    className="object-cover hidden md:block"
                                    priority={index === 0}
                                />
                                {slide.mobileImage && (
                                    <Image
                                        src={slide.mobileImage}
                                        alt={slide.title || `Slide ${index + 1}`}
                                        fill
                                        className="object-cover md:hidden"
                                        priority={index === 0}
                                    />
                                )}
                            </>
                        )}

                        {/* Text Content */}
                        {(slide.title || slide.subtitle || slide.ctaText) && (
                            <div className={`absolute inset-0 flex flex-col justify-center ${alignmentClass} p-8 md:p-16`}>
                                <div className="max-w-2xl" style={{ color: slide.textColor || '#ffffff' }}>
                                    {slide.title && (
                                        <h2 className="text-3xl md:text-5xl font-bold mb-4">
                                            {slide.title}
                                        </h2>
                                    )}
                                    {slide.subtitle && (
                                        <p className="text-lg md:text-xl mb-6 opacity-90">
                                            {slide.subtitle}
                                        </p>
                                    )}
                                    {slide.ctaText && slide.ctaLink && (
                                        <Link
                                            href={slide.ctaLink}
                                            className="inline-block px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-opacity-90 transition-all"
                                        >
                                            {slide.ctaText}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {slider.settings.showArrows && slider.slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all z-10"
                        aria-label="Previous slide"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all z-10"
                        aria-label="Next slide"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}

            {/* Dots Navigation */}
            {slider.settings.showDots && slider.slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {slider.slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                                ? 'bg-white w-8'
                                : 'bg-white/50 hover:bg-white/75'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
