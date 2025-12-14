'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, IconButton, TextField, Chip, Grid, Checkbox, FormControlLabel } from '@mui/material';
import { Controller } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import api from '@/lib/api';

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
                    const [selectedAttrId, setSelectedAttrId] = useState<string>('');
                    const [attributes, setAttributes] = useState<any[]>([]);
                    const [loadingAttrs, setLoadingAttrs] = useState(false);
                    const productSpecs = field.value || [];

                    // Fetch attributes when store changes
                    useEffect(() => {
                        const fetchAttributes = async () => {
                            if (watchStoreId) {
                                setLoadingAttrs(true);
                                try {
                                    const response = await api.get('/attributes', {
                                        params: { storeId: watchStoreId }
                                    });
                                    setAttributes(response.data.data || response.data.attributes || []);
                                } catch (err) {
                                    console.error('Failed to fetch attributes');
                                } finally {
                                    setLoadingAttrs(false);
                                }
                            }
                        };
                        fetchAttributes();
                    }, [watchStoreId]);

                    const handleAddSpec = () => {
                        if (selectedAttrId && !productSpecs.find((s: any) => s.attributeId === selectedAttrId)) {
                            const attr = attributes.find(a => a._id === selectedAttrId);
                            if (attr) {
                                field.onChange([
                                    ...productSpecs,
                                    {
                                        attributeId: selectedAttrId,
                                        value: attr.type === 'checkbox' ? false : '',
                                    }
                                ]);
                                setSelectedAttrId('');
                            }
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
                        return attributes.find(a => a._id === attrId) || null;
                    };

                    const renderValueInput = (spec: any) => {
                        const attr = getAttribute(spec.attributeId);
                        if (!attr) return null;

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
                            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Specification</InputLabel>
                                    <Select
                                        value={selectedAttrId}
                                        onChange={(e) => setSelectedAttrId(e.target.value)}
                                        label="Select Specification"
                                        disabled={loadingAttrs || !watchStoreId}
                                    >
                                        {attributes
                                            .filter(attr => !productSpecs.find((ps: any) => ps.attributeId === attr._id))
                                            .map(attr => (
                                                <MenuItem key={attr._id} value={attr._id}>
                                                    {attr.name} ({attr.type})
                                                </MenuItem>
                                            ))
                                        }
                                    </Select>
                                </FormControl>
                                <IconButton
                                    onClick={handleAddSpec}
                                    color="primary"
                                    disabled={!selectedAttrId}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>

                            {/* Specifications List */}
                            {productSpecs.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                                    No specifications added yet. Select a specification attribute above to get started.
                                </Typography>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {productSpecs.map((spec: any) => {
                                        const attr = getAttribute(spec.attributeId);
                                        const attrId = typeof spec.attributeId === 'object' ? spec.attributeId._id : spec.attributeId;

                                        return (
                                            <Paper key={attrId} sx={{ p: 2 }} variant="outlined">
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                                                    <Box sx={{ flex: '0 0 150px' }}>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            {attr?.name || 'Unknown'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {attr?.type}
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
