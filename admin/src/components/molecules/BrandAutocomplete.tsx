'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Avatar } from '@mui/material';
import api from '@/lib/api';
import { Brand } from '@/types';

interface BrandOption {
    label: string;
    value: string;
    _id: string;
    name: string;
    logo?: string;
}

interface BrandAutocompleteProps {
    value: string | null;
    onChange: (value: string | null) => void;
    storeId?: string;
    label?: string;
    error?: boolean;
    helperText?: string;
    required?: boolean;
    placeholder?: string;
    minimal?: boolean;
}

export default function BrandAutocomplete({
    value,
    onChange,
    storeId,
    label = 'Brand',
    error = false,
    helperText,
    required = false,
    placeholder = 'Select a brand',
    minimal = false,
}: BrandAutocompleteProps) {
    const [options, setOptions] = useState<BrandOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            fetchBrands();
        } else {
            setOptions([]);
        }
    }, [storeId]);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const params: any = { isActive: true };
            if (storeId) {
                params.storeId = storeId;
            }

            const response = await api.get('/brands', { params });
            const brands = response.data.brands || [];

            const formattedOptions: BrandOption[] = brands.map((brand: Brand) => ({
                label: brand.name,
                value: brand._id,
                _id: brand._id,
                name: brand.name,
                logo: brand.logo,
            }));

            setOptions(formattedOptions);
        } catch (error) {
            console.error('Failed to fetch brands:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    const selectedOption = options.find((opt) => opt.value === value) || null;

    return (
        <Autocomplete
            value={selectedOption}
            onChange={(_, newValue) => {
                onChange(newValue ? newValue.value : null);
            }}
            options={options}
            loading={loading}
            disabled={!storeId}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.logo && (
                        <Avatar src={option.logo} alt={option.name} sx={{ width: 24, height: 24 }} />
                    )}
                    {option.label}
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={error}
                    helperText={minimal ? undefined : (helperText || (!storeId ? 'Please select a store first' : ''))}
                    required={required}
                    placeholder={placeholder}
                    size={minimal ? 'small' : 'medium'}
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
