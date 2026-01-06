import { Module } from '@/types/layout';
import { moduleRegistry } from '@/components/core/modules';
import styles from './ModuleRenderer.module.scss';

interface ModuleRendererProps {
    module: Module;
    sectionType?: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
    prefetchedData?: any; // SSR pre-fetched data for this module
    priority?: boolean;
}

/**
 * ModuleRenderer - Server-side compatible module renderer
 * Renders a single module based on its type for SEO
 * Looks up the module component from the registry and applies styling
 * Uses CSS media queries for responsive visibility instead of JS detection
 */
export default function ModuleRenderer({ module, sectionType, prefetchedData, priority }: ModuleRendererProps) {
    // Get module component from registry
    const ModuleComponent = moduleRegistry[module.type];

    if (!ModuleComponent) {
        // Module type not found - show placeholder in development
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className="border-2 border-dashed border-red-300 bg-red-50 p-4 rounded-lg my-2">
                    <p className="text-red-600 font-semibold">
                        ⚠️ Module &quot;{module.type}&quot; not found in registry
                    </p>
                    <pre className="text-xs mt-2 text-red-800">
                        {JSON.stringify(module.config, null, 2)}
                    </pre>
                </div>
            );
        }
        return null;
    }

    // Build module props
    const moduleProps = {
        config: module.config,
        sectionType,
        initialData: prefetchedData,
        priority
    };

    // Check if module is full height
    const isFullHeight = module.config?.fullHeight === true;

    // Build module styles
    const moduleStyle: React.CSSProperties = {
        marginTop: module.styling?.marginTop ? `${module.styling.marginTop}px` : undefined,
        marginBottom: module.styling?.marginBottom ? `${module.styling.marginBottom}px` : undefined,
        paddingTop: module.styling?.paddingTop ? `${module.styling.paddingTop}px` : undefined,
        paddingBottom: module.styling?.paddingBottom ? `${module.styling.paddingBottom}px` : undefined,
        height: isFullHeight ? '100%' : undefined,
    };

    // Build visibility CSS classes for responsive hiding
    const getVisibilityClasses = () => {
        const classes: string[] = [];
        const vis = module.visibility;

        if (vis?.desktop === false) classes.push(styles.hideDesktop);
        if (vis?.tablet === false) classes.push(styles.hideTablet);
        if (vis?.mobile === false) classes.push(styles.hideMobile);

        return classes.join(' ');
    };

    // Check if module is full height
    // (Already declared above)

    return (
        <div
            className={`${module.styling?.className || ''} ${getVisibilityClasses()} ${isFullHeight ? styles.fullHeight : ''}`}
            style={moduleStyle}
        >
            <ModuleComponent {...moduleProps} />

            {/* Custom CSS for this module */}
            {module.styling?.customCSS && (
                <style dangerouslySetInnerHTML={{ __html: module.styling.customCSS }} />
            )}
        </div>
    );
}
