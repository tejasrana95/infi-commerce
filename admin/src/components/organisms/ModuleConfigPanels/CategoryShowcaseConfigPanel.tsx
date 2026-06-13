'use client';

import { Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Slider, Checkbox } from '@mui/material';
import { ColorPicker } from '@/components/atoms';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';
import { COMMON_FONTS } from '@/utils/fonts';

interface CategoryShowcaseConfig {
    categoryIds?: string[];
    title?: string;
    titleTypography?: {
        fontFamily?: string;
        fontSize?: number;
        color?: string;
        alignment?: 'left' | 'center' | 'right';
    };
    layout?: 'grid' | 'carousel';
    columns?: number;
    gap?: number;
    showDescription?: boolean;
    showAllCollections?: boolean;
    allCollectionsLabel?: string;
    labelColor?: string;
    style?: 'card' | 'banner' | 'minimal' | 'overlay';
}

interface CategoryShowcaseConfigPanelProps {
    config: CategoryShowcaseConfig;
    onChange: (config: CategoryShowcaseConfig) => void;
    storeId?: string;
}


export default function CategoryShowcaseConfigPanel({ config, onChange, storeId }: CategoryShowcaseConfigPanelProps) {
    const handleChange = <Key extends keyof CategoryShowcaseConfig>(key: Key, value: CategoryShowcaseConfig[Key]) => {
        onChange({ ...config, [key]: value });
    };

    const handleCategoryChange = (ids: string[] | string | null) => {
        const categoryIds = Array.isArray(ids) ? ids : (ids ? [ids] : []);
        onChange({ ...config, categoryIds });
    };

    const handleTitleTypographyChange = <Key extends keyof NonNullable<CategoryShowcaseConfig['titleTypography']>>(
        key: Key,
        value: NonNullable<CategoryShowcaseConfig['titleTypography']>[Key]
    ) => {
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
                placeholder="e.g., Shop by Category"
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
                value={config.titleTypography?.fontSize ?? 32}
                onChange={(e) => handleTitleTypographyChange('fontSize', parseInt(e.target.value, 10) || 32)}
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

            <Typography variant="body2" color="text.secondary">
                Select specific categories to showcase.
            </Typography>

            <CategoryAutocomplete
                value={config.categoryIds || []}
                onChange={handleCategoryChange}
                storeId={storeId}
                label="Select Categories"
                multiple
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={config.showAllCollections ?? false}
                        onChange={(e) => handleChange('showAllCollections', e.target.checked)}
                    />
                }
                label="Add All Collections"
            />

            {config.showAllCollections && (
                <TextField
                    label="All Collections Label"
                    value={config.allCollectionsLabel || 'All Collections'}
                    onChange={(e) => handleChange('allCollectionsLabel', e.target.value)}
                    fullWidth
                />
            )}

            <ColorPicker
                label="Category Label Color"
                value={config.labelColor || '#111827'}
                onChange={(color) => handleChange('labelColor', color)}
            />

            <FormControl fullWidth>
                <InputLabel>Layout</InputLabel>
                <Select
                    value={config.layout || 'grid'}
                    label="Layout"
                    onChange={(e) => handleChange('layout', e.target.value)}
                >
                    <MenuItem value="grid">Grid</MenuItem>
                    <MenuItem value="carousel">Carousel</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel>Card Style</InputLabel>
                <Select
                    value={config.style || 'card'}
                    label="Card Style"
                    onChange={(e) => handleChange('style', e.target.value)}
                >
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="banner">Banner</MenuItem>
                    <MenuItem value="minimal">Minimal</MenuItem>
                    <MenuItem value="overlay">Overlay</MenuItem>
                </Select>
            </FormControl>

            <Box>
                <Typography gutterBottom>
                    Columns: {config.columns || 4}
                </Typography>
                <Slider
                    value={config.columns || 4}
                    onChange={(_, value) => handleChange('columns', value)}
                    min={2}
                    max={12}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                />
            </Box>

            <Box>
                <Typography gutterBottom>
                    Gap: {config.gap || 16}px
                </Typography>
                <Slider
                    value={config.gap || 16}
                    onChange={(_, value) => handleChange('gap', value)}
                    min={8}
                    max={48}
                    step={4}
                    valueLabelDisplay="auto"
                />
            </Box>

            <FormControlLabel
                control={
                    <Switch
                        checked={config.showDescription ?? true}
                        onChange={(e) => handleChange('showDescription', e.target.checked)}
                    />
                }
                label="Show Description"
            />
        </Box>
    );
}
