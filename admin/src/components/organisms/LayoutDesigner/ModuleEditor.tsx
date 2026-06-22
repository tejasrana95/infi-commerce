'use client';

import { Box, Typography, Divider, IconButton, Tabs, Tab } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import { LayoutModule, ModuleType } from '@/types';
import { getModuleDefinition } from './types';

// Shared module config panel renderer
import { renderModuleConfigPanel } from '@/components/organisms/ModuleConfigPanels/renderModuleConfigPanel';
import {
    ModuleStylingTab,
} from '@/components/organisms/ModuleConfigPanels';

interface ModuleEditorProps {
    module: LayoutModule;
    onChange: (module: LayoutModule) => void;
    onDelete: () => void;
    storeId?: string | any;
}

export default function ModuleEditor({ module, onChange, onDelete, storeId }: ModuleEditorProps) {
    const [tab, setTab] = useState(0);
    const definition = getModuleDefinition(module.type);

    // Check if module is removable - defaults to true unless explicitly false or is a placeholder
    const isRemovable = module.isRemovable !== false && definition?.category !== 'placeholder';

    // Ensure storeId is a string if it's populated
    const effectiveStoreId = typeof storeId === 'object' && storeId !== null ? storeId._id : storeId;

    const updateConfig = (config: Record<string, any>) => {
        onChange({ ...module, config });
    };

    const updateStyling = (key: string, value: any) => {
        onChange({
            ...module,
            styling: { ...module.styling, [key]: value },
        });
    };

    const renderConfigPanel = () => {
        return renderModuleConfigPanel({
            module,
            onChange,
            updateConfig: (config) => onChange({ ...module, config }),
            storeId: effectiveStoreId,
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                    {definition?.label || module.type}
                </Typography>
                {isRemovable && (
                    <IconButton size="small" color="error" onClick={onDelete}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                <Tab label="Content" />
                <Tab label="Styling" />
            </Tabs>



            {tab === 0 && (
                <Box>
                    {renderConfigPanel()}
                </Box>
            )}

            {tab === 1 && (
                <ModuleStylingTab styling={module.styling} onChange={updateStyling} />
            )}
        </Box>
    );
}
