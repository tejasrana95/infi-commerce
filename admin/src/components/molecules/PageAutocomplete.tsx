'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '@/lib/api';

export interface PageOption {
    label: string;
    value: string;
    _id: string;
    title: string;
    slug: string;
}

interface PageAutocompleteProps {
    value?: string | null;
    onChange: (value: string | null, page?: PageOption | null) => void;
    storeId?: string;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    minimal?: boolean;
}

export default function PageAutocomplete({
    value,
    onChange,
    storeId,
    label = 'Page',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder,
    minimal = false,
}: PageAutocompleteProps) {
    const [pages, setPages] = useState<PageOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            fetchPages();
        } else {
            setPages([]);
        }
    }, [storeId]);

    const fetchPages = async () => {
        if (!storeId) return;

        try {
            setLoading(true);
            const response = await api.get(`/pages?storeId=${storeId}`);
            const pageData = response.data.pages || response.data.data || [];

            const formattedPages: PageOption[] = pageData.map((page: any) => ({
                label: `${page.title} (/${page.slug})`,
                value: page._id,
                _id: page._id,
                title: page.title,
                slug: page.slug,
            }));

            setPages(formattedPages);
        } catch (error) {
            console.error('Failed to fetch pages:', error);
            setPages([]);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedValue = () => {
        if (!value) return null;
        return pages.find(p => p.value === value) || null;
    };

    const handleChange = (_: any, newValue: PageOption | null) => {
        onChange(newValue?.value || null, newValue);
    };

    return (
        <Autocomplete
            value={getSelectedValue()}
            onChange={handleChange}
            options={pages}
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
