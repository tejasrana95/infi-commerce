'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography } from '@mui/material';
import api from '@/lib/api';

interface BrandShowcaseOption {
    label: string;
    value: string;
    logoCount: number;
}

interface BrandShowcaseAutocompleteProps {
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

export default function BrandShowcaseAutocomplete({
    value,
    onChange,
    storeId,
    label = 'Brand Showcase',
    error = false,
    helperText,
    required = false,
    placeholder = 'Select a showcase',
    minimal = false,
}: BrandShowcaseAutocompleteProps) {
    const [options, setOptions] = useState<BrandShowcaseOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            fetchShowcases();
        } else {
            setOptions([]);
        }
    }, [storeId]);

    const fetchShowcases = async () => {
        setLoading(true);
        try {
            const params: any = { isActive: true };
            if (storeId) {
                params.storeId = storeId;
            }

            const response = await api.get('/brand-showcases', { params });
            const showcases = response.data.showcases || response.data.data || [];

            const formattedOptions: BrandShowcaseOption[] = showcases.map((s: any) => ({
                label: s.name,
                value: s._id,
                logoCount: s.logos?.length || 0,
            }));

            setOptions(formattedOptions);
        } catch (error) {
            console.error('Failed to fetch brand showcases:', error);
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
                            <Typography variant="caption" color="text.secondary">
                                {option.logoCount} logos
                            </Typography>
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
