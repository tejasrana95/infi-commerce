/**
 * Shared renderer for module config panels using the config panel registry.
 *
 * Used by both:
 * - ModuleEditor (top-level module editing via properties modal)
 * - SectionLayoutConfigPanel (nested module editing inside section-layout)
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { LayoutModule } from '@/types';
import { configPanelRegistry } from './configPanelRegistry';
import { getModuleDefinition } from '../LayoutDesigner/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RenderModuleConfigPanelOptions {
    module: LayoutModule;
    /** Called with the full updated module (used by pass-through editors like IconConfigPanel) */
    onChange: (module: LayoutModule) => void;
    /** Called with new config to merge into module.config */
    updateConfig: (config: Record<string, any>) => void;
    storeId?: string;
}

export function renderModuleConfigPanel({
    module,
    onChange,
    updateConfig,
    storeId,
}: RenderModuleConfigPanelOptions): React.ReactNode {
    const Panel = configPanelRegistry[module.type];

    if (Panel) {
        return (
            <Panel
                config={module.config as any}
                module={module}
                onChange={(value: any) => {
                    // If the panel returns a full module object (pass-through), use onChange
                    // Otherwise use updateConfig (standard config panels)
                    if (value && typeof value === 'object' && 'type' in value && 'config' in value) {
                        onChange(value);
                    } else {
                        updateConfig(value);
                    }
                }}
                storeId={storeId}
            />
        );
    }

    // Placeholder / page content modules
    const placeholderTypes = [
        'category-products', 'product-details', 'cart-details',
        'account-sidebar', 'account-dashboard', 'search-results', 'blog-content',
    ];

    if (placeholderTypes.includes(module.type)) {
        const def = getModuleDefinition(module.type);
        return (
            <Box>
                <Typography variant="body2" color="primary" gutterBottom>
                    This is a required page content module.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {def?.description}
                </Typography>
            </Box>
        );
    }

    return (
        <Typography variant="body2" color="text.secondary">
            Configuration coming soon for {module.type}.
        </Typography>
    );
}

/* eslint-enable @typescript-eslint/no-explicit-any */
