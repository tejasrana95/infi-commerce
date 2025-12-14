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
    Alert,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import StoreAutocomplete from '../molecules/StoreAutocomplete';
import CategoryAutocomplete, { CategoryOption } from '../molecules/CategoryAutocomplete';
import { useCurrency } from '@/contexts/CurrencyContext';

// Validation schema
const schema = z.object({
    code: z.string().min(3, 'Coupon code must be at least 3 characters').max(20, 'Coupon code must be max 20 characters'),
    storeId: z.string().min(1, 'Store is required'),
    description: z.string().optional(),
    discountType: z.enum(['flat', 'percentage']),
    discountValue: z.number().min(0.01, 'Discount value must be greater than 0'),
    applyTo: z.enum(['store', 'categories']),
    categoryIds: z.array(z.string()).optional(),
    minCartValue: z.number().min(0).optional(),
    maxDiscountAmount: z.number().min(0).optional(),
    usageLimit: z.number().min(1).optional(),
    perCustomerLimit: z.number().min(1).optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface CouponFormProps {
    initialData?: any;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function CouponForm({ initialData, onSubmit, isSubmitting = false }: CouponFormProps) {
    const [tempCategory, setTempCategory] = useState<CategoryOption | null>(null);
    const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            code: '',
            storeId: '',
            description: '',
            discountType: 'percentage',
            discountValue: 10,
            applyTo: 'store',
            categoryIds: [],
            minCartValue: undefined,
            maxDiscountAmount: undefined,
            usageLimit: undefined,
            perCustomerLimit: undefined,
            startDate: '',
            endDate: '',
            isActive: true,
        },
    });

    const watchStoreId = watch('storeId');
    const watchDiscountType = watch('discountType');
    const watchApplyTo = watch('applyTo');
    const watchCategoryIds = watch('categoryIds') || [];

    const { baseCurrency } = useCurrency();

    // Initialize form with existing data
    useEffect(() => {
        if (initialData) {
            setValue('code', initialData.code || '');
            setValue('storeId', typeof initialData.storeId === 'object' ? initialData.storeId._id : initialData.storeId || '');
            setValue('description', initialData.description || '');
            setValue('discountType', initialData.discountType || 'percentage');
            setValue('discountValue', initialData.discountValue || 0);
            setValue('applyTo', initialData.applyTo || 'store');
            setValue('categoryIds', initialData.categoryIds?.map((c: any) => typeof c === 'object' ? c._id : c) || []);
            setValue('minCartValue', initialData.minCartValue);
            setValue('maxDiscountAmount', initialData.maxDiscountAmount);
            setValue('usageLimit', initialData.usageLimit);
            setValue('perCustomerLimit', initialData.perCustomerLimit);

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
            // Build name maps from populated data
            if (initialData.categoryIds) {
                const catMap: Record<string, string> = {};
                initialData.categoryIds.forEach((c: any) => {
                    if (typeof c === 'object' && c._id) {
                        catMap[c._id] = c.name || c.title || c._id;
                    }
                });
                setCategoryNames(catMap);
            }
        }
    }, [initialData, setValue]);

    const handleFormSubmit = (data: FormData) => {
        // Clean up data based on applyTo
        const cleanedData = {
            ...data,
            code: data.code.toUpperCase(),
            categoryIds: data.applyTo === 'categories' ? data.categoryIds : [],
            minCartValue: data.minCartValue || undefined,
            maxDiscountAmount: data.maxDiscountAmount || undefined,
            usageLimit: data.usageLimit || undefined,
            perCustomerLimit: data.perCustomerLimit || undefined,
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

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setValue('code', code);
    };

    return (
        <Box component="form" id="coupon-form" onSubmit={handleSubmit(handleFormSubmit)}>
            {/* Coupon Code */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Coupon Code</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="code"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Coupon Code"
                                    fullWidth
                                    required
                                    error={!!errors.code}
                                    helperText={errors.code?.message || 'Will be converted to uppercase'}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Chip
                                                    label="Generate"
                                                    size="small"
                                                    onClick={generateCode}
                                                    clickable
                                                />
                                            </InputAdornment>
                                        ),
                                        sx: { fontFamily: 'monospace', textTransform: 'uppercase' }
                                    }}
                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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
                                    helperText="Optional: Displayed to customers"
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
                            name="discountType"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel>Discount Type</InputLabel>
                                    <Select {...field} label="Discount Type">
                                        <MenuItem value="percentage">Percentage OFF</MenuItem>
                                        <MenuItem value="flat">Fixed Amount OFF</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="discountValue"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={watchDiscountType === 'percentage' ? 'Percentage' : 'Amount'}
                                    type="number"
                                    fullWidth
                                    required
                                    error={!!errors.discountValue}
                                    helperText={errors.discountValue?.message}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {watchDiscountType === 'percentage' ? '%' : (baseCurrency?.symbol || '$')}
                                            </InputAdornment>
                                        )
                                    }}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                            )}
                        />
                    </Grid>

                    {watchDiscountType === 'percentage' && (
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="maxDiscountAmount"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        label="Max Discount Cap"
                                        type="number"
                                        fullWidth
                                        helperText="Optional: Maximum discount amount"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">{baseCurrency?.symbol || '$'}</InputAdornment>
                                        }}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                )}
                            />
                        </Grid>
                    )}

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="minCartValue"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label="Minimum Cart Value"
                                    type="number"
                                    fullWidth
                                    helperText="Optional: Minimum purchase required"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">{baseCurrency?.symbol || '$'}</InputAdornment>
                                    }}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Apply To */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Apply To</Typography>
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
                                    <ToggleButton value="store">Entire Store</ToggleButton>
                                    <ToggleButton value="categories">Specific Categories</ToggleButton>
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
                                        onChange={(_, category) => setTempCategory(category || null)}
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
                                    Select at least one category for the coupon to apply.
                                </Alert>
                            )}
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Usage Limits */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Usage Limits</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="usageLimit"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label="Total Usage Limit"
                                    type="number"
                                    fullWidth
                                    helperText="Optional: Max total uses (leave empty for unlimited)"
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="perCustomerLimit"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label="Per Customer Limit"
                                    type="number"
                                    fullWidth
                                    helperText="Optional: Max uses per customer"
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                            )}
                        />
                    </Grid>

                    {initialData && (
                        <Grid size={{ xs: 12 }}>
                            <Alert severity="info">
                                Current usage: <strong>{initialData.usageCount || 0}</strong>
                                {initialData.usageLimit && ` / ${initialData.usageLimit}`}
                            </Alert>
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
                                    label="Coupon is Active"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
