'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Section, Module } from '@/types/layout';
import ModuleRenderer from '../ModuleRenderer';
import LazySection from '../../common/LazySection';
import styles from './SectionRenderer.module.scss';

// Module render function type - allows custom rendering for page-specific modules
export type ModuleRenderFunction = (module: Module, prefetchedData?: any, priority?: boolean) => React.ReactNode;

interface SectionRendererProps {
    section: Section;
    moduleData?: Record<string, any>;
    // Optional custom render function for modules (e.g., for page-specific placeholders)
    renderModule?: ModuleRenderFunction;
    index?: number;
}

/**
 * SectionRenderer - Client component for interactive sections (Parallax, etc.)
 * Renders sections with their modules and handles scroll-based effects.
 */
export default function SectionRenderer({ section, moduleData, renderModule, index = 0 }: SectionRendererProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const [parallaxOffset, setParallaxOffset] = useState(0);

    const isParallax = !!(section.settings?.backgroundImage && section.settings?.backgroundParallax);
    const parallaxRatio = section.settings?.backgroundParallaxRatio ?? 0.5;

    useEffect(() => {
        if (!isParallax) return;

        let requestRef: number;

        const handleScroll = () => {
            if (!sectionRef.current) return;

            const rect = sectionRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Only update if the section is in the viewport
            if (rect.top <= windowHeight && rect.bottom >= 0) {
                // Percentage of section visibility (0 to 1)
                const scrollPercent = (windowHeight - rect.top) / (windowHeight + rect.height);
                // Map 0-1 to a range like -10% to 10% or similar
                // We use percentage of section height for the offset
                const offset = (scrollPercent - 0.5) * rect.height * parallaxRatio;
                setParallaxOffset(offset);
            }
        };

        const onScroll = () => {
            requestRef = requestAnimationFrame(handleScroll);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        handleScroll(); // Initial position

        return () => {
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(requestRef);
        };
    }, [isParallax, parallaxRatio]);

    // Default module renderer using the standard ModuleRenderer component
    const defaultRenderModule: ModuleRenderFunction = (module, prefetchedData, priority) => (
        <ModuleRenderer
            key={module.id}
            module={module}
            sectionType={section.type}
            prefetchedData={prefetchedData}
            priority={priority}
        />
    );

    // Use custom render function if provided, otherwise use default
    const renderModuleFn = renderModule || defaultRenderModule;

    // Build section styles
    const sectionStyle: React.CSSProperties = {
        backgroundColor: section.settings?.backgroundColor,
        paddingTop: section.settings?.paddingTop ? `${section.settings.paddingTop}px` : undefined,
        paddingBottom: section.settings?.paddingBottom ? `${section.settings.paddingBottom}px` : undefined,
        paddingLeft: section.settings?.paddingLeft ? `${section.settings.paddingLeft}px` : undefined,
        paddingRight: section.settings?.paddingRight ? `${section.settings.paddingRight}px` : undefined,
        marginTop: section.settings?.marginTop ? `${section.settings.marginTop}px` : undefined,
        marginBottom: section.settings?.marginBottom ? `${section.settings.marginBottom}px` : undefined,
        minHeight: section.settings?.minHeight ? `${section.settings.minHeight}px` : undefined,
        maxHeight: section.settings?.maxHeight ? `${section.settings.maxHeight}px` : undefined,
        // Individual border widths
        borderTopWidth: section.settings?.borderTopWidth ? `${section.settings.borderTopWidth}px` : undefined,
        borderRightWidth: section.settings?.borderRightWidth ? `${section.settings.borderRightWidth}px` : undefined,
        borderBottomWidth: section.settings?.borderBottomWidth ? `${section.settings.borderBottomWidth}px` : undefined,
        borderLeftWidth: section.settings?.borderLeftWidth ? `${section.settings.borderLeftWidth}px` : undefined,
        borderColor: section.settings?.borderColor,
        borderStyle: section.settings?.borderStyle || 'solid',
        borderRadius: section.settings?.borderRadius ? `${section.settings.borderRadius}px` : undefined,
        // Box shadow
        boxShadow: section.settings?.boxShadow ? getBoxShadow(section.settings.boxShadow) : undefined,
    };

    // Helper function for box shadow presets
    function getBoxShadow(preset: string): string | undefined {
        switch (preset) {
            case 'small': return '0 2px 8px rgba(0, 0, 0, 0.1)';
            case 'medium': return '0 4px 16px rgba(0, 0, 0, 0.15)';
            case 'large': return '0 8px 30px rgba(0, 0, 0, 0.2)';
            default: return undefined;
        }
    }

    const backgroundStyle: React.CSSProperties = {
        backgroundImage: section.settings?.backgroundImage
            ? `url(${section.settings.backgroundImage})`
            : undefined,
        backgroundSize: section.settings?.backgroundSize || 'cover',
        backgroundPosition: section.settings?.backgroundPosition || 'center',
        transform: isParallax ? `translateY(${parallaxOffset}px)` : undefined,
    };

    // Check if section is full-width (no container wrapper needed)
    const isFullWidth = section.type === 'full-width';

    // Get inner wrapper class based on section type
    const getInnerClass = () => {
        if (isFullWidth) {
            return styles.fullWidth;
        }
        return styles.container;
    };

    // Build visibility CSS classes for responsive hiding
    const getVisibilityClasses = () => {
        const classes: string[] = [];
        const vis = section.visibility;

        if (vis?.desktop === false) classes.push(styles.hideDesktop);
        if (vis?.tablet === false) classes.push(styles.hideTablet);
        if (vis?.mobile === false) classes.push(styles.hideMobile);

        return classes.join(' ');
    };

    // Sort modules by order
    const sortedModules = [...(section.modules || [])].sort((a, b) => a.order - b.order);

    const isLazy = index > 1; // Lazy load everything after the first 2 sections

    const columnCount = section.columns?.length || 0;

    const renderBackground = () => {
        if (!section.settings?.backgroundImage) return null;

        return (
            <div className={styles.backgroundLayer} style={backgroundStyle} />
        );
    };

    const content = section.columns && section.columns.length > 0 ? (
        <section
            id={section.sectionId || undefined}
            ref={sectionRef}
            className={`${styles.section} ${section.settings?.customClass || ''} ${getVisibilityClasses()}`}
            style={sectionStyle}
        >
            {renderBackground()}
            <div className={`${styles.contentWrapper} ${getInnerClass()} ${styles.columnWrapper}`}>
                {section.columns.map((column) => {
                    const sortedColumnModules = [...(column.modules || [])].sort((a, b) => a.order - b.order);
                    const widthPercent = (column.width / 12) * 100;
                    return (
                        <div
                            key={column.id}
                            className={styles.column}
                            style={{
                                '--column-width': `${widthPercent}%`,
                                '--column-count': columnCount,
                            } as React.CSSProperties}
                        >
                            {sortedColumnModules.map((module) =>
                                renderModuleFn(module, moduleData?.[module.id], index === 0)
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    ) : (
        <section
            id={section.sectionId || undefined}
            ref={sectionRef}
            className={`${styles.section} ${section.settings?.customClass || ''} ${getVisibilityClasses()}`}
            style={sectionStyle}
        >
            {renderBackground()}
            <div className={`${styles.contentWrapper} ${getInnerClass()}`}>
                {sortedModules.map((module) =>
                    renderModuleFn(module, moduleData?.[module.id], index === 0)
                )}
            </div>
        </section>
    );

    if (isLazy) {
        return (
            <LazySection placeholderHeight={section.settings?.minHeight || 400}>
                {content}
            </LazySection>
        );
    }

    return content;
}
