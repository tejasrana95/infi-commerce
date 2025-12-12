'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '@/lib/api';

export interface CurrencyOption {
    label: string;
    value: string;
    code: string;
    name: string;
    symbol: string;
}

interface CurrencyAutocompleteProps {
    value?: string | string[] | null;
    onChange: (value: string | string[] | null) => void;
    multiple?: boolean;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
}

export default function CurrencyAutocomplete({
    value,
    onChange,
    multiple = false,
    label = 'Currency',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder,
}: CurrencyAutocompleteProps) {
    const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const response = await api.get('/currencies');
                const currencyData = response.data.currencies || response.data.data || [];

                const formattedCurrencies: CurrencyOption[] = currencyData.map((currency: any) => ({
                    label: `${currency.code} - ${currency.name} (${currency.symbol})`,
                    value: currency.code,
                    code: currency.code,
                    name: currency.name,
                    symbol: currency.symbol,
                }));

                setCurrencies(formattedCurrencies);
            } catch (error) {
                console.error('Failed to fetch currencies:', error);
                setCurrencies([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrencies();
    }, []);

    const getSelectedValue = () => {
        if (multiple) {
            if (!value || !Array.isArray(value)) return [];
            return currencies.filter(c => value.includes(c.value));
        } else {
            if (!value || Array.isArray(value)) return null;
            return currencies.find(c => c.value === value) || null;
        }
    };

    const handleChange = (_: any, newValue: CurrencyOption | CurrencyOption[] | null) => {
        if (multiple) {
            const values = (newValue as CurrencyOption[])?.map(v => v.value) || [];
            onChange(values);
        } else {
            const singleValue = (newValue as CurrencyOption)?.value || null;
            onChange(singleValue);
        }
    };

    return (
        <Autocomplete
            multiple={multiple}
            value={getSelectedValue()}
            onChange={handleChange}
            options={currencies}
            loading={loading}
            disabled={disabled || loading}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={error}
                    helperText={helperText}
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
