'use client';

import { Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Slider } from '@mui/material';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';

interface CategoryShowcaseConfigPanelProps {
    config: {
        categoryIds?: string[];
        title?: string;
        layout?: 'grid' | 'carousel';
        columns?: number;
        gap?: number;
        showDescription?: boolean;
        style?: 'card' | 'banner' | 'minimal' | 'overlay';
        [key: string]: any;
    };
    onChange: (config: any) => void;
    storeId?: string;
}

export default function CategoryShowcaseConfigPanel({ config, onChange, storeId }: CategoryShowcaseConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const handleCategoryChange = (ids: string[] | string | null) => {
        const categoryIds = Array.isArray(ids) ? ids : (ids ? [ids] : []);
        onChange({ ...config, categoryIds });
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
                    max={6}
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
