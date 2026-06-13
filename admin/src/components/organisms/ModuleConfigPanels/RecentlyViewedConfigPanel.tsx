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
import { ColorPicker } from '@/components/atoms';
import { COMMON_FONTS } from '@/utils/fonts';

export interface RecentlyViewedConfig {
    titleTypography?: {
        fontFamily?: string;
        fontSize?: number;
        color?: string;
        alignment?: 'left' | 'center' | 'right';
    };
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
    titleTypography: {
        fontFamily: '',
        fontSize: 28,
        color: '#111827',
        alignment: 'left',
    },
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

    const handleTitleTypographyChange = (key: string, value: any) => {
        onChange({
            ...config,
            titleTypography: {
                ...(config.titleTypography || {}),
                [key]: value,
            },
        });
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

            <Typography variant="subtitle2" fontWeight={600}>
                Title Typography
            </Typography>

            <FormControl fullWidth>
                <InputLabel>Title Font Family</InputLabel>
                <Select
                    value={config.titleTypography?.fontFamily || ''}
                    label="Title Font Family"
                    onChange={(e) => handleTitleTypographyChange('fontFamily', e.target.value)}
                >
                    {COMMON_FONTS.map((font) => (
                        <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                            {font.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Title Font Size (px)"
                type="number"
                value={config.titleTypography?.fontSize ?? 28}
                onChange={(e) => handleTitleTypographyChange('fontSize', parseInt(e.target.value, 10) || 28)}
                inputProps={{ min: 12, max: 80 }}
                fullWidth
            />

            <ColorPicker
                label="Title Color"
                value={config.titleTypography?.color || '#111827'}
                onChange={(color) => handleTitleTypographyChange('color', color)}
            />

            <FormControl fullWidth>
                <InputLabel>Title Alignment</InputLabel>
                <Select
                    value={config.titleTypography?.alignment || 'left'}
                    label="Title Alignment"
                    onChange={(e) => handleTitleTypographyChange('alignment', e.target.value)}
                >
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                </Select>
            </FormControl>

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
