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
 * SectionRenderer - Server-side compatible section renderer
 * Renders sections with their modules for SEO
 * Uses CSS media queries for responsive visibility instead of JS detection
 */
export default function SectionRenderer({ section, moduleData, renderModule, index = 0 }: SectionRendererProps) {
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
        minHeight: section.settings?.minHeight ? `${section.settings.minHeight}px` : undefined,
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
    // Uses CSS media queries instead of JS for SSR compatibility
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

    const content = section.columns && section.columns.length > 0 ? (
        <section
            className={`${styles.section} ${section.settings?.customClass || ''} ${getVisibilityClasses()}`}
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
                                renderModuleFn(module, moduleData?.[module.id], index === 0)
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    ) : (
        <section
            className={`${styles.section} ${section.settings?.customClass || ''} ${getVisibilityClasses()}`}
            style={sectionStyle}
        >
            <div className={getInnerClass()}>
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
