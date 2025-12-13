'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Grid, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, IconButton, Button, Select, MenuItem, FormControl } from '@mui/material';
import { Controller } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import FileManagerButton from '../../molecules/FileManagerButton';

interface VariantManagerProps {
    control: any;
    watch: any;
}

export default function VariantManager({ control, watch }: VariantManagerProps) {
    const [allAttributes, setAllAttributes] = useState<any[]>([]);
    const formAttributes = watch('attributes') || [];
    const watchStoreId = watch('storeId');

    // Filter only attributes marked for variation
    const variationAttributes = formAttributes.filter((a: any) => a.isVariation);

    // Fetch all attributes to get names
    useEffect(() => {
        const fetchAttributes = async () => {
            if (watchStoreId) {
                try {
                    const response = await api.get('/attributes', {
                        params: { storeId: watchStoreId }
                    });
                    setAllAttributes(response.data.attributes || []);
                } catch (err) {
                    console.error('Failed to fetch attributes');
                }
            }
        };
        fetchAttributes();
    }, [watchStoreId]);

    const getAttributeName = (attrId: any) => {
        if (typeof attrId === 'object' && attrId?.name) return attrId.name;
        return allAttributes.find(a => a._id === attrId)?.name || 'Attribute';
    };

    const getAttributeId = (attr: any) => {
        return typeof attr.attributeId === 'object' ? attr.attributeId._id : attr.attributeId;
    };

    return (
        <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>Product Variants</Typography>

            {variationAttributes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No attributes marked for variation. Go to "Product Attributes" and select "Use for variations" on at least one attribute.
                </Typography>
            ) : (
                <Controller
                    name="variants"
                    control={control}
                    render={({ field }) => {
                        const variants = field.value || [];

                        const handleAddVariant = () => {
                            field.onChange([
                                ...variants,
                                {
                                    sku: '',
                                    price: 0,
                                    stock: 0,
                                    weight: 0,
                                    images: [],
                                    attributes: {}, // Will be filled by selects
                                    dimensions: { length: 0, width: 0, height: 0 }
                                }
                            ]);
                        };

                        const handleRemoveVariant = (index: number) => {
                            field.onChange(variants.filter((_: any, i: number) => i !== index));
                        };

                        const handleVariantChange = (index: number, key: string, value: any) => {
                            const updated = [...variants];
                            updated[index] = { ...updated[index], [key]: value };
                            field.onChange(updated);
                        };

                        const handleAttributeChange = (index: number, attrId: string, value: string) => {
                            const updated = [...variants];
                            updated[index] = {
                                ...updated[index],
                                attributes: {
                                    ...updated[index].attributes,
                                    [attrId]: value // Use ID as key
                                }
                            };
                            field.onChange(updated);
                        };

                        return (
                            <Box>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell width={60}>Image</TableCell>
                                                {variationAttributes.map((attr: any) => (
                                                    <TableCell key={getAttributeId(attr)}>{getAttributeName(attr.attributeId)}</TableCell>
                                                ))}
                                                <TableCell width={150}>SKU</TableCell>
                                                <TableCell width={120}>Price</TableCell>
                                                <TableCell width={100}>Stock</TableCell>
                                                <TableCell width={100}>Weight</TableCell>
                                                <TableCell width={50}></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {variants.map((variant: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 200 }}>
                                                            {variant.images && variant.images.map((imgUrl: string, imgIndex: number) => (
                                                                <Box
                                                                    key={imgIndex}
                                                                    sx={{ position: 'relative', width: 40, height: 40 }}
                                                                >
                                                                    <Box
                                                                        component="img"
                                                                        src={imgUrl}
                                                                        sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1 }}
                                                                    />
                                                                    <IconButton
                                                                        size="small"
                                                                        sx={{
                                                                            position: 'absolute',
                                                                            top: -4,
                                                                            right: -4,
                                                                            bgcolor: 'background.paper',
                                                                            p: 0.5,
                                                                            '&:hover': { bgcolor: 'grey.200' }
                                                                        }}
                                                                        onClick={() => {
                                                                            const newImages = [...variant.images];
                                                                            newImages.splice(imgIndex, 1);
                                                                            handleVariantChange(index, 'images', newImages);
                                                                        }}
                                                                    >
                                                                        <DeleteIcon sx={{ fontSize: 10 }} />
                                                                    </IconButton>
                                                                </Box>
                                                            ))}
                                                            <FileManagerButton
                                                                label=""
                                                                onSelect={(files) => {
                                                                    const newImages = [...(variant.images || []), ...files.map(f => f.url)];
                                                                    handleVariantChange(index, 'images', newImages);
                                                                }}
                                                                accept="image/*"
                                                                multiple={true}
                                                                trigger={
                                                                    <IconButton size="small" color="primary" sx={{ width: 40, height: 40, border: '1px dashed grey', borderRadius: 1 }}>
                                                                        <AddIcon fontSize="small" />
                                                                    </IconButton>
                                                                }
                                                            />
                                                        </Box>
                                                    </TableCell>
                                                    {variationAttributes.map((attr: any) => {
                                                        const attrId = getAttributeId(attr);
                                                        const attrName = getAttributeName(attr.attributeId);
                                                        // Check both ID and Name for legacy support
                                                        const selectedValue = variant.attributes?.[attrId] || variant.attributes?.[attrName] || '';

                                                        return (
                                                            <TableCell key={attrId}>
                                                                <Select
                                                                    value={selectedValue}
                                                                    onChange={(e) => handleAttributeChange(index, attrId, e.target.value)}
                                                                    fullWidth
                                                                    size="small"
                                                                    displayEmpty
                                                                >
                                                                    <MenuItem value="" disabled>Select {attrName}</MenuItem>
                                                                    {attr.values.map((val: string) => (
                                                                        <MenuItem key={val} value={val}>{val}</MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell>
                                                        <TextField
                                                            value={variant.sku}
                                                            onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            placeholder="SKU"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            value={variant.price}
                                                            onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)}
                                                            type="number"
                                                            size="small"
                                                            fullWidth
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            value={variant.stock}
                                                            onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)}
                                                            type="number"
                                                            size="small"
                                                            fullWidth
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            value={variant.weight}
                                                            onChange={(e) => handleVariantChange(index, 'weight', parseFloat(e.target.value) || 0)}
                                                            type="number"
                                                            size="small"
                                                            fullWidth
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <IconButton size="small" color="error" onClick={() => handleRemoveVariant(index)}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={handleAddVariant}
                                    sx={{ mt: 2 }}
                                    variant="outlined"
                                >
                                    Add Variant
                                </Button>
                            </Box>
                        );
                    }}
                />
            )}
        </Grid>
    );
}
