'use client';

import { useState, useEffect, useCallback } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Avatar } from '@mui/material';
import api from '@/lib/api';

export interface ProductOption {
    _id: string;
    name: string;
    sku: string;
    price: number;
    salePrice?: number;
    images?: string[];
    stock?: number;
    weight?: number;
    type?: 'simple' | 'variable' | 'digital';
    variants?: Array<{
        _id: string;
        sku: string;
        price?: number;
        salePrice?: number;
        attributes?: Record<string, string>;
        stock?: number;
        weight?: number;
    }>;
}

interface ProductAutoCompleteProps {
    storeId: string;
    value?: ProductOption | null;
    onChange: (value: ProductOption | null) => void;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    size?: 'small' | 'medium';
    excludeIds?: string[];
}

export default function ProductAutoComplete({
    storeId,
    value,
    onChange,
    label = 'Search Product',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder = 'Type to search products...',
    size = 'medium',
    excludeIds = [],
}: ProductAutoCompleteProps) {
    const [options, setOptions] = useState<ProductOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const searchProducts = useCallback(async (query: string) => {
        if (!storeId || query.length < 2) {
            setOptions([]);
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/products', {
                params: { search: query, storeId, limit: 15 }
            });
            const products = response.data.products || response.data.data || [];

            // Filter out excluded products
            const filtered = products.filter((p: ProductOption) => !excludeIds.includes(p._id));
            setOptions(filtered);
        } catch (error) {
            console.error('Failed to search products:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [storeId, excludeIds]);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchProducts(inputValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [inputValue, searchProducts]);

    return (
        <Autocomplete
            value={value}
            onChange={(_, newValue) => onChange(newValue)}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
            options={options}
            loading={loading}
            disabled={disabled || !storeId}
            getOptionLabel={(option) => `${option.name} (${option.sku})`}
            isOptionEqualToValue={(option, value) => option._id === value?._id}
            filterOptions={(x) => x} // Disable client-side filtering, rely on server
            renderOption={(props, option) => (
                <Box component="li" {...props} key={option._id}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                        <Avatar
                            src={option.images?.[0]}
                            variant="rounded"
                            sx={{ width: 40, height: 40 }}
                        >
                            {option.name.charAt(0)}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                            <Typography variant="body2" fontWeight={500} noWrap>
                                {option.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                SKU: {option.sku} | ${option.salePrice || option.price}
                                {option.stock !== undefined && ` | Stock: ${option.stock}`}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={error}
                    helperText={helperText || (!storeId ? 'Please select a store first' : '')}
                    required={required}
                    placeholder={placeholder}
                    size={size}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
}
