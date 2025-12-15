'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography } from '@mui/material';
import api from '@/lib/api';

interface BannerOption {
    label: string;
    value: string;
    image?: string;
}

interface BannerAutocompleteProps {
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

export default function BannerAutocomplete({
    value,
    onChange,
    storeId,
    label = 'Banner',
    error = false,
    helperText,
    required = false,
    placeholder = 'Select a banner',
    minimal = false,
}: BannerAutocompleteProps) {
    const [options, setOptions] = useState<BannerOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            fetchBanners();
        } else {
            setOptions([]);
        }
    }, [storeId]);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const params: any = { isActive: true };
            if (storeId) {
                params.storeId = storeId;
            }

            const response = await api.get('/banners', { params });
            // Handle both response structures just in case
            const banners = response.data.banners || response.data.data || [];

            const formattedOptions: BannerOption[] = banners.map((banner: any) => ({
                label: banner.title || banner.name || 'Untitled Banner',
                value: banner._id,
                image: banner.image,
            }));

            setOptions(formattedOptions);
        } catch (error) {
            console.error('Failed to fetch banners:', error);
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
                    <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.image && (
                            <Box
                                component="img"
                                src={option.image}
                                alt={option.label}
                                sx={{ width: 40, height: 24, objectFit: 'cover', borderRadius: 0.5 }}
                            />
                        )}
                        <Typography variant="body2" noWrap>{option.label}</Typography>
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
