'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Checkbox,
    FormControlLabel,
    Typography,
    Paper,
    Grid,
    Chip,
    IconButton,
    Divider,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import StoreAutocomplete from '../molecules/StoreAutocomplete';
import CategoryAutocomplete, { CategoryOption } from '../molecules/CategoryAutocomplete';
import ProductAutocomplete, { ProductOption } from '../molecules/ProductAutoComplete';
import { useCurrency } from '@/contexts/CurrencyContext';

// Validation schema
const schema = z.object({
    storeId: z.string().min(1, 'Store is required'),
    name: z.string().min(1, 'Sale name is required'),
    description: z.string().optional(),
    type: z.enum(['percentage', 'fixed']),
    value: z.number().min(0.01, 'Discount value must be greater than 0'),
    applyTo: z.enum(['categories', 'products', 'all']),
    categoryIds: z.array(z.string()).optional(),
    productIds: z.array(z.string()).optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    isActive: z.boolean(),
    priority: z.number().min(0),
    minPurchaseAmount: z.number().min(0).optional(),
    maxDiscountAmount: z.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

interface SaleFormProps {
    initialData?: any;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function SaleForm({ initialData, onSubmit, isSubmitting = false }: SaleFormProps) {
    const [tempCategory, setTempCategory] = useState<CategoryOption | null>(null);
    const [tempProduct, setTempProduct] = useState<ProductOption | null>(null);
    const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
    const [productNames, setProductNames] = useState<Record<string, string>>({});

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            storeId: '',
            name: '',
            description: '',
            type: 'percentage',
            value: 10,
            applyTo: 'all',
            categoryIds: [],
            productIds: [],
            startDate: '',
            endDate: '',
            isActive: true,
            priority: 0,
            minPurchaseAmount: undefined,
            maxDiscountAmount: undefined,
        },
    });

    const { baseCurrency } = useCurrency();

    const watchStoreId = watch('storeId');
    const watchType = watch('type');
    const watchApplyTo = watch('applyTo');
    const watchCategoryIds = watch('categoryIds') || [];
    const watchProductIds = watch('productIds') || [];

    // Initialize form with existing data
    useEffect(() => {
        if (initialData) {
            setValue('storeId', typeof initialData.storeId === 'object' ? initialData.storeId._id : initialData.storeId || '');
            setValue('name', initialData.name || '');
            setValue('description', initialData.description || '');
            setValue('type', initialData.type || 'percentage');
            setValue('value', initialData.value || 0);
            setValue('applyTo', initialData.applyTo || 'all');
            setValue('categoryIds', initialData.categoryIds?.map((c: any) => typeof c === 'object' ? c._id : c) || []);
            setValue('productIds', initialData.productIds?.map((p: any) => typeof p === 'object' ? p._id : p) || []);

            // Format dates for datetime-local input
            if (initialData.startDate) {
                const startDate = new Date(initialData.startDate);
                setValue('startDate', startDate.toISOString().slice(0, 16));
            }
            if (initialData.endDate) {
                const endDate = new Date(initialData.endDate);
                setValue('endDate', endDate.toISOString().slice(0, 16));
            }

            setValue('isActive', initialData.isActive !== undefined ? initialData.isActive : true);
            setValue('priority', initialData.priority || 0);
            setValue('minPurchaseAmount', initialData.minPurchaseAmount);
            setValue('maxDiscountAmount', initialData.maxDiscountAmount);

            // Build name maps from populated data
            if (initialData.categoryIds) {
                const catMap: Record<string, string> = {};
                initialData.categoryIds.forEach((c: any) => {
                    if (typeof c === 'object' && c._id) {
                        catMap[c._id] = c.title || c.name;
                    }
                });
                setCategoryNames(catMap);
            }
            if (initialData.productIds) {
                const prodMap: Record<string, string> = {};
                initialData.productIds.forEach((p: any) => {
                    if (typeof p === 'object' && p._id) {
                        prodMap[p._id] = p.name;
                    }
                });
                setProductNames(prodMap);
            }
        }
    }, [initialData, setValue]);

    const handleFormSubmit = (data: FormData) => {
        // Clean up data based on applyTo
        const cleanedData = {
            ...data,
            categoryIds: data.applyTo === 'categories' ? data.categoryIds : [],
            productIds: data.applyTo === 'products' ? data.productIds : [],
            minPurchaseAmount: data.minPurchaseAmount || undefined,
            maxDiscountAmount: data.maxDiscountAmount || undefined,
        };
        onSubmit(cleanedData);
    };

    const handleAddCategory = () => {
        if (tempCategory && !watchCategoryIds.includes(tempCategory._id)) {
            setValue('categoryIds', [...watchCategoryIds, tempCategory._id]);
            setCategoryNames(prev => ({ ...prev, [tempCategory._id]: tempCategory.title || tempCategory.label }));
            setTempCategory(null);
        }
    };

    const handleRemoveCategory = (catId: string) => {
        setValue('categoryIds', watchCategoryIds.filter(id => id !== catId));
    };

    const handleAddProduct = () => {
        if (tempProduct && !watchProductIds.includes(tempProduct._id)) {
            setValue('productIds', [...watchProductIds, tempProduct._id]);
            setProductNames(prev => ({ ...prev, [tempProduct._id]: tempProduct.name }));
            setTempProduct(null);
        }
    };

    const handleRemoveProduct = (prodId: string) => {
        setValue('productIds', watchProductIds.filter(id => id !== prodId));
    };

    return (
        <Box component="form" id="sale-form" onSubmit={handleSubmit(handleFormSubmit)}>
            {/* Basic Info */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Sale Name"
                                    fullWidth
                                    required
                                    error={!!errors.name}
                                    helperText={errors.name?.message || 'E.g., "Summer Sale", "Black Friday"'}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="storeId"
                            control={control}
                            render={({ field }) => (
                                <StoreAutocomplete
                                    value={field.value}
                                    onChange={field.onChange}
                                    label="Store"
                                    required
                                    error={!!errors.storeId}
                                    helperText={errors.storeId?.message}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    helperText="Optional description for this sale"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Discount Configuration */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Discount</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel>Discount Type</InputLabel>
                                    <Select {...field} label="Discount Type">
                                        <MenuItem value="percentage">Percentage OFF</MenuItem>
                                        <MenuItem value="fixed">Fixed Amount OFF</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="value"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={watchType === 'percentage' ? 'Percentage' : 'Amount'}
                                    type="number"
                                    fullWidth
                                    required
                                    error={!!errors.value}
                                    helperText={errors.value?.message || (watchType === 'percentage' ? 'E.g., 10 for 10% off' : 'Fixed discount amount')}
                                    InputProps={{
                                        endAdornment: watchType === 'percentage' ? '%' : (baseCurrency?.symbol || '$')
                                    }}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="priority"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Priority"
                                    type="number"
                                    fullWidth
                                    helperText="Higher priority sales apply first"
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="minPurchaseAmount"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label="Minimum Purchase Amount"
                                    type="number"
                                    fullWidth
                                    helperText="Optional: Minimum cart value to apply sale"
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="maxDiscountAmount"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label="Maximum Discount Amount"
                                    type="number"
                                    fullWidth
                                    helperText="Optional: Cap the maximum discount"
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Apply To */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Apply Sale To</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="applyTo"
                            control={control}
                            render={({ field }) => (
                                <ToggleButtonGroup
                                    value={field.value}
                                    exclusive
                                    onChange={(_, value) => value && field.onChange(value)}
                                    fullWidth
                                >
                                    <ToggleButton value="all">All Products</ToggleButton>
                                    <ToggleButton value="categories">Specific Categories</ToggleButton>
                                    <ToggleButton value="products">Specific Products</ToggleButton>
                                </ToggleButtonGroup>
                            )}
                        />
                    </Grid>

                    {/* Category Selection */}
                    {watchApplyTo === 'categories' && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Categories</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <CategoryAutocomplete
                                        value={tempCategory?._id || null}
                                        onChange={(_, category) => setTempCategory((category as CategoryOption | null) || null)}
                                        storeId={watchStoreId}
                                        label="Add Category"
                                    />
                                </Box>
                                <IconButton onClick={handleAddCategory} color="primary" disabled={!tempCategory}>
                                    <AddIcon />
                                </IconButton>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {watchCategoryIds.map(catId => (
                                    <Chip
                                        key={catId}
                                        label={categoryNames[catId] || catId}
                                        onDelete={() => handleRemoveCategory(catId)}
                                        deleteIcon={<CloseIcon />}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                            {watchCategoryIds.length === 0 && (
                                <Alert severity="warning" sx={{ mt: 1 }}>
                                    Select at least one category for the sale to apply.
                                </Alert>
                            )}
                        </Grid>
                    )}

                    {/* Product Selection */}
                    {watchApplyTo === 'products' && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Products</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <ProductAutocomplete
                                        value={tempProduct}
                                        onChange={setTempProduct}
                                        storeId={watchStoreId}
                                        label="Add Product"
                                    />
                                </Box>
                                <IconButton onClick={handleAddProduct} color="primary" disabled={!tempProduct}>
                                    <AddIcon />
                                </IconButton>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {watchProductIds.map(prodId => (
                                    <Chip
                                        key={prodId}
                                        label={productNames[prodId] || prodId}
                                        onDelete={() => handleRemoveProduct(prodId)}
                                        deleteIcon={<CloseIcon />}
                                        color="secondary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                            {watchProductIds.length === 0 && (
                                <Alert severity="warning" sx={{ mt: 1 }}>
                                    Select at least one product for the sale to apply.
                                </Alert>
                            )}
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Date Range & Status */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Schedule & Status</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="startDate"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Start Date"
                                    type="datetime-local"
                                    fullWidth
                                    required
                                    error={!!errors.startDate}
                                    helperText={errors.startDate?.message}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="endDate"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="End Date"
                                    type="datetime-local"
                                    fullWidth
                                    required
                                    error={!!errors.endDate}
                                    helperText={errors.endDate?.message}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Sale is Active"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
