'use client';

import { useState, useEffect, useCallback } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Chip } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import api from '@/lib/api';

export interface GeoGroupOption {
    _id: string;
    name: string;
    description?: string;
    countries: string[];
    isActive: boolean;
}

interface GeoGroupAutocompleteProps {
    storeId: string;
    value?: string | null;
    onChange: (value: string | null, geoGroup?: GeoGroupOption | null) => void;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    size?: 'small' | 'medium';
}

export default function GeoGroupAutocomplete({
    storeId,
    value,
    onChange,
    label = 'Geo Group',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder = 'Select countries/regions...',
    size = 'medium',
}: GeoGroupAutocompleteProps) {
    const [options, setOptions] = useState<GeoGroupOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedValue, setSelectedValue] = useState<GeoGroupOption | null>(null);

    useEffect(() => {
        if (storeId) {
            fetchGeoGroups();
        } else {
            setOptions([]);
        }
    }, [storeId]);

    useEffect(() => {
        // Set selected value when value prop changes
        if (value && options.length > 0) {
            const found = options.find(o => o._id === value);
            setSelectedValue(found || null);
        } else {
            setSelectedValue(null);
        }
    }, [value, options]);

    const fetchGeoGroups = async () => {
        try {
            setLoading(true);
            const response = await api.get('/geo-groups', {
                params: { storeId, isActive: true }
            });
            const groups = response.data.data || response.data.geoGroups || [];
            setOptions(groups);
        } catch (error) {
            console.error('Failed to fetch geo groups:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (_: any, newValue: GeoGroupOption | null) => {
        setSelectedValue(newValue);
        onChange(newValue?._id || null, newValue);
    };

    return (
        <Autocomplete
            value={selectedValue}
            onChange={handleChange}
            options={options}
            loading={loading}
            disabled={disabled || !storeId}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option._id === value?._id}
            renderOption={(props, option) => (
                <Box component="li" {...props} key={option._id}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                        <PublicIcon color="action" fontSize="small" />
                        <Box flex={1} minWidth={0}>
                            <Typography variant="body2" fontWeight={500}>
                                {option.name}
                            </Typography>
                            <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                                {option.countries.slice(0, 5).map(c => (
                                    <Chip key={c} label={c} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                                ))}
                                {option.countries.length > 5 && (
                                    <Chip label={`+${option.countries.length - 5}`} size="small" sx={{ height: 18, fontSize: 10 }} />
                                )}
                            </Box>
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
