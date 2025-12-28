'use client';

import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    TextField,
    Typography,
} from '@mui/material';

export interface PageHeroConfig {
    showTitle?: boolean;
    showBreadcrumbs?: boolean;
    height?: 'auto' | 'small' | 'medium' | 'large';
    alignment?: 'left' | 'center' | 'right';
    containerWidth?: 'narrow' | 'medium' | 'full';
    customTitle?: string;
    customFeaturedImage?: string;
}

interface PageHeroConfigPanelProps {
    config: PageHeroConfig;
    onChange: (config: PageHeroConfig) => void;
}

export function PageHeroConfigPanel({ config, onChange }: PageHeroConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="caption" color="text.secondary">
                💡 Hero section pulls title and image from the page by default.
            </Typography>

            <FormControl fullWidth size="small">
                <InputLabel>Hero Height</InputLabel>
                <Select
                    value={config.height || 'medium'}
                    label="Hero Height"
                    onChange={(e) => handleChange('height', e.target.value)}
                >
                    <MenuItem value="auto">Auto (Compact)</MenuItem>
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth size="small">
                <InputLabel>Content Alignment</InputLabel>
                <Select
                    value={config.alignment || 'left'}
                    label="Content Alignment"
                    onChange={(e) => handleChange('alignment', e.target.value)}
                >
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth size="small">
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

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                    control={<Switch checked={config.showTitle ?? true} onChange={(e) => handleChange('showTitle', e.target.checked)} />}
                    label="Show Page Title"
                />
                <FormControlLabel
                    control={<Switch checked={config.showBreadcrumbs ?? true} onChange={(e) => handleChange('showBreadcrumbs', e.target.checked)} />}
                    label="Show Breadcrumbs"
                />
            </Box>

            <TextField
                fullWidth
                size="small"
                label="Custom Title Override"
                value={config.customTitle || ''}
                onChange={(e) => handleChange('customTitle', e.target.value)}
                placeholder="Leave empty to use page title"
            />

            <TextField
                fullWidth
                size="small"
                label="Custom Image URL"
                value={config.customFeaturedImage || ''}
                onChange={(e) => handleChange('customFeaturedImage', e.target.value)}
                placeholder="Leave empty to use featured image"
            />
        </Box>
    );
}
