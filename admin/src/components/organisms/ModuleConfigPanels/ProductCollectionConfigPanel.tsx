'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, InputLabel, FormControl, TextField } from '@mui/material';
import ProductAutoComplete, { ProductOption } from '@/components/molecules/ProductAutoComplete';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';
import api from '@/lib/api';

interface ProductCollectionConfigPanelProps {
    config: {
        source?: 'new-arrivals' | 'best-sellers' | 'most-viewed' | 'category' | 'custom';
        title?: string;
        limit?: number;
        categoryIds?: string[];
        productIds?: string[];
        [key: string]: any;
    };
    onChange: (config: any) => void;
    storeId?: string;
}

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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Module Title"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., New Arrivals"
                fullWidth
            />

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
