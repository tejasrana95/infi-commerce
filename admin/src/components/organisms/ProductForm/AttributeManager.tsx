'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, IconButton, FormControlLabel, Checkbox, Chip, Grid } from '@mui/material';
import { Controller } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import api from '@/lib/api';

interface AttributeManagerProps {
    control: any;
    watchStoreId: string;
}

export default function AttributeManager({ control, watchStoreId }: AttributeManagerProps) {
    return (
        <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Product Attributes</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select attributes for this product. Mark attributes as "Used for variations" to create product variants.
            </Typography>

            <Controller
                name="attributes"
                control={control}
                render={({ field }) => {
                    const [selectedAttrId, setSelectedAttrId] = useState<string>('');
                    const [attributes, setAttributes] = useState<any[]>([]);
                    const [loadingAttrs, setLoadingAttrs] = useState(false);
                    const productAttributes = field.value || [];

                    // Fetch attributes when store changes
                    useEffect(() => {
                        const fetchAttributes = async () => {
                            if (watchStoreId) {
                                setLoadingAttrs(true);
                                try {
                                    const response = await api.get('/attributes', {
                                        params: { storeId: watchStoreId }
                                    });
                                    setAttributes(response.data.attributes || []);
                                } catch (err) {
                                    console.error('Failed to fetch attributes');
                                } finally {
                                    setLoadingAttrs(false);
                                }
                            }
                        };
                        fetchAttributes();
                    }, [watchStoreId]);

                    const handleAddAttribute = () => {
                        if (selectedAttrId && !productAttributes.find((a: any) => a.attributeId === selectedAttrId)) {
                            const attr = attributes.find(a => a._id === selectedAttrId);
                            if (attr) {
                                field.onChange([
                                    ...productAttributes,
                                    {
                                        attributeId: selectedAttrId,
                                        values: [],
                                        isVariation: false,
                                    }
                                ]);
                                setSelectedAttrId('');
                            }
                        }
                    };

                    const handleRemoveAttribute = (attrId: string) => {
                        field.onChange(productAttributes.filter((a: any) => a.attributeId !== attrId));
                    };

                    const handleToggleVariation = (attrId: string) => {
                        field.onChange(productAttributes.map((a: any) =>
                            a.attributeId === attrId ? { ...a, isVariation: !a.isVariation } : a
                        ));
                    };

                    const handleAddValue = (attrId: string, value: string) => {
                        field.onChange(productAttributes.map((a: any) =>
                            a.attributeId === attrId && !a.values.includes(value)
                                ? { ...a, values: [...a.values, value] }
                                : a
                        ));
                    };

                    const handleRemoveValue = (attrId: string, value: string) => {
                        field.onChange(productAttributes.map((a: any) =>
                            a.attributeId === attrId
                                ? { ...a, values: a.values.filter((v: string) => v !== value) }
                                : a
                        ));
                    };

                    const getAttributeName = (attrId: any) => {
                        // If attrId is populated object
                        if (typeof attrId === 'object' && attrId?.name) {
                            return attrId.name;
                        }
                        // If it's just an ID string, find in our fetched attributes
                        return attributes.find(a => a._id === attrId)?.name || 'Unknown Attribute';
                    };

                    const getAttributeValues = (attrId: any) => {
                        // If attrId is populated object
                        if (typeof attrId === 'object' && attrId?.values) {
                            return attrId.values;
                        }
                        // If it's just an ID string, find in our fetched attributes
                        const attr = attributes.find(a => a._id === attrId);
                        return attr?.values || [];
                    };

                    return (
                        <Box>
                            {/* Add Attribute */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Attribute</InputLabel>
                                    <Select
                                        value={selectedAttrId}
                                        onChange={(e) => setSelectedAttrId(e.target.value)}
                                        label="Select Attribute"
                                        disabled={loadingAttrs || !watchStoreId}
                                    >
                                        {attributes
                                            .filter(attr => !productAttributes.find((pa: any) => pa.attributeId === attr._id))
                                            .map(attr => (
                                                <MenuItem key={attr._id} value={attr._id}>
                                                    {attr.name}
                                                </MenuItem>
                                            ))
                                        }
                                    </Select>
                                </FormControl>
                                <IconButton
                                    onClick={handleAddAttribute}
                                    color="primary"
                                    disabled={!selectedAttrId}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>

                            {/* Attribute List */}
                            {productAttributes.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                                    No attributes added yet. Select an attribute above to get started.
                                </Typography>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {productAttributes.map((prodAttr: any) => {
                                        // Handle both populated object and string ID
                                        const attrId = typeof prodAttr.attributeId === 'object' ? prodAttr.attributeId._id : prodAttr.attributeId;

                                        return (
                                            <Paper key={attrId} sx={{ p: 2 }} variant="outlined">
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="subtitle1" fontWeight={600}>
                                                        {getAttributeName(prodAttr.attributeId)}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={prodAttr.isVariation}
                                                                    onChange={() => handleToggleVariation(prodAttr.attributeId)}
                                                                    size="small"
                                                                />
                                                            }
                                                            label={<Typography variant="caption">Use for variations</Typography>}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveAttribute(prodAttr.attributeId)}
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                {/* Attribute Values */}
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {getAttributeValues(prodAttr.attributeId).map((attrVal: any) => {
                                                        const isSelected = prodAttr.values.includes(attrVal.value);
                                                        return (
                                                            <Chip
                                                                key={attrVal.value}
                                                                label={attrVal.label || attrVal.value}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        handleRemoveValue(prodAttr.attributeId, attrVal.value);
                                                                    } else {
                                                                        handleAddValue(prodAttr.attributeId, attrVal.value);
                                                                    }
                                                                }}
                                                                color={isSelected ? 'primary' : 'default'}
                                                                variant={isSelected ? 'filled' : 'outlined'}
                                                                deleteIcon={isSelected ? <CloseIcon /> : undefined}
                                                                onDelete={isSelected ? () => handleRemoveValue(prodAttr.attributeId, attrVal.value) : undefined}
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
