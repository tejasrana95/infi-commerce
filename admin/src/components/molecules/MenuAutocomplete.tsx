'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '@/lib/api';

export interface MenuOption {
    label: string;
    value: string;
    _id: string;
    name: string;
    location: string;
}

interface MenuAutocompleteProps {
    value?: string | string[] | null;
    onChange: (value: any, menu?: MenuOption | MenuOption[] | null) => void;
    storeId?: string;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    minimal?: boolean;
    multiple?: boolean;
    location?: string; // Filter by location (header, footer, etc.)
}

export default function MenuAutocomplete({
    value,
    onChange,
    storeId,
    label = 'Select Menu',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder,
    minimal = false,
    multiple = false,
    location,
}: MenuAutocompleteProps) {
    const [menus, setMenus] = useState<MenuOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            fetchMenus();
        } else {
            setMenus([]);
        }
    }, [storeId, location]);

    const fetchMenus = async () => {
        if (!storeId) return;

        try {
            setLoading(true);
            let url = `/menus?store=${storeId}`;
            if (location) {
                url += `&location=${location}`;
            }
            const response = await api.get(url);
            const menuData = response.data.menus || response.data || [];

            const formattedMenus: MenuOption[] = menuData.map((menu: any) => ({
                label: `${menu.name} (${menu.location || 'No location'})`,
                value: menu._id,
                _id: menu._id,
                name: menu.name,
                location: menu.location || '',
            }));

            setMenus(formattedMenus);
        } catch (error) {
            console.error('Failed to fetch menus:', error);
            setMenus([]);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedValue = () => {
        if (!value) return multiple ? [] : null;
        if (multiple && Array.isArray(value)) {
            return menus.filter(m => value.includes(m.value));
        }
        return menus.find(m => m.value === value) || null;
    };

    const handleChange = (_: any, newValue: any) => {
        if (multiple) {
            const values = (newValue as MenuOption[]).map(v => v.value);
            onChange(values, newValue);
        } else {
            const val = newValue as MenuOption;
            onChange(val?.value || null, val);
        }
    };

    return (
        <Autocomplete
            multiple={multiple}
            value={getSelectedValue()}
            onChange={handleChange}
            options={menus}
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
