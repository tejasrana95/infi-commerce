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
    const [allProductOptions, setAllProductOptions] = useState<any[]>([]);
    const formProductOptions = watch('productOptions') || [];
    const watchStoreId = watch('storeId');

    // Filter only options marked for variation
    const variationOptions = formProductOptions.filter((o: any) => o.isVariation);

    // Fetch all product options to get names and values
    useEffect(() => {
        const fetchProductOptions = async () => {
            if (watchStoreId) {
                try {
                    const response = await api.get('/product-options', {
                        params: { storeId: watchStoreId }
                    });
                    setAllProductOptions(response.data.productOptions || []);
                } catch (err) {
                    console.error('Failed to fetch product options');
                }
            }
        };
        fetchProductOptions();
    }, [watchStoreId]);

    const getOptionName = (optionId: any) => {
        if (typeof optionId === 'object' && optionId?.name) return optionId.name;
        return allProductOptions.find(o => o._id === optionId)?.name || 'Option';
    };

    const getOptionId = (opt: any) => {
        return typeof opt.optionId === 'object' ? opt.optionId._id : opt.optionId;
    };

    return (
        <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>Product Variants</Typography>

            {variationOptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No product options marked for variation. Go to "Product Options" above and select "Use for variations" on at least one option.
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
                                    attributes: {}, // Store option values here for variants
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

                        const handleOptionChange = (index: number, optionId: string, value: string) => {
                            const updated = [...variants];
                            updated[index] = {
                                ...updated[index],
                                attributes: {
                                    ...updated[index].attributes,
                                    [optionId]: value // Use ID as key
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
                                                {variationOptions.map((opt: any) => (
                                                    <TableCell key={getOptionId(opt)}>{getOptionName(opt.optionId)}</TableCell>
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
                                                    {variationOptions.map((opt: any) => {
                                                        const optionId = getOptionId(opt);
                                                        const optionName = getOptionName(opt.optionId);
                                                        // Check both ID and Name for legacy support
                                                        const selectedValue = variant.attributes?.[optionId] || variant.attributes?.[optionName] || '';

                                                        return (
                                                            <TableCell key={optionId}>
                                                                <Select
                                                                    value={selectedValue}
                                                                    onChange={(e) => handleOptionChange(index, optionId, e.target.value)}
                                                                    fullWidth
                                                                    size="small"
                                                                    displayEmpty
                                                                >
                                                                    <MenuItem value="" disabled>Select {optionName}</MenuItem>
                                                                    {opt.values.map((val: string) => (
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
