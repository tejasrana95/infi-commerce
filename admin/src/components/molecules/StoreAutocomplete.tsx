'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '@/lib/api';

export interface StoreOption {
    label: string;
    value: string;
    _id: string;
    name: string;
    domain: string;
}

interface StoreAutocompleteProps {
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

export default function StoreAutocomplete({
    value,
    onChange,
    multiple = false,
    label = 'Store',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder,
}: StoreAutocompleteProps) {
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await api.get('/stores');
                const storeData = response.data.stores || response.data.data || [];

                const formattedStores: StoreOption[] = storeData.map((store: any) => ({
                    label: `${store.name} (${store.domain})`,
                    value: store._id,
                    _id: store._id,
                    name: store.name,
                    domain: store.domain,
                }));

                setStores(formattedStores);
            } catch (error) {
                console.error('Failed to fetch stores:', error);
                setStores([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStores();
    }, []);

    const getSelectedValue = () => {
        if (multiple) {
            if (!value || !Array.isArray(value)) return [];
            return stores.filter(s => value.includes(s.value));
        } else {
            if (!value || Array.isArray(value)) return null;
            return stores.find(s => s.value === value) || null;
        }
    };

    const handleChange = (_: any, newValue: StoreOption | StoreOption[] | null) => {
        if (multiple) {
            const values = (newValue as StoreOption[])?.map(v => v.value) || [];
            onChange(values);
        } else {
            const singleValue = (newValue as StoreOption)?.value || null;
            onChange(singleValue);
        }
    };

    return (
        <Autocomplete
            multiple={multiple}
            value={getSelectedValue()}
            onChange={handleChange}
            options={stores}
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
