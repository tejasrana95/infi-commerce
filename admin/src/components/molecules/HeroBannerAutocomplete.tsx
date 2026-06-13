'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography } from '@mui/material';
import heroBannerService from '@/services/heroBanner.service';

interface HeroBannerOption {
    label: string;
    value: string;
}

interface HeroBannerAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    storeId?: string;
    label?: string;
    error?: boolean;
    helperText?: string;
    required?: boolean;
    placeholder?: string;
}

export default function HeroBannerAutocomplete({
    value,
    onChange,
    storeId,
    label = 'Hero Banner',
    error = false,
    helperText,
    required = false,
    placeholder = 'Select Hero Banner',
}: HeroBannerAutocompleteProps) {
    const [options, setOptions] = useState<HeroBannerOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            fetchHeroBanners();
        } else {
            setOptions([]);
        }
    }, [storeId]);

    const fetchHeroBanners = async () => {
        setLoading(true);
        try {
            const response = await heroBannerService.getAll(storeId);
            const banners = response.data.heroBanners || [];

            const formattedOptions: HeroBannerOption[] = banners
                .filter((b: any) => b.isActive)
                .map((b: any) => ({
                    label: b.name || 'Untitled Banner',
                    value: b._id,
                }));

            setOptions(formattedOptions);
        } catch (error) {
            console.error('Failed to fetch hero banners:', error);
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
                onChange(newValue ? newValue.value : '');
            }}
            options={options}
            loading={loading}
            disabled={!storeId}
            getOptionLabel={(option) => option.label || ''}
            isOptionEqualToValue={(option, val) => option.value === val.value}
            renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                    <Box component="li" key={key} {...otherProps}>
                        <Typography variant="body2">{option.label}</Typography>
                    </Box>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={error}
                    helperText={helperText || (!storeId ? 'Please select a store first' : '')}
                    required={required}
                    placeholder={placeholder}
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
