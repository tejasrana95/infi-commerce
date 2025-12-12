'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '@/lib/api';

export interface CountryOption {
    label: string;
    value: string;
    _id: string;
    code: string;
    name: string;
}

interface CountryAutocompleteProps {
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

export default function CountryAutocomplete({
    value,
    onChange,
    multiple = false,
    label = 'Country',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder,
}: CountryAutocompleteProps) {
    const [countries, setCountries] = useState<CountryOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await api.get('/geo?type=country');
                const countryData = response.data.data || [];

                const formattedCountries: CountryOption[] = countryData.map((country: any) => ({
                    label: `${country.name} (${country.code})`,
                    value: country.code,
                    _id: country._id,
                    code: country.code,
                    name: country.name,
                }));

                setCountries(formattedCountries);
            } catch (error) {
                console.error('Failed to fetch countries:', error);
                setCountries([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCountries();
    }, []);

    const getSelectedValue = () => {
        if (multiple) {
            if (!value || !Array.isArray(value)) return [];
            return countries.filter(c => value.includes(c.value));
        } else {
            if (!value || Array.isArray(value)) return null;
            return countries.find(c => c.value === value) || null;
        }
    };

    const handleChange = (_: any, newValue: CountryOption | CountryOption[] | null) => {
        if (multiple) {
            const values = (newValue as CountryOption[])?.map(v => v.value) || [];
            onChange(values);
        } else {
            const singleValue = (newValue as CountryOption)?.value || null;
            onChange(singleValue);
        }
    };

    return (
        <Autocomplete
            multiple={multiple}
            value={getSelectedValue()}
            onChange={handleChange}
            options={countries}
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
