'use client';

import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Typography,
} from '@mui/material';

export interface PageContentConfig {
    showTitle?: boolean;
    showBreadcrumbs?: boolean;
    containerWidth?: 'narrow' | 'medium' | 'full';
}

interface PageContentConfigPanelProps {
    config: PageContentConfig;
    onChange: (config: PageContentConfig) => void;
}

export const defaultPageContentConfig: PageContentConfig = {
    showTitle: true,
    showBreadcrumbs: true,
    containerWidth: 'medium',
};

export function PageContentConfigPanel({ config, onChange }: PageContentConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
                💡 Page content is automatically pulled from the current static page.
            </Typography>

            <FormControl fullWidth>
                <InputLabel>Container Width</InputLabel>
                <Select
                    value={config.containerWidth || 'medium'}
                    label="Container Width"
                    onChange={(e) => handleChange('containerWidth', e.target.value)}
                >
                    <MenuItem value="narrow">Narrow (800px)</MenuItem>
                    <MenuItem value="medium">Medium (1200px)</MenuItem>
                    <MenuItem value="full">Full Width</MenuItem>
                </Select>
            </FormControl>

            <FormControlLabel
                control={<Switch checked={config.showTitle ?? true} onChange={(e) => handleChange('showTitle', e.target.checked)} />}
                label="Show Page Title"
            />

            <FormControlLabel
                control={<Switch checked={config.showBreadcrumbs ?? true} onChange={(e) => handleChange('showBreadcrumbs', e.target.checked)} />}
                label="Show Breadcrumbs"
            />
        </Box>
    );
}
