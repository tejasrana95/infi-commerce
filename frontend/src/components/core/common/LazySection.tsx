'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface LazySectionProps {
    children: ReactNode;
    threshold?: number;
    rootMargin?: string;
    placeholderHeight?: number;
    className?: string;
}

/**
 * LazySection - Defers rendering of children until they enter the viewport
 * Useful for reducing TBT by delaying hydration of below-the-fold content
 */
export default function LazySection({
    children,
    threshold = 0.01,
    rootMargin = '200px',
    placeholderHeight = 100,
    className = ''
}: LazySectionProps) {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If already visible or no container, skip
        if (isVisible || !containerRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                threshold,
                rootMargin,
            }
        );

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [isVisible, threshold, rootMargin]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={!isVisible ? { minHeight: `${placeholderHeight}px` } : undefined}
        >
            {isVisible ? children : null}
        </div>
    );
}
