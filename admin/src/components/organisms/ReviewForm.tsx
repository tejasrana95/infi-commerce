'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    FormControl,
    FormControlLabel,
    Switch,
    Typography,
    Paper,
    Grid,
    Rating,
    ToggleButton,
    ToggleButtonGroup,
    Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import StoreAutocomplete from '../molecules/StoreAutocomplete';
import ProductAutoComplete from '../molecules/ProductAutoComplete';
import CustomerAutoComplete from '../molecules/CustomerAutoComplete';
import { CustomerOption } from '../molecules/CustomerAutoComplete';

// Validation schema
const schema = z.object({
    storeId: z.string().min(1, 'Store is required'),
    productId: z.string().min(1, 'Product is required'),
    isGuestReview: z.boolean(),
    customerId: z.string().optional(),
    guestName: z.string().optional(),
    guestEmail: z.string().email().optional().or(z.literal('')),
    guestEmailVerified: z.boolean().optional(),
    rating: z.number().min(1, 'Rating is required').max(5),
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    content: z.string().min(10, 'Review must be at least 10 characters').max(5000),
    isApproved: z.boolean(),
    isVerifiedPurchase: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface ReviewFormProps {
    initialData?: any;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function ReviewForm({ initialData, onSubmit, isSubmitting = false }: ReviewFormProps) {
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

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
            productId: '',
            isGuestReview: false,
            customerId: '',
            guestName: '',
            guestEmail: '',
            guestEmailVerified: false,
            rating: 5,
            title: '',
            content: '',
            isApproved: false,
            isVerifiedPurchase: false,
        },
    });

    const watchStoreId = watch('storeId');
    const watchIsGuestReview = watch('isGuestReview');
    const watchRating = watch('rating');

    // Initialize form with existing data
    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' ? initialData.storeId._id : initialData.storeId;
            const productId = typeof initialData.productId === 'object' ? initialData.productId._id : initialData.productId;

            setValue('storeId', storeId || '');
            setValue('productId', productId || '');
            setValue('isGuestReview', initialData.isGuestReview || false);
            setValue('customerId', initialData.customerId?._id || '');
            setValue('guestName', initialData.guestName || '');
            setValue('guestEmail', initialData.guestEmail || '');
            setValue('guestEmailVerified', initialData.guestEmailVerified || false);
            setValue('rating', initialData.rating || 5);
            setValue('title', initialData.title || '');
            setValue('content', initialData.content || '');
            setValue('isApproved', initialData.isApproved || false);
            setValue('isVerifiedPurchase', initialData.isVerifiedPurchase || false);

            if (initialData.productId && typeof initialData.productId === 'object') {
                setSelectedProduct(initialData.productId);
            }
            if (initialData.customerId && typeof initialData.customerId === 'object') {
                setSelectedCustomer({
                    _id: initialData.customerId._id,
                    firstName: initialData.customerId.firstName,
                    lastName: initialData.customerId.lastName,
                    email: initialData.customerId.email,
                    isActive: initialData.customerId.isActive ?? true,
                });
            }
        }
    }, [initialData, setValue]);

    const handleFormSubmit = handleSubmit((data) => {
        // Validate guest vs customer
        if (data.isGuestReview) {
            if (!data.guestName || !data.guestEmail) {
                return;
            }
        } else {
            if (!data.customerId) {
                return;
            }
        }
        onSubmit(data);
    });

    return (
        <form onSubmit={handleFormSubmit} id="review-form">
            <Box display="flex" flexDirection="column" gap={3}>
                {/* Store and Product Selection */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Product</Typography>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="storeId"
                                control={control}
                                render={({ field }) => (
                                    <StoreAutocomplete
                                        value={field.value}
                                        onChange={(value) => {
                                            field.onChange(value);
                                            // Clear product when store changes
                                            setValue('productId', '');
                                            setSelectedProduct(null);
                                        }}
                                        error={!!errors.storeId}
                                        helperText={errors.storeId?.message}
                                        required
                                        disabled={!!initialData}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="productId"
                                control={control}
                                render={({ field }) => (
                                    <ProductAutoComplete
                                        storeId={watchStoreId}
                                        value={selectedProduct}
                                        onChange={(product) => {
                                            setSelectedProduct(product);
                                            field.onChange(product?._id || '');
                                        }}
                                        label="Product"
                                        error={!!errors.productId}
                                        helperText={errors.productId?.message}
                                        required
                                        disabled={!!initialData}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Reviewer Information */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Reviewer</Typography>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="isGuestReview"
                                control={control}
                                render={({ field }) => (
                                    <ToggleButtonGroup
                                        value={field.value ? 'guest' : 'customer'}
                                        exclusive
                                        onChange={(_, value) => {
                                            if (value !== null) {
                                                field.onChange(value === 'guest');
                                                // Clear relevant fields
                                                if (value === 'guest') {
                                                    setValue('customerId', '');
                                                    setSelectedCustomer(null);
                                                } else {
                                                    setValue('guestName', '');
                                                    setValue('guestEmail', '');
                                                    setValue('guestEmailVerified', false);
                                                }
                                            }
                                        }}
                                        disabled={!!initialData}
                                    >
                                        <ToggleButton value="customer">Customer Review</ToggleButton>
                                        <ToggleButton value="guest">Guest Review</ToggleButton>
                                    </ToggleButtonGroup>
                                )}
                            />
                        </Grid>

                        {watchIsGuestReview ? (
                            <>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Controller
                                        name="guestName"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Guest Name"
                                                fullWidth
                                                required
                                                error={!!errors.guestName}
                                                helperText={errors.guestName?.message}
                                                disabled={!!initialData}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Controller
                                        name="guestEmail"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Guest Email"
                                                type="email"
                                                fullWidth
                                                required
                                                error={!!errors.guestEmail}
                                                helperText={errors.guestEmail?.message}
                                                disabled={!!initialData}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Controller
                                        name="guestEmailVerified"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                }
                                                label="Email Verified"
                                            />
                                        )}
                                    />
                                </Grid>
                            </>
                        ) : (
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="customerId"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomerAutoComplete
                                            value={selectedCustomer}
                                            onChange={(customer) => {
                                                setSelectedCustomer(customer);
                                                field.onChange(customer?._id || '');
                                            }}
                                            label="Customer"
                                            error={!!errors.customerId}
                                            helperText={errors.customerId?.message as string}
                                            disabled={!!initialData}
                                        />
                                    )}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Paper>

                {/* Review Content */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Review Content</Typography>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Typography>Rating:</Typography>
                                <Controller
                                    name="rating"
                                    control={control}
                                    render={({ field }) => (
                                        <Rating
                                            value={field.value}
                                            onChange={(_, value) => field.onChange(value || 1)}
                                            size="large"
                                        />
                                    )}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    ({watchRating} star{watchRating !== 1 ? 's' : ''})
                                </Typography>
                            </Box>
                            {errors.rating && (
                                <Typography variant="caption" color="error">
                                    {errors.rating.message}
                                </Typography>
                            )}
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="title"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Review Title"
                                        fullWidth
                                        required
                                        error={!!errors.title}
                                        helperText={errors.title?.message}
                                        placeholder="E.g., Great product, highly recommend!"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="content"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Review Content"
                                        fullWidth
                                        required
                                        multiline
                                        rows={4}
                                        error={!!errors.content}
                                        helperText={errors.content?.message}
                                        placeholder="Write your review here..."
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Status */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Status</Typography>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="isApproved"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={field.value}
                                                onChange={field.onChange}
                                            />
                                        }
                                        label="Approved"
                                    />
                                )}
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                                Only approved reviews are visible to customers
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="isVerifiedPurchase"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={field.value}
                                                onChange={field.onChange}
                                            />
                                        }
                                        label="Verified Purchase"
                                    />
                                )}
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                                Mark if reviewer purchased this product
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </form>
    );
}
