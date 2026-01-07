'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '@/lib/api';

export interface ContentCardCategoryOption {
    label: string;
    value: string;
    _id: string;
    name: string;
    slug: string;
    icon?: string;
}

interface ContentCardCategoryAutocompleteProps {
    value?: string | null;
    onChange: (value: string | null, category?: ContentCardCategoryOption | null) => void;
    storeId?: string;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
}

export default function ContentCardCategoryAutocomplete({
    value,
    onChange,
    storeId,
    label = 'Category',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder,
}: ContentCardCategoryAutocompleteProps) {
    const [categories, setCategories] = useState<ContentCardCategoryOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, [storeId]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const params: any = { isActive: true };
            if (storeId) params.storeId = storeId;

            const response = await api.get('/content-cards/categories', { params });
            const categoryData = response.data.data || [];

            const formattedCategories: ContentCardCategoryOption[] = categoryData.map((cat: any) => ({
                label: cat.name,
                value: cat._id,
                _id: cat._id,
                name: cat.name,
                slug: cat.slug || '',
                icon: cat.icon,
            }));

            setCategories(formattedCategories);
        } catch (error) {
            console.error('Failed to fetch content card categories:', error);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedValue = () => {
        if (!value) return null;
        return categories.find(c => c.value === value) || null;
    };

    const handleChange = (_: any, newValue: ContentCardCategoryOption | null) => {
        onChange(newValue?.value || null, newValue);
    };

    return (
        <Autocomplete
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
