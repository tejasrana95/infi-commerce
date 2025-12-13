'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '@/lib/api';

export interface CategoryOption {
    label: string;
    value: string;
    _id: string;
    title: string;
    path: string;
    level: number;
}

interface CategoryAutocompleteProps {
    value?: string | null;
    onChange: (value: string | null, category?: CategoryOption | null) => void;
    storeId?: string;
    excludeId?: string; // Exclude specific category (e.g., current category when editing)
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    minimal?: boolean; // For compact filter display
}

export default function CategoryAutocomplete({
    value,
    onChange,
    storeId,
    excludeId,
    label = 'Parent Category',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder,
    minimal = false,
}: CategoryAutocompleteProps) {
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            fetchCategories();
        } else {
            setCategories([]);
        }
    }, [storeId, excludeId]);

    const fetchCategories = async () => {
        if (!storeId) return;

        try {
            setLoading(true);
            const response = await api.get(`/categories?storeId=${storeId}`);
            const categoryData = response.data.categories || response.data.data || [];

            const formattedCategories: CategoryOption[] = categoryData
                .filter((cat: any) => cat._id !== excludeId) // Exclude current category
                .map((cat: any) => ({
                    label: cat.path ? `${cat.path}` : cat.title,
                    value: cat._id,
                    _id: cat._id,
                    title: cat.title,
                    path: cat.path || cat.title,
                    level: cat.level || 0,
                }))
                .sort((a: CategoryOption, b: CategoryOption) => a.path.localeCompare(b.path));

            setCategories(formattedCategories);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedValue = () => {
        if (!value) return null;
        return categories.find(c => c.value === value) || null;
    };

    const handleChange = (_: any, newValue: CategoryOption | null) => {
        onChange(newValue?.value || null, newValue);
    };

    return (
        <Autocomplete
            value={getSelectedValue()}
            onChange={handleChange}
            options={categories}
            loading={loading}
            disabled={disabled || loading || !storeId}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value?.value}
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
