'use client';

import {
    Box,
    Typography,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    TextField,
    Slider,
    FormControlLabel,
    Switch,
} from '@mui/material';

export interface RecentlyViewedConfig {
    title?: string;
    limit?: number;
    columns?: number;
    layout?: 'carousel' | 'grid';
    showRating?: boolean;
}

interface RecentlyViewedConfigPanelProps {
    config: RecentlyViewedConfig;
    onChange: (config: RecentlyViewedConfig) => void;
    storeId?: string;
}

export const defaultRecentlyViewedConfig: RecentlyViewedConfig = {
    title: 'Recently Viewed',
    limit: 8,
    columns: 4,
    layout: 'carousel',
    showRating: true,
};

export default function RecentlyViewedConfigPanel({
    config,
    onChange,
}: RecentlyViewedConfigPanelProps) {

    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Module Title"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Recently Viewed"
                fullWidth
            />

            <TextField
                label="Product Limit"
                type="number"
                value={config.limit || 8}
                onChange={(e) => handleChange('limit', parseInt(e.target.value) || 8)}
                helperText="Maximum products to show from browsing history"
                inputProps={{ min: 1, max: 24 }}
                fullWidth
            />

            <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                    Columns: {config.columns || 4}
                </Typography>
                <Slider
                    value={config.columns || 4}
                    onChange={(_, value) => handleChange('columns', value)}
                    min={2}
                    max={6}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                />
            </Box>

            <FormControl fullWidth>
                <InputLabel>Layout Style</InputLabel>
                <Select
                    value={config.layout || 'carousel'}
                    label="Layout Style"
                    onChange={(e) => handleChange('layout', e.target.value)}
                >
                    <MenuItem value="carousel">Carousel (Horizontal Scroll)</MenuItem>
                    <MenuItem value="grid">Grid</MenuItem>
                </Select>
            </FormControl>

            <FormControlLabel
                control={
                    <Switch
                        checked={config.showRating ?? true}
                        onChange={(e) => handleChange('showRating', e.target.checked)}
                    />
                }
                label="Show Ratings"
            />

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                💡 This module displays products the customer has recently viewed.
                Products are stored in the browser&apos;s localStorage and automatically
                exclude the current product.
            </Typography>
        </Box>
    );
}
