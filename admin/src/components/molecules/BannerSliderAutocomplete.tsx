'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography } from '@mui/material';
import api from '@/lib/api';

interface BannerSliderOption {
    label: string;
    value: string;
    slug: string;
}

interface BannerSliderAutocompleteProps {
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

export default function BannerSliderAutocomplete({
    value,
    onChange,
    storeId,
    label = 'Banner Slider',
    error = false,
    helperText,
    required = false,
    placeholder = 'Select a slider',
    minimal = false,
}: BannerSliderAutocompleteProps) {
    const [options, setOptions] = useState<BannerSliderOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            fetchSliders();
        } else {
            setOptions([]);
        }
    }, [storeId]);

    const fetchSliders = async () => {
        setLoading(true);
        try {
            const params: any = { isActive: true };
            if (storeId) {
                params.storeId = storeId;
            }

            const response = await api.get('/banner-sliders', { params });
            const sliders = response.data.sliders || response.data.data || [];

            const formattedOptions: BannerSliderOption[] = sliders.map((slider: any) => ({
                label: slider.name,
                value: slider._id,
                slug: slider.slug,
            }));

            setOptions(formattedOptions);
        } catch (error) {
            console.error('Failed to fetch banner sliders:', error);
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
            renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                    <Box component="li" key={key} {...otherProps}>
                        <Box>
                            <Typography variant="body2">{option.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{option.slug}</Typography>
                        </Box>
                    </Box>
                );
            }}
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
