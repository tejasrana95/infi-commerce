'use client';

import { Section } from '@/types/layout';
import ModuleRenderer from '../ModuleRenderer';
import { useEffect, useState } from 'react';
import styles from './SectionRenderer.module.scss';

interface SectionRendererProps {
    section: Section;
    moduleData?: Record<string, any>;
}

/**
 * SectionRenderer - Renders a layout section with its modules
 * Handles responsive visibility and section-level styling
 * Accepts moduleData for SSR to pass pre-fetched data to modules
 */
export default function SectionRenderer({ section, moduleData }: SectionRendererProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Don't render until mounted (for responsive visibility)
    if (!isMounted) {
        return null;
    }

    // Check visibility based on device type
    // This is a simple implementation - you may want to use media queries or a context
    const isVisible = section.visibility?.desktop !== false;

    if (!isVisible) {
        return null;
    }

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

    // Get container class for the inner content wrapper
    const getContainerClass = () => {
        if (isFullWidth) {
            // Full-width gets horizontal padding but no max-width constraint
            return styles.fullWidth;
        }

        switch (section.type) {
            case 'split-2':
                return `${styles.container} ${styles.splitTwo}`;
            case 'split-3':
                return `${styles.container} ${styles.splitThree}`;
            case 'split-4':
                return `${styles.container} ${styles.splitFour}`;
            default:
                return styles.container;
        }
    };

    // Sort modules by order
    const sortedModules = [...(section.modules || [])].sort((a, b) => a.order - b.order);

    // Render split layout with columns
    if (section.columns && section.columns.length > 0) {
        return (
            <section
                className={`${styles.section} ${section.settings?.customClass || ''}`}
                style={sectionStyle}
            >
                <div className={`${getContainerClass()} ${styles.columnWrapper}`}>
                    {section.columns.map((column) => {
                        const sortedColumnModules = [...(column.modules || [])].sort((a, b) => a.order - b.order);
                        // Convert 12-column grid value to percentage (e.g., 6 -> 50%)
                        const widthPercent = (column.width / 12) * 100;
                        return (
                            <div
                                key={column.id}
                                className={styles.column}
                                style={{ '--column-width': `${widthPercent}%` } as React.CSSProperties}
                            >
                                {sortedColumnModules.map((module) => (
                                    <ModuleRenderer
                                        key={module.id}
                                        module={module}
                                        sectionType={section.type}
                                        prefetchedData={moduleData?.[module.id]}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </section>
        );
    }

    // Render standard layout with modules
    return (
        <section
            className={`${styles.section} ${section.settings?.customClass || ''}`}
            style={sectionStyle}
        >
            <div className={getContainerClass()}>
                {sortedModules.map((module) => (
                    <ModuleRenderer
                        key={module.id}
                        module={module}
                        sectionType={section.type}
                        prefetchedData={moduleData?.[module.id]}
                    />
                ))}
            </div>
        </section>
    );
}

