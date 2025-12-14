'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, IconButton, FormControlLabel, Checkbox, Chip, Grid } from '@mui/material';
import { Controller } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import api from '@/lib/api';

interface ProductOptionManagerProps {
    control: any;
    watchStoreId: string;
}

export default function ProductOptionManager({ control, watchStoreId }: ProductOptionManagerProps) {
    return (
        <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Product Options</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select options for this product. Mark options as "Used for variations" to create product variants (e.g., Color → Red/Blue, Size → S/M/L).
            </Typography>

            <Controller
                name="productOptions"
                control={control}
                render={({ field }) => {
                    const [selectedOptionId, setSelectedOptionId] = useState<string>('');
                    const [productOptions, setProductOptions] = useState<any[]>([]);
                    const [loadingOptions, setLoadingOptions] = useState(false);
                    const selectedProductOptions = field.value || [];

                    // Fetch product options when store changes
                    useEffect(() => {
                        const fetchProductOptions = async () => {
                            if (watchStoreId) {
                                setLoadingOptions(true);
                                try {
                                    const response = await api.get('/product-options', {
                                        params: { storeId: watchStoreId }
                                    });
                                    setProductOptions(response.data.productOptions || []);
                                } catch (err) {
                                    console.error('Failed to fetch product options');
                                } finally {
                                    setLoadingOptions(false);
                                }
                            }
                        };
                        fetchProductOptions();
                    }, [watchStoreId]);

                    const handleAddOption = () => {
                        if (selectedOptionId && !selectedProductOptions.find((a: any) => a.optionId === selectedOptionId)) {
                            const option = productOptions.find(o => o._id === selectedOptionId);
                            if (option) {
                                field.onChange([
                                    ...selectedProductOptions,
                                    {
                                        optionId: selectedOptionId,
                                        values: [],
                                        isVariation: true, // Default to true for product options
                                    }
                                ]);
                                setSelectedOptionId('');
                            }
                        }
                    };

                    const handleRemoveOption = (optionId: string) => {
                        field.onChange(selectedProductOptions.filter((a: any) => a.optionId !== optionId));
                    };

                    const handleToggleVariation = (optionId: string) => {
                        field.onChange(selectedProductOptions.map((a: any) =>
                            a.optionId === optionId ? { ...a, isVariation: !a.isVariation } : a
                        ));
                    };

                    const handleAddValue = (optionId: string, value: string) => {
                        field.onChange(selectedProductOptions.map((a: any) =>
                            a.optionId === optionId && !a.values.includes(value)
                                ? { ...a, values: [...a.values, value] }
                                : a
                        ));
                    };

                    const handleRemoveValue = (optionId: string, value: string) => {
                        field.onChange(selectedProductOptions.map((a: any) =>
                            a.optionId === optionId
                                ? { ...a, values: a.values.filter((v: string) => v !== value) }
                                : a
                        ));
                    };

                    const getOptionName = (optionId: any) => {
                        if (typeof optionId === 'object' && optionId?.name) {
                            return optionId.name;
                        }
                        return productOptions.find(o => o._id === optionId)?.name || 'Unknown Option';
                    };

                    const getOptionValues = (optionId: any) => {
                        if (typeof optionId === 'object' && optionId?.values) {
                            return optionId.values;
                        }
                        const option = productOptions.find(o => o._id === optionId);
                        return option?.values || [];
                    };

                    return (
                        <Box>
                            {/* Add Option */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Product Option</InputLabel>
                                    <Select
                                        value={selectedOptionId}
                                        onChange={(e) => setSelectedOptionId(e.target.value)}
                                        label="Select Product Option"
                                        disabled={loadingOptions || !watchStoreId}
                                    >
                                        {productOptions
                                            .filter(opt => !selectedProductOptions.find((po: any) => po.optionId === opt._id))
                                            .map(opt => (
                                                <MenuItem key={opt._id} value={opt._id}>
                                                    {opt.name} ({opt.type})
                                                </MenuItem>
                                            ))
                                        }
                                    </Select>
                                </FormControl>
                                <IconButton
                                    onClick={handleAddOption}
                                    color="primary"
                                    disabled={!selectedOptionId}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>

                            {/* Option List */}
                            {selectedProductOptions.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                                    No product options added yet. Select an option above to get started.
                                </Typography>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {selectedProductOptions.map((prodOption: any) => {
                                        const optionId = typeof prodOption.optionId === 'object' ? prodOption.optionId._id : prodOption.optionId;

                                        return (
                                            <Paper key={optionId} sx={{ p: 2 }} variant="outlined">
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="subtitle1" fontWeight={600}>
                                                        {getOptionName(prodOption.optionId)}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={prodOption.isVariation}
                                                                    onChange={() => handleToggleVariation(prodOption.optionId)}
                                                                    size="small"
                                                                />
                                                            }
                                                            label={<Typography variant="caption">Use for variations</Typography>}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveOption(prodOption.optionId)}
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                {/* Option Values */}
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {getOptionValues(prodOption.optionId).map((optVal: any) => {
                                                        const isSelected = prodOption.values.includes(optVal.value);
                                                        return (
                                                            <Chip
                                                                key={optVal.value}
                                                                label={optVal.label || optVal.value}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        handleRemoveValue(prodOption.optionId, optVal.value);
                                                                    } else {
                                                                        handleAddValue(prodOption.optionId, optVal.value);
                                                                    }
                                                                }}
                                                                color={isSelected ? 'primary' : 'default'}
                                                                variant={isSelected ? 'filled' : 'outlined'}
                                                                deleteIcon={isSelected ? <CloseIcon /> : undefined}
                                                                onDelete={isSelected ? () => handleRemoveValue(prodOption.optionId, optVal.value) : undefined}
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            </Paper>
                                        )
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
