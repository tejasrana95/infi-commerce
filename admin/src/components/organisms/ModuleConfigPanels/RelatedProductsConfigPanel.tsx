'use client';

import { useState, useEffect } from 'react';
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
import ProductAutoComplete, { ProductOption } from '@/components/molecules/ProductAutoComplete';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';
import api from '@/lib/api';

export interface RelatedProductsConfig {
    titleTypography?: {
        fontFamily?: string;
        fontSize?: number;
        color?: string;
        alignment?: 'left' | 'center' | 'right';
    };
    title?: string;
    source?: 'category' | 'tags' | 'manual';
    limit?: number;
    columns?: number;
    layout?: 'carousel' | 'grid';
    showRating?: boolean;
    autoplay?: boolean;
    categoryIds?: string[];
    productIds?: string[];
}

const COMMON_FONTS = [
    { label: 'Default', value: '' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Open Sans', value: '"Open Sans", sans-serif' },
    { label: 'Lato', value: 'Lato, sans-serif' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif' },
    { label: 'Playfair Display', value: '"Playfair Display", serif' },
    { label: 'Merriweather', value: 'Merriweather, serif' },
];

interface RelatedProductsConfigPanelProps {
    config: RelatedProductsConfig;
    onChange: (config: RelatedProductsConfig) => void;
    storeId?: string;
}

export const defaultRelatedProductsConfig: RelatedProductsConfig = {
    title: 'You May Also Like',
    titleTypography: {
        fontFamily: '',
        fontSize: 28,
        color: '#111827',
        alignment: 'left',
    },
    source: 'category',
    limit: 8,
    columns: 4,
    layout: 'carousel',
    showRating: true,
    autoplay: false,
};

export default function RelatedProductsConfigPanel({
    config,
    onChange,
    storeId
}: RelatedProductsConfigPanelProps) {
    const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Hydrate selected products from IDs for manual source
    useEffect(() => {
        if (config.source === 'manual' && config.productIds?.length && selectedProducts.length === 0) {
            fetchProducts();
        }
    }, [config.source, config.productIds]);

    const fetchProducts = async () => {
        if (!config.productIds?.length || !storeId) return;

        setLoadingProducts(true);
        try {
            const response = await api.get('/products', {
                params: {
                    storeId,
                    ids: config.productIds.join(','),
                    limit: config.productIds.length
                }
            });
            const products = response.data.products || response.data.data || [];
            setSelectedProducts(products);
        } catch (error) {
            console.error('Failed to fetch selected products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleChange = (key: string, value: any) => {
        const newConfig = { ...config, [key]: value };

        // Reset related fields when source changes
        if (key === 'source') {
            if (value !== 'category') newConfig.categoryIds = [];
            if (value !== 'manual') newConfig.productIds = [];
        }

        onChange(newConfig);
    };

    const handleProductChange = (prod: ProductOption[] | ProductOption | null) => {
        const products = Array.isArray(prod) ? prod : (prod ? [prod] : []);
        setSelectedProducts(products);
        onChange({ ...config, productIds: products.map(p => p._id) });
    };

    const handleCategoryChange = (ids: string[] | string | null) => {
        const categoryIds = Array.isArray(ids) ? ids : (ids ? [ids] : []);
        onChange({ ...config, categoryIds });
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
                placeholder="e.g., You May Also Like"
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

            <FormControl fullWidth>
                <InputLabel>Product Source</InputLabel>
                <Select
                    value={config.source || 'category'}
                    label="Product Source"
                    onChange={(e) => handleChange('source', e.target.value)}
                >
                    <MenuItem value="category">Related by Category</MenuItem>
                    <MenuItem value="tags">Related by Tags</MenuItem>
                    <MenuItem value="manual">Manual Selection</MenuItem>
                </Select>
            </FormControl>

            <TextField
                label="Product Limit"
                type="number"
                value={config.limit || 8}
                onChange={(e) => handleChange('limit', parseInt(e.target.value) || 8)}
                helperText="Number of products to display"
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

            {config.source === 'category' && (
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Override Categories (optional - uses current product&apos;s category by default)
                    </Typography>
                    <CategoryAutocomplete
                        value={config.categoryIds || []}
                        onChange={handleCategoryChange}
                        storeId={storeId}
                        label="Select Categories"
                        multiple
                    />
                </Box>
            )}

            {config.source === 'manual' && (
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Select Specific Products
                    </Typography>
                    <ProductAutoComplete
                        value={selectedProducts}
                        onChange={handleProductChange}
                        storeId={storeId || ''}
                        label="Select Products"
                        multiple
                    />
                </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                💡 Tip: When source is &quot;Related by Category&quot; or &quot;Related by Tags&quot;, products are
                automatically fetched based on the current product&apos;s context.
            </Typography>
        </Box>
    );
}
