'use client';

import { Section } from '@/types/layout';
import ModuleRenderer from '../ModuleRenderer';
import { useEffect, useState } from 'react';

interface SectionRendererProps {
    section: Section;
}

/**
 * SectionRenderer - Renders a layout section with its modules
 * Handles responsive visibility and section-level styling
 */
export default function SectionRenderer({ section }: SectionRendererProps) {
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

    // Build section styles
    const sectionStyle: React.CSSProperties = {
        backgroundColor: section.settings?.backgroundColor,
        backgroundImage: section.settings?.backgroundImage
            ? `url(${section.settings.backgroundImage})`
            : undefined,
        backgroundSize: section.settings?.backgroundSize || 'cover',
        backgroundPosition: section.settings?.backgroundPosition || 'center',
        paddingTop: section.settings?.paddingTop ? `${section.settings.paddingTop}px` : undefined,
        paddingBottom: section.settings?.paddingBottom ? `${section.settings.paddingBottom}px` : undefined,
        paddingLeft: section.settings?.paddingLeft ? `${section.settings.paddingLeft}px` : undefined,
        paddingRight: section.settings?.paddingRight ? `${section.settings.paddingRight}px` : undefined,
        marginTop: section.settings?.marginTop ? `${section.settings.marginTop}px` : undefined,
        marginBottom: section.settings?.marginBottom ? `${section.settings.marginBottom}px` : undefined,
    };

    // Get container class based on section type
    const getContainerClass = () => {
        switch (section.type) {
            case 'full-width':
                return 'w-full';
            case 'container':
                return 'container mx-auto px-4';
            case 'split-2':
                return 'container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8';
            case 'split-3':
                return 'container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8';
            case 'split-4':
                return 'container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8';
            default:
                return 'container mx-auto px-4';
        }
    };

    // Sort modules by order
    const sortedModules = [...(section.modules || [])].sort((a, b) => a.order - b.order);

    // Render split layout with columns
    if (section.columns && section.columns.length > 0) {
        return (
            <section
                className={`${getContainerClass()} ${section.settings?.customClass || ''}`}
                style={sectionStyle}
            >
                {section.columns.map((column) => {
                    const sortedColumnModules = [...(column.modules || [])].sort((a, b) => a.order - b.order);
                    return (
                        <div key={column.id} style={{ width: `${column.width}%` }}>
                            {sortedColumnModules.map((module) => (
                                <ModuleRenderer key={module.id} module={module} />
                            ))}
                        </div>
                    );
                })}
            </section>
        );
    }

    // Render standard layout with modules
    return (
        <section
            className={`${getContainerClass()} ${section.settings?.customClass || ''}`}
            style={sectionStyle}
        >
            {sortedModules.map((module) => (
                <ModuleRenderer key={module.id} module={module} />
            ))}
        </section>
    );
}
