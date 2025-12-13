'use client';

import { useState, useEffect, useCallback } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Chip } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import api from '@/lib/api';

export interface ShippingRuleOption {
    _id: string;
    name: string;
    description?: string;
    rateType: 'flat' | 'per_kg' | 'free' | 'percentage';
    rate: number;
    currency: string;
    isActive: boolean;
}

interface ShippingAutoCompleteProps {
    storeId: string;
    value?: ShippingRuleOption | null;
    onChange: (value: ShippingRuleOption | null) => void;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    size?: 'small' | 'medium';
}

export default function ShippingAutoComplete({
    storeId,
    value,
    onChange,
    label = 'Shipping Method',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder = 'Select shipping method...',
    size = 'medium',
}: ShippingAutoCompleteProps) {
    const [options, setOptions] = useState<ShippingRuleOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            fetchShippingRules();
        } else {
            setOptions([]);
        }
    }, [storeId]);

    const fetchShippingRules = async () => {
        try {
            setLoading(true);
            const response = await api.get('/shipping/rules', {
                params: { storeId, isActive: true }
            });
            const rules = response.data.data || response.data.shippingRules || [];
            setOptions(rules);
        } catch (error) {
            console.error('Failed to fetch shipping rules:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    const formatRate = (rule: ShippingRuleOption) => {
        switch (rule.rateType) {
            case 'free':
                return 'Free';
            case 'flat':
                return `${rule.currency} ${rule.rate.toFixed(2)}`;
            case 'per_kg':
                return `${rule.currency} ${rule.rate.toFixed(2)}/kg`;
            case 'percentage':
                return `${rule.rate}%`;
            default:
                return `${rule.rate}`;
        }
    };

    const getRateTypeColor = (rateType: string) => {
        switch (rateType) {
            case 'free':
                return 'success';
            case 'flat':
                return 'primary';
            case 'per_kg':
                return 'warning';
            case 'percentage':
                return 'secondary';
            default:
                return 'default';
        }
    };

    return (
        <Autocomplete
            value={value}
            onChange={(_, newValue) => onChange(newValue)}
            options={options}
            loading={loading}
            disabled={disabled || !storeId}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option._id === value?._id}
            renderOption={(props, option) => (
                <Box component="li" {...props} key={option._id}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                        <LocalShippingIcon color="action" fontSize="small" />
                        <Box flex={1} minWidth={0}>
                            <Typography variant="body2" fontWeight={500}>
                                {option.name}
                            </Typography>
                            {option.description && (
                                <Typography variant="caption" color="text.secondary" noWrap>
                                    {option.description}
                                </Typography>
                            )}
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                                label={option.rateType}
                                size="small"
                                color={getRateTypeColor(option.rateType) as any}
                                variant="outlined"
                                sx={{ height: 20, fontSize: 10 }}
                            />
                            <Typography variant="body2" fontWeight={600} color="primary">
                                {formatRate(option)}
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
                    helperText={helperText || (!storeId ? 'Select a store first' : '')}
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
