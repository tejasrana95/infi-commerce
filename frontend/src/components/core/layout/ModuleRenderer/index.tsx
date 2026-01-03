'use client';

import { Module } from '@/types/layout';
import { moduleRegistry } from '@/components/core/modules';
import { useDeviceType, checkVisibility } from '@/hooks/useDeviceType';

interface ModuleRendererProps {
    module: Module;
    sectionType?: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
    prefetchedData?: any; // SSR pre-fetched data for this module
}

/**
 * ModuleRenderer - Renders a single module based on its type
 * Looks up the module component from the registry and applies styling
 * Accepts prefetchedData for SSR to prevent client-side fetches
 */
export default function ModuleRenderer({ module, sectionType, prefetchedData }: ModuleRendererProps) {
    const deviceType = useDeviceType();

    // Check visibility based on current device type
    const isVisible = checkVisibility(module.visibility, deviceType);

    if (!isVisible) {
        return null;
    }

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
        initialData: prefetchedData
    };

    // Build module styles
    const moduleStyle: React.CSSProperties = {
        marginTop: module.styling?.marginTop ? `${module.styling.marginTop}px` : undefined,
        marginBottom: module.styling?.marginBottom ? `${module.styling.marginBottom}px` : undefined,
        paddingTop: module.styling?.paddingTop ? `${module.styling.paddingTop}px` : undefined,
        paddingBottom: module.styling?.paddingBottom ? `${module.styling.paddingBottom}px` : undefined,
    };

    return (
        <div
            className={module.styling?.className || ''}
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
