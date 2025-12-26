'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface CardItem {
    title: string;
    description: string;
    image: string;
    link: string;
    ctaText: string;
}

interface CardGroupProps {
    title?: string;
    layout?: 'grid' | 'carousel';
    columns?: {
        desktop: number;
        tablet: number;
        mobile: number;
    };
    cards?: CardItem[];
    className?: string;
}

const CardGroup: React.FC<CardGroupProps> = ({
    title,
    layout = 'grid',
    columns = { desktop: 3, tablet: 2, mobile: 1 },
    cards = [],
    className,
}) => {
    // Carousel State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(columns.desktop);

    // Update visible count on resize for Carousel
    useEffect(() => {
        if (layout !== 'carousel') return;

        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setVisibleCount(columns.mobile);
            else if (width < 1024) setVisibleCount(columns.tablet);
            else setVisibleCount(columns.desktop);
        };

        handleResize(); // Initial call
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [layout, columns]);

    // Autoplay & Pause State
    const [isPaused, setIsPaused] = useState(false);
    const autoplay = true; // Default to true or add to props if needed
    const autoplayInterval = 4000;



    if (!cards || cards.length === 0) return null;

    const isGrid = layout === 'grid';
    const maxIndex = Math.max(0, cards.length - visibleCount);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
    }, [maxIndex]);

    const prevSlide = useCallback(() => {
        setCurrentIndex(prev => prev <= 0 ? maxIndex : prev - 1);
    }, [maxIndex]);

    const goToSlide = (index: number) => {
        setCurrentIndex(Math.min(Math.max(0, index), maxIndex));
    };

    // Autoplay Effect
    useEffect(() => {
        if (autoplay && cards.length > visibleCount && !isPaused) {
            const timer = setInterval(nextSlide, autoplayInterval);
            return () => clearInterval(timer);
        }
    }, [autoplay, autoplayInterval, cards.length, visibleCount, isPaused, nextSlide]);

    const renderCard = (card: CardItem, index: number) => (
        // ... (existing renderCard content) ...
        <div
            key={index}
            className={`
                flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 
                hover:shadow-md transition-all duration-300 group h-full
            `}
        >
            {card.image && (
                <div className="relative aspect-[6/3] w-full bg-gray-100 overflow-hidden">
                    <img
                        src={card.image}
                        alt={card.title}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                </div>
            )}
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold mb-3 text-gray-900">{card.title}</h3>
                <p className="text-gray-600 mb-6 flex-grow text-sm leading-relaxed line-clamp-3">
                    {card.description}
                </p>
                {card.ctaText && card.link && (
                    <div className="mt-auto">
                        {card.link.startsWith('/') ? (
                            <Link href={card.link} className="text-primary-600 font-semibold text-sm hover:text-primary-700 inline-flex items-center group/link">
                                {card.ctaText}
                                <svg className="w-4 h-4 ml-1 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        ) : (
                            <a href={card.link} className="text-primary-600 font-semibold text-sm hover:text-primary-700 inline-flex items-center group/link" target="_blank" rel="noopener noreferrer">
                                {card.ctaText}
                                <svg className="w-4 h-4 ml-1 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`py-12 ${className || ''}`}>
            {title && (
                <div className="container mx-auto px-4 mb-10">
                    <h2 className="text-3xl font-bold text-center text-gray-900">{title}</h2>
                </div>
            )}

            {isGrid ? (
                <div className="container mx-auto px-4">
                    <div
                        className="grid-layout"
                        style={{
                            '--cols-desktop': columns.desktop,
                            '--cols-tablet': columns.tablet,
                            '--cols-mobile': columns.mobile,
                        } as React.CSSProperties}
                    >
                        <style jsx>{`
                            .grid-layout {
                                display: grid;
                                gap: 2rem;
                                grid-template-columns: repeat(var(--cols-mobile), minmax(0, 1fr));
                            }
                            @media (min-width: 640px) {
                                .grid-layout {
                                    grid-template-columns: repeat(var(--cols-tablet), minmax(0, 1fr));
                                }
                            }
                            @media (min-width: 1024px) {
                                .grid-layout {
                                    grid-template-columns: repeat(var(--cols-desktop), minmax(0, 1fr));
                                }
                            }
                        `}</style>
                        {cards.map((card, index) => renderCard(card, index))}
                    </div>
                </div>
            ) : (
                <div className="container mx-auto px-4 relative group/carousel">
                    <div
                        className="overflow-hidden p-4 -m-4"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{
                                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                                width: `${(cards.length / visibleCount) * 100}%`
                            }}
                        >
                            {cards.map((card, index) => (
                                <div
                                    key={index}
                                    className="px-3"
                                    style={{ width: `${100 / cards.length}%` }}
                                >
                                    {renderCard(card, index)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    {cards.length > visibleCount && (
                        <>
                            <button
                                onClick={prevSlide}
                                className={`
                                    absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 md:-translate-x-full lg:-translate-x-12
                                    w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center
                                    text-gray-700 hover:text-primary-600 hover:shadow-lg transition-all z-10
                                `}
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={nextSlide}
                                className={`
                                    absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 md:translate-x-full lg:translate-x-12
                                    w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center
                                    text-gray-700 hover:text-primary-600 hover:shadow-lg transition-all z-10
                                `}
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}

                    {/* Dots Navigation */}
                    {cards.length > visibleCount && (
                        <div className="flex justify-center gap-2 mt-6">
                            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                                <button
                                    key={index}
                                    className={`
                                        w-2 h-2 rounded-full transition-all duration-300
                                        ${index === currentIndex
                                            ? 'bg-primary-600 w-6'
                                            : 'bg-gray-300 hover:bg-gray-400'
                                        }
                                    `}
                                    onClick={() => goToSlide(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CardGroup;
