'use client';

import { useState, useEffect, useMemo } from 'react';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, IconButton, TextField, Chip, Grid, Checkbox, FormControlLabel, Autocomplete, CircularProgress } from '@mui/material';
import { Controller } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import api from '@/lib/api';
import debounce from 'lodash/debounce';

interface SpecificationManagerProps {
    control: any;
    watchStoreId: string;
    watchCategoryIds?: string[];
}

export default function SpecificationManager({ control, watchStoreId, watchCategoryIds }: SpecificationManagerProps) {
    return (
        <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Product Specifications</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add specifications to describe product features (e.g., Screen Size: 16", Weight: 2.5 kg, Recyclable: Yes).
            </Typography>

            <Controller
                name="specifications"
                control={control}
                render={({ field }) => {
                    const [selectedAttr, setSelectedAttr] = useState<any | null>(null);
                    const [attributes, setAttributes] = useState<any[]>([]);
                    const [loadingAttrs, setLoadingAttrs] = useState(false);
                    const [inputValue, setInputValue] = useState('');
                    const [options, setOptions] = useState<any[]>([]);
                    const productSpecs = field.value || [];

                    // Fetch attributes based on search
                    const fetchAttributes = useMemo(
                        () =>
                            debounce(async (input: string, storeId: string) => {
                                if (!storeId) return;
                                setLoadingAttrs(true);
                                try {
                                    const params: any = { storeId, limit: 20 };
                                    if (input) {
                                        params.search = input;
                                    }
                                    const response = await api.get('/attributes', { params });
                                    setOptions(response.data.data || response.data.attributes || []);
                                } catch (err) {
                                    console.error('Failed to fetch attributes');
                                } finally {
                                    setLoadingAttrs(false);
                                }
                            }, 500),
                        []
                    );

                    useEffect(() => {
                        fetchAttributes('', watchStoreId);
                    }, [watchStoreId, fetchAttributes]);

                    useEffect(() => {
                        if (inputValue !== '') {
                            fetchAttributes(inputValue, watchStoreId);
                        }
                    }, [inputValue, watchStoreId, fetchAttributes]);

                    // Initial fetch for rendering existing specs correctly
                    useEffect(() => {
                        const fetchAllAttributes = async () => {
                            if (watchStoreId) {
                                try {
                                    // Fetch enough attributes or specifically needed ones if possible
                                    // For now, we'll rely on the specification data itself containing necessary info if populated
                                    // or fetch a base set.
                                    // Ideally, we might want to fetch specifics if we were only displaying IDs,
                                    // but we likely have the full object or need to fetch it.
                                    // For this implementation, we focus on the *search* for adding new ones.
                                    // To display existing ones correctly, we might need to fetch them if they are just IDs.
                                    const response = await api.get('/attributes', { params: { storeId: watchStoreId, limit: 100 } });
                                    setAttributes(response.data.data || response.data.attributes || []);
                                } catch (err) {
                                    console.error('Failed to fetch initial attributes');
                                }
                            }
                        };
                        fetchAllAttributes();
                    }, [watchStoreId]);


                    const handleAddSpec = () => {
                        if (selectedAttr && !productSpecs.find((s: any) => s.attributeId === selectedAttr._id)) {
                            field.onChange([
                                ...productSpecs,
                                {
                                    attributeId: selectedAttr._id,
                                    value: selectedAttr.type === 'checkbox' ? false : '',
                                }
                            ]);
                            setSelectedAttr(null);
                            setInputValue('');
                        }
                    };

                    const handleRemoveSpec = (attrId: string) => {
                        field.onChange(productSpecs.filter((s: any) => s.attributeId !== attrId));
                    };

                    const handleValueChange = (attrId: string, value: any) => {
                        field.onChange(productSpecs.map((s: any) =>
                            s.attributeId === attrId ? { ...s, value } : s
                        ));
                    };

                    const getAttribute = (attrId: any) => {
                        if (typeof attrId === 'object' && attrId?.name) {
                            return attrId;
                        }
                        // Check in options search results or initial full list
                        return options.find(a => a._id === attrId) || attributes.find(a => a._id === attrId) || null;
                    };

                    const renderValueInput = (spec: any) => {
                        const attr = getAttribute(spec.attributeId);
                        // Fallback display if attribute details not found yet
                        if (!attr) return <Typography variant="body2" color="error">Attribute details not found</Typography>;

                        const attrId = typeof spec.attributeId === 'object' ? spec.attributeId._id : spec.attributeId;

                        switch (attr.type) {
                            case 'select':
                                return (
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Value</InputLabel>
                                        <Select
                                            value={spec.value || ''}
                                            onChange={(e) => handleValueChange(attrId, e.target.value)}
                                            label="Value"
                                        >
                                            {(attr.options || []).map((opt: string) => (
                                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                );
                            case 'multiselect':
                                return (
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Values</InputLabel>
                                        <Select
                                            multiple
                                            value={Array.isArray(spec.value) ? spec.value : []}
                                            onChange={(e) => handleValueChange(attrId, e.target.value)}
                                            label="Values"
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {(selected as string[]).map((v) => (
                                                        <Chip key={v} label={v} size="small" />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {(attr.options || []).map((opt: string) => (
                                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                );
                            case 'checkbox':
                                return (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={spec.value === true}
                                                onChange={(e) => handleValueChange(attrId, e.target.checked)}
                                            />
                                        }
                                        label="Yes"
                                    />
                                );
                            case 'number':
                                return (
                                    <TextField
                                        type="number"
                                        value={spec.value || ''}
                                        onChange={(e) => handleValueChange(attrId, e.target.value ? parseFloat(e.target.value) : '')}
                                        size="small"
                                        fullWidth
                                        placeholder={attr.unit ? `Value in ${attr.unit}` : 'Enter value'}
                                        InputProps={{
                                            endAdornment: attr.unit ? <Typography variant="caption" color="text.secondary">{attr.unit}</Typography> : undefined
                                        }}
                                    />
                                );
                            case 'text':
                            default:
                                return (
                                    <TextField
                                        value={spec.value || ''}
                                        onChange={(e) => handleValueChange(attrId, e.target.value)}
                                        size="small"
                                        fullWidth
                                        placeholder="Enter value"
                                        multiline={attr.type === 'text'}
                                        rows={attr.type === 'text' ? 2 : 1}
                                    />
                                );
                        }
                    };

                    return (
                        <Box>
                            {/* Add Specification */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 3, alignItems: 'center' }}>
                                <Autocomplete
                                    id="specification-select"
                                    sx={{ flexGrow: 1 }}
                                    options={options}
                                    autoHighlight
                                    getOptionLabel={(option) => option.name || ''}
                                    isOptionEqualToValue={(option, value) => option._id === value._id}
                                    value={selectedAttr}
                                    onChange={(event: any, newValue: any | null) => {
                                        setSelectedAttr(newValue);
                                    }}
                                    onInputChange={(event, newInputValue) => {
                                        setInputValue(newInputValue);
                                    }}
                                    loading={loadingAttrs}
                                    disabled={!watchStoreId}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Search Specifications"
                                            fullWidth
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {loadingAttrs ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <Box component="li" {...props} key={option._id}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="body1">{option.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Type: {option.type}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                />
                                <IconButton
                                    onClick={handleAddSpec}
                                    color="primary"
                                    disabled={!selectedAttr}
                                    sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>

                            {/* Specifications List */}
                            {productSpecs.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                                    No specifications added yet. Search and select a specification above to get started.
                                </Typography>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {productSpecs.map((spec: any) => {
                                        const attrId = typeof spec.attributeId === 'object' ? spec.attributeId._id : spec.attributeId;
                                        if (!attrId) return null; // Skip invalid entries

                                        const attr = getAttribute(spec.attributeId);

                                        return (
                                            <Paper key={attrId} sx={{ p: 2 }} variant="outlined">
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                                                    <Box sx={{ flex: '0 0 150px' }}>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            {attr?.name || 'Loading...'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {attr?.type || ''}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        {renderValueInput(spec)}
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveSpec(attrId)}
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>
                    );
                }}
            />
        </Grid>
    );
}
