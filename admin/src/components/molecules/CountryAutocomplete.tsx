'use client';

import { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '@/lib/api';

export interface CountryOption {
    label: string;
    value: string;
    _id: string;
    code: string;
    name: string;
    minimal?: boolean;
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
    minimal?: boolean;
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
    minimal = false,
}: CountryAutocompleteProps) {
    const [countries, setCountries] = useState<CountryOption[]>([]);
    const [countryCache, setCountryCache] = useState<Record<string, CountryOption>>({});
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedInput, setDebouncedInput] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedInput(searchTerm.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const mapCountry = (country: { _id: string; name: string; code: string }): CountryOption => ({
        label: `${country.name} (${country.code})`,
        value: country.code,
        _id: country._id,
        code: country.code,
        name: country.name,
    });

    useEffect(() => {
        let mounted = true;
        const fetchCountryCache = async () => {
            try {
                const response = await api.get('/geo?type=country&limit=1000');
                const countryData = response.data?.data || [];
                const formattedCountries: CountryOption[] = countryData.map(mapCountry);
                const cache = Object.fromEntries(formattedCountries.map((country) => [country.value, country]));
                if (mounted) {
                    setCountryCache(cache);
                }
            } catch (error) {
                console.error('Failed to build country cache:', error);
            }
        };

        fetchCountryCache();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        const fetchCountries = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    type: 'country',
                    limit: '100',
                });

                if (debouncedInput) {
                    params.set('search', debouncedInput);
                }

                const response = await api.get(`/geo?${params.toString()}`);
                const countryData = response.data?.data || [];
                const formattedCountries: CountryOption[] = countryData.map(mapCountry);

                if (mounted) {
                    setCountries(formattedCountries);
                }
            } catch (error) {
                console.error('Failed to fetch countries:', error);
                if (mounted) {
                    setCountries([]);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchCountries();
        return () => {
            mounted = false;
        };
    }, [debouncedInput]);

    const getSelectedValue = () => {
        const allOptions = Array.from(
            new Map([...countries, ...Object.values(countryCache)].map((country) => [country.value, country])).values()
        );

        const findByAnyKey = (raw: string) => {
            const normalized = String(raw).trim().toLowerCase();
            return allOptions.find((country) =>
                country.value.toLowerCase() === normalized
                || country.code.toLowerCase() === normalized
                || country._id === raw
                || country.name.toLowerCase() === normalized
            );
        };

        const toFallbackOption = (raw: string): CountryOption => ({
            label: raw,
            value: raw,
            _id: raw,
            code: raw,
            name: raw,
        });

        if (multiple) {
            if (!value || !Array.isArray(value)) return [];
            return value
                .map((raw) => findByAnyKey(String(raw)) || toFallbackOption(String(raw)))
                .filter(Boolean);
        } else {
            if (!value || Array.isArray(value)) return null;
            const raw = String(value);
            return findByAnyKey(raw) || toFallbackOption(raw);
        }
    };

    const handleChange = (_: unknown, newValue: CountryOption | CountryOption[] | null) => {
        if (multiple) {
            const values = (newValue as CountryOption[])?.map(v => v.value) || [];
            onChange(values);
        } else {
            const singleValue = (newValue as CountryOption)?.value || null;
            onChange(singleValue);
        }
    };

    const options = useMemo(() => {
        const selectedCodes = multiple
            ? (Array.isArray(value) ? value : []).filter(Boolean)
            : (typeof value === 'string' && value ? [value] : []);

        const selectedFromCache = selectedCodes
            .map((raw) => {
                const val = String(raw).trim().toLowerCase();
                return Object.values(countryCache).find((country) =>
                    country.value.toLowerCase() === val
                    || country.code.toLowerCase() === val
                    || country._id === raw
                    || country.name.toLowerCase() === val
                );
            })
            .filter((country): country is CountryOption => !!country);

        return Array.from(new Map([...countries, ...selectedFromCache].map((country) => [country.value, country])).values());
    }, [countries, countryCache, multiple, value]);

    return (
        <Autocomplete
            multiple={multiple}
            value={getSelectedValue()}
            onChange={handleChange}
            options={options}
            loading={loading}
            disabled={disabled}
            inputValue={inputValue}
            onInputChange={(_, newInputValue, reason) => {
                if (reason === 'input' || reason === 'clear') {
                    setInputValue(newInputValue);
                    setSearchTerm(newInputValue);
                }
            }}
            getOptionLabel={(option) => option.label}
            filterOptions={(x) => x}
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={error}
                    helperText={minimal ? undefined : helperText}
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
