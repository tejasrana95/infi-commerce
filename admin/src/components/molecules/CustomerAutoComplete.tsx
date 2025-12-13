'use client';

import { useState, useEffect, useCallback } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Avatar, Chip } from '@mui/material';
import api from '@/lib/api';

export interface CustomerAddress {
    _id?: string;
    type: 'billing' | 'shipping';
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
    isDefault: boolean;
}

export interface CustomerOption {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isActive: boolean;
    addresses?: CustomerAddress[];
}

interface CustomerAutoCompleteProps {
    value?: CustomerOption | null;
    onChange: (value: CustomerOption | null) => void;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    size?: 'small' | 'medium';
}

export default function CustomerAutoComplete({
    value,
    onChange,
    label = 'Search Customer',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder = 'Type to search customers...',
    size = 'medium',
}: CustomerAutoCompleteProps) {
    const [options, setOptions] = useState<CustomerOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const searchCustomers = useCallback(async (query: string) => {
        if (query.length < 2) {
            setOptions([]);
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/customers', {
                params: { search: query, limit: 15 }
            });
            const customers = response.data.data || [];
            setOptions(customers);
        } catch (error) {
            console.error('Failed to search customers:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchCustomers(inputValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [inputValue, searchCustomers]);

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getAddressCount = (customer: CustomerOption) => {
        return customer.addresses?.length || 0;
    };

    return (
        <Autocomplete
            value={value}
            onChange={(_, newValue) => onChange(newValue)}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
            options={options}
            loading={loading}
            disabled={disabled}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
            isOptionEqualToValue={(option, value) => option._id === value?._id}
            filterOptions={(x) => x}
            renderOption={(props, option) => (
                <Box component="li" {...props} key={option._id}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                            {getInitials(option.firstName, option.lastName)}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" fontWeight={500} noWrap>
                                    {option.firstName} {option.lastName}
                                </Typography>
                                {!option.isActive && (
                                    <Chip label="Inactive" size="small" color="error" sx={{ height: 18, fontSize: 10 }} />
                                )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {option.email}
                                {option.phone && ` | ${option.phone}`}
                                {getAddressCount(option) > 0 && ` | ${getAddressCount(option)} address(es)`}
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
                    helperText={helperText}
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
