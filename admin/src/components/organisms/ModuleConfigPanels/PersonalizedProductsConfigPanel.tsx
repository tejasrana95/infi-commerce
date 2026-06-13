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
    Divider,
    Alert,
} from '@mui/material';
import { ColorPicker } from '@/components/atoms';
import { COMMON_FONTS } from '@/utils/fonts';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export interface PersonalizedProductsConfig {
    titleTypography?: {
        fontFamily?: string;
        fontSize?: number;
        color?: string;
        alignment?: 'left' | 'center' | 'right';
    };
    title?: string;
    subtitle?: string;
    limit?: number;
    columns?: { desktop: number; tablet: number; mobile: number } | number;
    layout?: 'carousel' | 'grid';
    exclusionScope?: 'product' | 'category';
    exclusionDays?: number;
    retentionDays?: number;
    fallback?: 'trending' | 'featured' | 'latest' | 'sale';
    showRating?: boolean;
    showPrice?: boolean;
    autoplay?: boolean;
}


interface PersonalizedProductsConfigPanelProps {
    config: PersonalizedProductsConfig;
    onChange: (config: PersonalizedProductsConfig) => void;
    storeId?: string;
}

export const defaultPersonalizedProductsConfig: PersonalizedProductsConfig = {
    title: 'Recommended For You',
    subtitle: '',
    titleTypography: {
        fontFamily: '',
        fontSize: 28,
        color: '#1a1a1a',
        alignment: 'left',
    },
    limit: 8,
    columns: { desktop: 4, tablet: 3, mobile: 2 },
    layout: 'grid',
    exclusionScope: 'category',
    exclusionDays: 30,
    retentionDays: 30,
    fallback: 'featured',
    showRating: true,
    showPrice: true,
    autoplay: false,
};

export default function PersonalizedProductsConfigPanel({
    config,
    onChange,
}: PersonalizedProductsConfigPanelProps) {

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

    // Get columns value (normalize object to number for display)
    const columnsValue = typeof config.columns === 'object'
        ? config.columns?.desktop || 4
        : config.columns || 4;

    const handleColumnsChange = (value: number) => {
        // Store as responsive object
        onChange({
            ...config,
            columns: {
                desktop: value,
                tablet: Math.max(2, value - 1),
                mobile: 2,
            },
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ mb: 1 }}>
                Shows personalized product recommendations based on user browsing history.
            </Alert>

            {/* Title and Subtitle */}
            <TextField
                label="Module Title"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Recommended For You"
                fullWidth
            />

            <TextField
                label="Subtitle (optional)"
                value={config.subtitle || ''}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                placeholder="e.g., Products you might like"
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
                    {COMMON_FONTS.map(font => (
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
                value={config.titleTypography?.color || '#1a1a1a'}
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

            <Divider sx={{ my: 1 }} />

            {/* Display Settings */}
            <Typography variant="subtitle2" fontWeight={600}>
                Display Settings
            </Typography>

            <TextField
                label="Number of Products"
                type="number"
                value={config.limit || 8}
                onChange={(e) => handleChange('limit', parseInt(e.target.value) || 8)}
                helperText="How many products to display (4-20)"
                inputProps={{ min: 4, max: 20 }}
                fullWidth
            />

            <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                    Columns (Desktop): {columnsValue}
                </Typography>
                <Slider
                    value={columnsValue}
                    onChange={(_, value) => handleColumnsChange(value as number)}
                    min={2}
                    max={6}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="text.secondary">
                    Tablet: {Math.max(2, columnsValue - 1)} cols | Mobile: 2 cols
                </Typography>
            </Box>

            <FormControl fullWidth>
                <InputLabel>Layout Style</InputLabel>
                <Select
                    value={config.layout || 'grid'}
                    label="Layout Style"
                    onChange={(e) => handleChange('layout', e.target.value)}
                >
                    <MenuItem value="grid">Grid</MenuItem>
                    <MenuItem value="carousel">Carousel (Horizontal Scroll)</MenuItem>
                </Select>
            </FormControl>

            {config.layout === 'carousel' && (
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.autoplay ?? false}
                            onChange={(e) => handleChange('autoplay', e.target.checked)}
                        />
                    }
                    label="Autoplay Carousel"
                />
            )}

            <Divider sx={{ my: 1 }} />

            {/* Personalization Settings */}
            <Typography variant="subtitle2" fontWeight={600}>
                Personalization Settings
            </Typography>

            <FormControl fullWidth>
                <InputLabel>Exclusion Scope</InputLabel>
                <Select
                    value={config.exclusionScope || 'category'}
                    label="Exclusion Scope"
                    onChange={(e) => handleChange('exclusionScope', e.target.value)}
                >
                    <MenuItem value="product">Exclude Purchased Product Only</MenuItem>
                    <MenuItem value="category">Exclude Entire Category</MenuItem>
                </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
                After purchase: hide just that product or the whole category?
            </Typography>

            <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                    Exclusion Period: {config.exclusionDays || 30} days
                </Typography>
                <Slider
                    value={config.exclusionDays || 30}
                    onChange={(_, value) => handleChange('exclusionDays', value)}
                    min={1}
                    max={90}
                    step={1}
                    valueLabelDisplay="auto"
                    marks={[
                        { value: 7, label: '7d' },
                        { value: 30, label: '30d' },
                        { value: 60, label: '60d' },
                        { value: 90, label: '90d' },
                    ]}
                />
                <Typography variant="caption" color="text.secondary">
                    How long to hide purchased products/categories from recommendations
                </Typography>
            </Box>

            <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                    Data Retention: {config.retentionDays || 30} days
                </Typography>
                <Slider
                    value={config.retentionDays || 30}
                    onChange={(_, value) => handleChange('retentionDays', value)}
                    min={1}
                    max={90}
                    step={1}
                    valueLabelDisplay="auto"
                    marks={[
                        { value: 7, label: '7d' },
                        { value: 30, label: '30d' },
                        { value: 60, label: '60d' },
                        { value: 90, label: '90d' },
                    ]}
                />
                <Typography variant="caption" color="text.secondary">
                    How long to remember user browsing history
                </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Fallback Settings */}
            <Typography variant="subtitle2" fontWeight={600}>
                Fallback (No History)
            </Typography>

            <FormControl fullWidth>
                <InputLabel>Fallback Products</InputLabel>
                <Select
                    value={config.fallback || 'featured'}
                    label="Fallback Products"
                    onChange={(e) => handleChange('fallback', e.target.value)}
                >
                    <MenuItem value="featured">Featured Products</MenuItem>
                    <MenuItem value="trending">Trending (Best Sellers)</MenuItem>
                    <MenuItem value="latest">Latest (New Arrivals)</MenuItem>
                    <MenuItem value="sale">On Sale</MenuItem>
                </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
                What to show when the user has no browsing history
            </Typography>
        </Box>
    );
}
