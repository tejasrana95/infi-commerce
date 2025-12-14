'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '@/lib/api';

export interface CategoryOption {
    label: string;
    value: string;
    _id: string;
    name: string;
    path: string;
    level: number;
}

interface BlogCategoryAutocompleteProps {
    value?: string | string[] | null;
    onChange: (value: string | string[] | null, category?: CategoryOption | CategoryOption[] | null) => void;
    storeId?: string;
    excludeId?: string;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    minimal?: boolean;
    multiple?: boolean;
}

export default function BlogCategoryAutocomplete({
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
}: BlogCategoryAutocompleteProps) {
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            fetchCategories();
        } else {
            fetchCategories();
        }
    }, [storeId, excludeId]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (storeId) params.storeId = storeId;

            const response = await api.get('/blog/categories', { params });
            const categoryData = response.data.categories || response.data.data || [];

            const formattedCategories: CategoryOption[] = categoryData
                .filter((cat: any) => cat._id !== excludeId)
                .map((cat: any) => ({
                    label: cat.path ? `${cat.path}` : cat.name,
                    value: cat._id,
                    _id: cat._id,
                    name: cat.name,
                    path: cat.path || cat.name,
                    level: cat.level || 0,
                }))
                .sort((a: CategoryOption, b: CategoryOption) => a.path.localeCompare(b.path));

            setCategories(formattedCategories);
        } catch (error) {
            console.error('Failed to fetch blog categories:', error);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedValue = () => {
        if (multiple) {
            if (!Array.isArray(value)) return [];
            return categories.filter(c => value.includes(c.value));
        }
        if (!value) return null;
        return categories.find(c => c.value === value) || null;
    };

    const handleChange = (_: any, newValue: any) => {
        if (multiple) {
            // newValue is array of CategoryOption
            const ids = (newValue as CategoryOption[]).map(o => o.value);
            onChange(ids, newValue);
        } else {
            const val = (newValue as CategoryOption | null);
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
            disabled={disabled || loading}
            getOptionLabel={(option) => option.label}
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
