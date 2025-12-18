import React from 'react';

// Import Modern Clean Components
import ModernCleanHeader from './modern-clean/Header';

// Import Classic Elegance Components
import ClassicEleganceHeader from './classic-elegance/Header';

// Component Map
const TEMPLATE_COMPONENTS: Record<string, Record<string, React.ComponentType<any>>> = {
    'modern-clean': {
        'Header': ModernCleanHeader,
        // Add other components here
    },
    'classic-elegance': {
        'Header': ClassicEleganceHeader,
    }
};

// Fallback (Core) Components
// import CoreHeader from '../core/Header'; 
// For now, if no core component, we can return null or a placeholder
const CORE_COMPONENTS: Record<string, React.ComponentType<any>> = {
    'Header': () => <div className="p-4 bg-gray-100 border-b">Core Header (Fallback)</div>
};

export function getComponent(componentName: string, templateId: string): React.ComponentType<any> {
    const template = TEMPLATE_COMPONENTS[templateId];

    if (template && template[componentName]) {
        return template[componentName];
    }

    if (CORE_COMPONENTS[componentName]) {
        return CORE_COMPONENTS[componentName];
    }

    return () => <div className="text-red-500">Component "{componentName}" not found for template "{templateId}"</div>;
}
