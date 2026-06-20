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
        styling: module.styling,
        sectionType,
        initialData: prefetchedData,
        priority
    };

    // Check if module is full height
    const isFullHeight = module.config?.fullHeight === true;

    const getShadow = () => {
        switch (module.styling?.boxShadow) {
            case 'small':
                return '0 6px 18px rgba(15, 23, 42, 0.08)';
            case 'medium':
                return '0 12px 30px rgba(15, 23, 42, 0.12)';
            case 'large':
                return '0 24px 50px rgba(15, 23, 42, 0.16)';
            default:
                return undefined;
        }
    };

    // Build module styles
    const moduleStyle: React.CSSProperties & Record<string, string | number | undefined> = {
        marginTop: module.styling?.marginTop !== undefined ? `${module.styling.marginTop}px` : undefined,
        marginBottom: module.styling?.marginBottom !== undefined ? `${module.styling.marginBottom}px` : undefined,
        marginLeft: module.styling?.marginLeft !== undefined ? `${module.styling.marginLeft}px` : undefined,
        marginRight: module.styling?.marginRight !== undefined ? `${module.styling.marginRight}px` : undefined,
        paddingTop: module.styling?.paddingTop !== undefined ? `${module.styling.paddingTop}px` : undefined,
        paddingBottom: module.styling?.paddingBottom !== undefined ? `${module.styling.paddingBottom}px` : undefined,
        paddingLeft: module.styling?.paddingLeft !== undefined ? `${module.styling.paddingLeft}px` : undefined,
        paddingRight: module.styling?.paddingRight !== undefined ? `${module.styling.paddingRight}px` : undefined,
        maxWidth: module.styling?.maxWidth !== undefined ? `${module.styling.maxWidth}px` : undefined,
        backgroundColor: module.styling?.backgroundColor,
        color: module.styling?.textColor,
        border: module.styling?.borderStyle && module.styling.borderStyle !== 'none'
            ? `${module.styling.borderWidth ?? 1}px ${module.styling.borderStyle} ${module.styling.borderColor || 'transparent'}`
            : 'none',
        borderRadius: module.styling?.borderRadius !== undefined ? `${module.styling.borderRadius}px` : undefined,
        boxShadow: getShadow(),
        height: isFullHeight ? '100%' : undefined,
        width: '100%',
        boxSizing: 'border-box',
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
