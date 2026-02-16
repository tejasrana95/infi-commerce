import React, { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useNotification } from '@/contexts/NotificationContext';

interface GoogleTaxonomyAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    helperText?: string;
    size?: 'small' | 'medium';
    fullWidth?: boolean;
}

export default function GoogleTaxonomyAutocomplete({
    value,
    onChange,
    label = "Google Product Category",
    helperText,
    size = "small",
    fullWidth = true
}: GoogleTaxonomyAutocompleteProps) {
    const { showNotification } = useNotification();
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Load taxonomy file on first open
    useEffect(() => {
        if (!open || options.length > 0) return;

        const loadTaxonomy = async () => {
            setLoading(true);
            try {
                const response = await fetch('/google_taxonomy.en-US.txt');
                if (!response.ok) throw new Error('Failed to load taxonomy');
                const text = await response.text();
                // Filter out comments and empty lines
                const lines = text.split('\n')
                    .filter(line => line.trim() && !line.startsWith('#'))
                    .map(line => line.trim());
                setOptions(lines);
            } catch (error) {
                console.error('Error loading taxonomy:', error);
                showNotification('Failed to load Google Product Categories', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadTaxonomy();
    }, [open, options.length, showNotification]);

    return (
        <Autocomplete
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            value={value}
            onChange={(_, newValue) => onChange(newValue || '')}
            options={options}
            loading={loading}
            fullWidth={fullWidth}
            size={size}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    helperText={helperText}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
        />
    );
}
