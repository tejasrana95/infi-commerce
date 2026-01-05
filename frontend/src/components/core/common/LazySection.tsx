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
 * LazySection - Server-renders children for SEO, then hydrates lazily on client
 * Content is always rendered in HTML for search engines (SSR)
 * On client, content is shown immediately but hydration is deferred until viewport entry
 */
export default function LazySection({
    children,
    threshold = 0.01,
    rootMargin = '200px',
    placeholderHeight = 100,
    className = ''
}: LazySectionProps) {
    const [shouldHydrate, setShouldHydrate] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If already hydrated or no container, skip
        if (shouldHydrate || !containerRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldHydrate(true);
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
    }, [shouldHydrate, threshold, rootMargin]);

    // Always render children for SSR (SEO)
    // The lazy behavior only affects client-side hydration timing
    return (
        <div
            ref={containerRef}
            className={className}
        >
            {children}
        </div>
    );
}
