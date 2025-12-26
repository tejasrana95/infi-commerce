'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CardGroup.module.scss';

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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(columns.desktop);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // For infinite loop, we clone cards
    // [Clone of Last Group] [Original Cards] [Clone of First Group]
    const clonedCards = [...cards.slice(-visibleCount), ...cards, ...cards.slice(0, visibleCount)];
    const totalOriginal = cards.length;

    // Initial position should be at the start of original cards
    useEffect(() => {
        if (layout === 'carousel') {
            setCurrentIndex(visibleCount);
        }
    }, [layout, visibleCount]);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setVisibleCount(columns.mobile);
            else if (width < 1024) setVisibleCount(columns.tablet);
            else setVisibleCount(columns.desktop);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [columns]);

    const handleNext = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev + 1);
    }, [isTransitioning]);

    const handlePrev = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev - 1);
    }, [isTransitioning]);

    // Handle Infinite Loop Snap
    useEffect(() => {
        if (!isTransitioning) return;

        const timer = setTimeout(() => {
            setIsTransitioning(false);

            // If we reached the end cloned set, jump back to start of original set
            if (currentIndex >= totalOriginal + visibleCount) {
                setCurrentIndex(visibleCount);
            }
            // If we reached the start cloned set, jump forward to end of original set
            if (currentIndex < visibleCount) {
                setCurrentIndex(totalOriginal + visibleCount - 1);
            }
        }, 600); // Matches transition duration in SCSS

        return () => clearTimeout(timer);
    }, [currentIndex, isTransitioning, totalOriginal, visibleCount]);

    if (!cards || cards.length === 0) return null;

    const renderCard = (card: CardItem, index: number) => {
        const isExternal = !card.link.startsWith('/');
        return (
            <div className={styles.card} key={index}>
                {card.image && (
                    <div className={styles.imageWrapper}>
                        {isExternal ? (
                            <a href={card.link} target="_blank" rel="noopener noreferrer" className={styles.cta}>
                                <Image src={card.image} alt={card.title} loading="lazy" width={425} height={265} />
                            </a>
                        ) : (
                            <Link href={card.link} className={styles.cta}>
                                <Image src={card.image} alt={card.title} loading="lazy" width={425} height={265} />
                            </Link>
                        )}
                    </div>
                )}
                <div className={styles.content}>
                    {isExternal ? (
                        <a href={card.link} target="_blank" rel="noopener noreferrer" className={styles.cta}>
                            <h3 className={styles.cardTitle}>{card.title}</h3>
                        </a>
                    ) : (
                        <Link href={card.link} className={styles.cta}>
                            <h3 className={styles.cardTitle}>{card.title}</h3>
                        </Link>
                    )}

                    <p className={styles.description}>{card.description}</p>
                    {card.ctaText && card.link && (
                        <div className={styles.ctaWrapper}>
                            {linkComponent(card)}
                        </div>
                    )}
                </div>
            </div>
        )
    };

    const linkComponent = (card: CardItem) => {
        const isExternal = !card.link.startsWith('/');
        const content = (
            <>
                {card.ctaText}
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </>
        );

        return isExternal ? (
            <a href={card.link} target="_blank" rel="noopener noreferrer" className={styles.cta}>
                {content}
            </a>
        ) : (
            <Link href={card.link} className={styles.cta}>
                {content}
            </Link>
        );
    };

    return (
        <section className={`${styles.cardGroup} ${styles[layout]} ${className || ''}`}>
            <div>
                {title && (
                    <div className={styles.titleWrapper}>
                        <h2 className={styles.title}>{title}</h2>
                        <div className={styles.divider} />
                    </div>
                )}

                {layout === 'grid' ? (
                    <div
                        className={styles.container}
                        style={{
                            '--cols-desktop': columns.desktop,
                            '--cols-tablet': columns.tablet,
                            '--cols-mobile': columns.mobile,
                        } as React.CSSProperties}
                    >
                        {cards.map((card, index) => renderCard(card, index))}
                    </div>
                ) : (
                    <div className={styles.carouselWrapper}>
                        <div className={styles.carouselViewport}>
                            <div
                                className={styles.carouselTrack}
                                style={{
                                    transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                                    transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' : 'none'
                                }}
                            >
                                {clonedCards.map((card, index) => (
                                    <div
                                        className={styles.carouselSlide}
                                        key={index}
                                        style={{ width: `${100 / visibleCount}%` }}
                                    >
                                        {renderCard(card, index)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.controls}>
                            <button className={styles.navButton} onClick={handlePrev} aria-label="Previous">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div className={styles.dots}>
                                {cards.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`${styles.dot} ${(currentIndex - visibleCount + totalOriginal) % totalOriginal === index ? styles.active : ''}`}
                                        onClick={() => {
                                            if (isTransitioning) return;
                                            setIsTransitioning(true);
                                            setCurrentIndex(index + visibleCount);
                                        }}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>

                            <button className={styles.navButton} onClick={handleNext} aria-label="Next">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CardGroup;
