'use client';

import { Section, Module } from '@/types/layout';
import DefaultModuleRenderer from '../ModuleRenderer';
import { useEffect, useState, ReactNode } from 'react';
import { useDeviceType, checkVisibility } from '@/hooks/useDeviceType';
import LazySection from '../../common/LazySection';
import styles from './SectionRenderer.module.scss';

// Module render function type - allows custom rendering for page-specific modules
export type ModuleRenderFunction = (module: Module, prefetchedData?: any) => ReactNode;

interface SectionRendererProps {
    section: Section;
    moduleData?: Record<string, any>;
    // Optional custom render function for modules (e.g., for page-specific placeholders)
    renderModule?: ModuleRenderFunction;
    index?: number;
}

/**
 * SectionRenderer - Renders a layout section with its modules
 * Handles responsive visibility, section-level styling, container/full-width, and column layouts.
 * Can be used standalone or with a custom renderModule prop for page-specific module handling.
 */
export default function SectionRenderer({ section, moduleData, renderModule, index = 0 }: SectionRendererProps) {
    const [isMounted, setIsMounted] = useState(false);
    const deviceType = useDeviceType();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Don't render until mounted (for responsive visibility)
    if (!isMounted) {
        return null;
    }

    // Check visibility based on current device type
    const isVisible = checkVisibility(section.visibility, deviceType);

    if (!isVisible) {
        return null;
    }

    // Default module renderer using the standard ModuleRenderer component
    const defaultRenderModule: ModuleRenderFunction = (module, prefetchedData) => (
        <DefaultModuleRenderer
            key={module.id}
            module={module}
            sectionType={section.type}
            prefetchedData={prefetchedData}
        />
    );

    // Use custom render function if provided, otherwise use default
    const renderModuleFn = renderModule || defaultRenderModule;

    // Build section styles (for the outer wrapper - backgrounds, margins)
    const sectionStyle: React.CSSProperties = {
        backgroundColor: section.settings?.backgroundColor,
        backgroundImage: section.settings?.backgroundImage
            ? `url(${section.settings.backgroundImage})`
            : undefined,
        backgroundSize: section.settings?.backgroundSize || 'cover',
        backgroundPosition: section.settings?.backgroundPosition || 'center',
        paddingTop: section.settings?.paddingTop ? `${section.settings.paddingTop}px` : undefined,
        paddingBottom: section.settings?.paddingBottom ? `${section.settings.paddingBottom}px` : undefined,
        marginTop: section.settings?.marginTop ? `${section.settings.marginTop}px` : undefined,
        marginBottom: section.settings?.marginBottom ? `${section.settings.marginBottom}px` : undefined,
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

    // Sort modules by order
    const sortedModules = [...(section.modules || [])].sort((a, b) => a.order - b.order);

    const isLazy = index > 1; // Lazy load everything after the first 2 sections

    const columnCount = section.columns?.length || 0;

    const content = section.columns && section.columns.length > 0 ? (
        <section
            className={`${styles.section} ${section.settings?.customClass || ''}`}
            style={sectionStyle}
        >
            <div className={`${getInnerClass()} ${styles.columnWrapper}`}>
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
                                renderModuleFn(module, moduleData?.[module.id])
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    ) : (
        <section
            className={`${styles.section} ${section.settings?.customClass || ''}`}
            style={sectionStyle}
        >
            <div className={getInnerClass()}>
                {sortedModules.map((module) =>
                    renderModuleFn(module, moduleData?.[module.id])
                )}
            </div>
        </section>
    );

    if (isLazy) {
        return (
            <LazySection placeholderHeight={400}>
                {content}
            </LazySection>
        );
    }

    return content;
}
