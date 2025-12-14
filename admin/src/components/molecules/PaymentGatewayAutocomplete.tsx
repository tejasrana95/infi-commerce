'use client';

import { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Chip, Typography } from '@mui/material';
import api from '@/lib/api';

interface PaymentGateway {
    _id: string;
    gatewayType: string;
    gatewayName: string;
    geoGroupId?: { _id: string; name: string; countries: string[] };
    isActive: boolean;
    isTestMode: boolean;
}

interface PaymentGatewayAutocompleteProps {
    value: string | null;
    onChange: (value: string | null) => void;
    storeId: string;
    customerCountry?: string; // ISO country code to filter gateways
    label?: string;
    required?: boolean;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
}

export default function PaymentGatewayAutocomplete({
    value,
    onChange,
    storeId,
    customerCountry,
    label = 'Payment Gateway',
    required = false,
    error = false,
    helperText,
    disabled = false,
}: PaymentGatewayAutocompleteProps) {
    const [options, setOptions] = useState<PaymentGateway[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const fetchGateways = async () => {
            if (!storeId) {
                setOptions([]);
                return;
            }

            setLoading(true);
            try {
                // Use the available endpoint if customer country is provided
                if (customerCountry) {
                    const response = await api.get('/payment-gateways/available', {
                        params: {
                            storeId,
                            country: customerCountry,
                        }
                    });
                    setOptions(response.data.data || []);
                } else {
                    // Otherwise get all gateways for the store
                    const response = await api.get('/payment-gateways', {
                        params: { storeId }
                    });
                    // Filter only active gateways
                    const activeGateways = (response.data.data || []).filter((g: PaymentGateway) => g.isActive);
                    setOptions(activeGateways);
                }
            } catch (err) {
                console.error('Failed to fetch payment gateways');
                setOptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGateways();
    }, [storeId, customerCountry]);

    const selectedOption = useMemo(() => {
        return options.find(opt => opt._id === value) || null;
    }, [options, value]);

    const getGatewayTypeColor = (type: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' => {
        const colors: Record<string, 'primary' | 'secondary' | 'success' | 'info' | 'warning'> = {
            stripe: 'primary',
            razorpay: 'info',
            paypal: 'warning',
        };
        return colors[type] || 'secondary';
    };

    return (
        <Autocomplete
            value={selectedOption}
            onChange={(_, newValue) => {
                onChange(newValue?._id || null);
            }}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue);
            }}
            options={options}
            getOptionLabel={(option) => option.gatewayName}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            loading={loading}
            disabled={disabled || !storeId}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    required={required}
                    error={error}
                    helperText={helperText || (!storeId ? 'Select a store first' : '')}
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
            renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                    <Box component="li" key={key} {...otherProps}>
                        <Box display="flex" alignItems="center" gap={1} width="100%">
                            <Chip
                                label={option.gatewayType.toUpperCase()}
                                size="small"
                                color={getGatewayTypeColor(option.gatewayType)}
                                variant="outlined"
                                sx={{ minWidth: 80 }}
                            />
                            <Box>
                                <Typography variant="body2">{option.gatewayName}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {option.isTestMode ? 'Test Mode' : 'Live'}
                                    {option.geoGroupId && typeof option.geoGroupId === 'object' &&
                                        ` • ${option.geoGroupId.name}`}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                );
            }}
            noOptionsText={
                !storeId
                    ? 'Select a store first'
                    : customerCountry
                        ? 'No gateways available for this country'
                        : 'No payment gateways found'
            }
        />
    );
}
