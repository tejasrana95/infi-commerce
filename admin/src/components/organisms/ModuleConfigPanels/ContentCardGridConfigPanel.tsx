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
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface ContentCardGridConfig {
    title?: string;
    categoryId?: string;
    limit?: number;
    sortBy?: 'latest' | 'oldest' | 'title-asc' | 'title-desc';
    gridColumns?: 1 | 2 | 3 | 4;
    direction?: 'vertical' | 'horizontal';
    variant?: 'default' | 'compact' | 'minimal';
    gap?: number;
    showImage?: boolean;
    showIcon?: boolean;
    showExcerpt?: boolean;
    showMetadata?: boolean;
    showValue?: boolean;
    showTags?: boolean;
    showButtons?: boolean;
}

interface ContentCardGridConfigPanelProps {
    config: ContentCardGridConfig;
    onChange: (config: ContentCardGridConfig) => void;
}

export const defaultContentCardGridConfig: ContentCardGridConfig = {
    title: 'Content Cards',
    categoryId: '',
    limit: 6,
    sortBy: 'latest',
    gridColumns: 3,
    direction: 'vertical',
    variant: 'default',
    gap: 3,
    showImage: true,
    showIcon: true,
    showExcerpt: true,
    showMetadata: true,
    showValue: true,
    showTags: true,
    showButtons: true,
};

export default function ContentCardGridConfigPanel({ config, onChange }: ContentCardGridConfigPanelProps) {
    const [categories, setCategories] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await api.get('/content-cards/categories', {
                params: { isActive: true }
            });
            setCategories(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch content card categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Module Title"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Featured Jobs, Latest Events"
                fullWidth
            />

            <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                    value={config.categoryId || ''}
                    label="Category"
                    onChange={(e) => handleChange('categoryId', e.target.value)}
                    disabled={loadingCategories}
                >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((cat) => (
                        <MenuItem key={cat._id} value={cat._id}>
                            {cat.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Max Items"
                type="number"
                value={config.limit || 6}
                onChange={(e) => handleChange('limit', parseInt(e.target.value) || 6)}
                inputProps={{ min: 1, max: 50 }}
                fullWidth
            />

            <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                    value={config.sortBy || 'latest'}
                    label="Sort By"
                    onChange={(e) => handleChange('sortBy', e.target.value)}
                >
                    <MenuItem value="latest">Latest First</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                    <MenuItem value="title-asc">Title (A-Z)</MenuItem>
                    <MenuItem value="title-desc">Title (Z-A)</MenuItem>
                </Select>
            </FormControl>

            <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                    Grid Columns: {config.gridColumns || 3}
                </Typography>
                <Slider
                    value={config.gridColumns || 3}
                    onChange={(_, value) => handleChange('gridColumns', value)}
                    min={1}
                    max={4}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                />
            </Box>

            <FormControl fullWidth>
                <InputLabel>Direction</InputLabel>
                <Select
                    value={config.direction || 'vertical'}
                    label="Direction"
                    onChange={(e) => handleChange('direction', e.target.value)}
                >
                    <MenuItem value="vertical">Vertical (Stacked)</MenuItem>
                    <MenuItem value="horizontal">Horizontal (Side-by-side)</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel>Variant</InputLabel>
                <Select
                    value={config.variant || 'default'}
                    label="Variant"
                    onChange={(e) => handleChange('variant', e.target.value)}
                >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="compact">Compact</MenuItem>
                    <MenuItem value="minimal">Minimal</MenuItem>
                </Select>
            </FormControl>

            <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                    Gap Size: {config.gap || 3}
                </Typography>
                <Slider
                    value={config.gap || 3}
                    onChange={(_, value) => handleChange('gap', value)}
                    min={1}
                    max={6}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                />
            </Box>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>Display Options</Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                    control={<Switch checked={config.showImage ?? true} onChange={(e) => handleChange('showImage', e.target.checked)} />}
                    label="Show Image"
                />
                <FormControlLabel
                    control={<Switch checked={config.showIcon ?? true} onChange={(e) => handleChange('showIcon', e.target.checked)} />}
                    label="Show Icon"
                />
                <FormControlLabel
                    control={<Switch checked={config.showExcerpt ?? true} onChange={(e) => handleChange('showExcerpt', e.target.checked)} />}
                    label="Show Excerpt"
                />
                <FormControlLabel
                    control={<Switch checked={config.showMetadata ?? true} onChange={(e) => handleChange('showMetadata', e.target.checked)} />}
                    label="Show Metadata"
                />
                <FormControlLabel
                    control={<Switch checked={config.showValue ?? true} onChange={(e) => handleChange('showValue', e.target.checked)} />}
                    label="Show Value"
                />
                <FormControlLabel
                    control={<Switch checked={config.showTags ?? true} onChange={(e) => handleChange('showTags', e.target.checked)} />}
                    label="Show Tags"
                />
                <FormControlLabel
                    control={<Switch checked={config.showButtons ?? true} onChange={(e) => handleChange('showButtons', e.target.checked)} />}
                    label="Show Buttons"
                />
            </Box>
        </Box>
    );
}
