'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, InputLabel, FormControl, TextField } from '@mui/material';
import { ColorPicker } from '@/components/atoms';
import ProductAutoComplete, { ProductOption } from '@/components/molecules/ProductAutoComplete';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';
import api from '@/lib/api';

interface ProductCollectionConfigPanelProps {
    config: {
        source?: 'new-arrivals' | 'best-sellers' | 'most-viewed' | 'category' | 'custom';
        title?: string;
        titleTypography?: {
            fontFamily?: string;
            fontSize?: number;
            color?: string;
            alignment?: 'left' | 'center' | 'right';
        };
        limit?: number;
        categoryIds?: string[];
        productIds?: string[];
        [key: string]: any;
    };
    onChange: (config: any) => void;
    storeId?: string;
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

export default function ProductCollectionConfigPanel({ config, onChange, storeId }: ProductCollectionConfigPanelProps) {
    const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Hydrate selected products from IDs
    useEffect(() => {
        if (config.source === 'custom' && config.productIds?.length && selectedProducts.length === 0) {
            fetchProducts();
        }
    }, [config.source, config.productIds]);

    const fetchProducts = async () => {
        if (!config.productIds?.length || !storeId) return;

        setLoadingProducts(true);
        try {
            // Fetch products by IDs
            // Assuming backend supports filtering by multiple IDs or we might need to adjust
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
            if (value !== 'custom') newConfig.productIds = [];
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
                placeholder="e.g., New Arrivals"
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
                    value={config.source || 'new-arrivals'}
                    label="Product Source"
                    onChange={(e) => handleChange('source', e.target.value)}
                >
                    <MenuItem value="new-arrivals">New Arrivals</MenuItem>
                    <MenuItem value="best-sellers">Best Sellers</MenuItem>
                    <MenuItem value="most-viewed">Most Viewed</MenuItem>
                    <MenuItem value="category">Category Products</MenuItem>
                    <MenuItem value="custom">Custom Selection</MenuItem>
                </Select>
            </FormControl>

            <TextField
                label="Product Limit"
                type="number"
                value={config.limit || 8}
                onChange={(e) => handleChange('limit', parseInt(e.target.value) || 8)}
                helperText="Number of products to display"
                fullWidth
            />

            {config.source === 'category' && (
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Select Source Categories
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

            {config.source === 'custom' && (
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
        </Box>
    );
}
