'use client';

import { useState, useEffect, useCallback } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Avatar } from '@mui/material';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

export interface ProductOption {
    _id: string;
    name: string;
    slug: string;
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
    value?: ProductOption | ProductOption[] | null;
    onChange: (value: any) => void;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    size?: 'small' | 'medium';
    excludeIds?: string[];
    currency?: string; // Optional: currency code for price display
    multiple?: boolean;
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
    currency,
    multiple = false,
}: ProductAutoCompleteProps) {
    const [options, setOptions] = useState<ProductOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const { formatPrice, convertPrice, baseCurrency } = useCurrency();

    // Format and convert price based on selected currency
    const formatConvertedPrice = (amount: number) => {
        if (!currency || currency === baseCurrency?.code) {
            return formatPrice(amount);
        }
        const converted = convertPrice(amount, currency);
        return formatPrice(converted, currency);
    };

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

    // Fetch product by ID if value is just an ID or missing details
    useEffect(() => {
        if (!storeId || !value || multiple) return;

        const currentVal = value as ProductOption;
        if (currentVal._id && !currentVal.name) {
            const fetchProduct = async () => {
                try {
                    setLoading(true);
                    const response = await api.get(`/products/${currentVal._id}`);
                    // Backend returns { product: { ... } }
                    const product = response.data.product || response.data.data || response.data;
                    if (product && product._id && product.name) {
                        setOptions([product]);
                        // Update the parent's value so it shows the label
                        onChange(product);
                    }
                } catch (error) {
                    console.error('Failed to fetch initial product:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [storeId, value, multiple, onChange]);

    useEffect(() => {
        const timer = setTimeout(() => {
            // Don't search if it's the loading state, empty, or derived from a stub
            const trimmedInput = inputValue?.trim();
            if (!trimmedInput || trimmedInput.length < 2 || trimmedInput === 'Loading...' || trimmedInput.includes('undefined')) {
                return;
            }
            searchProducts(trimmedInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [inputValue]);

    return (
        <Autocomplete
            multiple={multiple}
            value={value}
            onChange={(_, newValue) => onChange(newValue)}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
            options={options}
            loading={loading}
            disabled={disabled || !storeId}
            getOptionLabel={(option) => {
                const opt = option as ProductOption;
                if (!opt.name) return 'Loading...';
                return `${opt.name} (${opt.sku || 'N/A'})`;
            }}
            isOptionEqualToValue={(option, val) => {
                const optId = (option as ProductOption)._id;
                const valId = typeof val === 'string' ? val : (val as any)?._id;
                return optId === valId;
            }}
            filterOptions={(x) => x} // Disable client-side filtering, rely on server
            renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                const opt = option as ProductOption;
                return (
                    <Box component="li" key={key} {...otherProps}>
                        <Box display="flex" alignItems="center" gap={2} width="100%">
                            <Avatar
                                src={opt.images?.[0]}
                                variant="rounded"
                                sx={{ width: 40, height: 40 }}
                            >
                                {opt.name.charAt(0)}
                            </Avatar>
                            <Box flex={1} minWidth={0}>
                                <Typography variant="body2" fontWeight={500} noWrap>
                                    {opt.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    SKU: {opt.sku} | {formatConvertedPrice(opt.salePrice || opt.price)}
                                    {opt.stock !== undefined && ` | Stock: ${opt.stock}`}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )
            }}
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

