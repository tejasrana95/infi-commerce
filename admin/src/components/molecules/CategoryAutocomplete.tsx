'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '@/lib/api';

export interface CategoryOption {
    label: string;
    value: string;
    _id: string;
    title: string;
    slug: string;
    path: string;
    level: number;
}

interface CategoryAutocompleteProps {
    value?: string | string[] | null;
    onChange: (value: any, category?: CategoryOption | CategoryOption[] | null) => void;
    storeId?: string;
    excludeId?: string; // Exclude specific category (e.g., current category when editing)
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    minimal?: boolean; // For compact filter display
    multiple?: boolean;
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
    multiple = false,
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
                    slug: cat.slug || '',
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
        if (!value) return multiple ? [] : null;
        if (multiple && Array.isArray(value)) {
            return categories.filter(c => value.includes(c.value));
        }
        return categories.find(c => c.value === value) || null;
    };

    const handleChange = (_: any, newValue: any) => {
        if (multiple) {
            const values = (newValue as CategoryOption[]).map(v => v.value);
            onChange(values, newValue);
        } else {
            const val = (newValue as CategoryOption);
            onChange(val?.value || null, val);
        }
    };

    return (
        <Autocomplete
            multiple={multiple}
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
