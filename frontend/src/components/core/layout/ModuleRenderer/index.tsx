// Module Renderer - Dynamically renders modules based on type

import { LayoutModule } from '@/types/layout';
import { MODULE_REGISTRY } from '@/components/core/modules';

interface ModuleRendererProps {
    module: LayoutModule;
    sectionSettings?: any;
}

export default function ModuleRenderer({ module, sectionSettings }: ModuleRendererProps) {
    const ModuleComponent = MODULE_REGISTRY[module.type];

    if (!ModuleComponent) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Module type "${module.type}" not found in registry`);
        }
        return null;
    }

    // Apply visibility rules
    const { visibility = { desktop: true, tablet: true, mobile: true } } = module;

    // Build visibility classes
    const visibilityClasses = [];
    if (!visibility.desktop) visibilityClasses.push('hidden lg:hidden');
    if (!visibility.tablet) visibilityClasses.push('md:max-lg:hidden');
    if (!visibility.mobile) visibilityClasses.push('max-md:hidden');

    return (
        <div
            className={visibilityClasses.join(' ')}
            data-module-id={module.id}
            data-module-type={module.type}
        >
            <ModuleComponent
                config={module.config}
                styling={module.styling}
                sectionSettings={sectionSettings}
            />
        </div>
    );
}
