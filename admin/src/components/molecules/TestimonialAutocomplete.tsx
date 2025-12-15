'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Rating, Avatar } from '@mui/material';
import api from '@/lib/api';

interface TestimonialOption {
    label: string;
    value: string;
    rating: number;
    avatar?: string;
    designation: string;
}

interface TestimonialAutocompleteProps {
    value: string[];
    onChange: (value: string[]) => void;
    storeId?: string;
    label?: string;
    error?: boolean;
    helperText?: string;
    required?: boolean;
    placeholder?: string;
}

export default function TestimonialAutocomplete({
    value,
    onChange,
    storeId,
    label = 'Testimonials',
    error = false,
    helperText,
    required = false,
    placeholder = 'Select testimonials',
}: TestimonialAutocompleteProps) {
    const [options, setOptions] = useState<TestimonialOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            fetchTestimonials();
        } else {
            setOptions([]);
        }
    }, [storeId]);

    const fetchTestimonials = async () => {
        setLoading(true);
        try {
            const params: any = { isActive: true };
            if (storeId) {
                params.storeId = storeId;
            }

            const response = await api.get('/testimonials', { params });
            const testimonials = response.data.testimonials || response.data.data || [];

            const formattedOptions: TestimonialOption[] = testimonials.map((t: any) => ({
                label: t.customerName || 'Untitled Testimonial',
                value: t._id,
                rating: t.rating,
                avatar: t.avatar,
                designation: t.customerTitle,
            }));

            setOptions(formattedOptions);
        } catch (error) {
            console.error('Failed to fetch testimonials:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    const selectedOptions = options.filter((opt) => value?.includes(opt.value)) || [];

    return (
        <Autocomplete
            multiple
            value={selectedOptions}
            onChange={(_, newValue) => {
                onChange(newValue.map((v) => v.value));
            }}
            options={options}
            loading={loading}
            disabled={!storeId}
            getOptionLabel={(option) => option.label || ''}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                    <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={option.avatar} alt={option.label} sx={{ width: 32, height: 32 }} />
                        <Box>
                            <Typography variant="body2">{option.label}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Rating value={option.rating} size="small" readOnly />
                                <Typography variant="caption" color="text.secondary">
                                    {option.designation}
                                </Typography>
                            </Box>
                        </Box>
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
