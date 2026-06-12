'use client';

import { useEffect } from 'react';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    Grid,
    Typography,
    Rating,
    Paper,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Testimonial } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';

// Validation Schema
const schema = z.object({
    customerName: z.string().min(1, 'Customer name is required'),
    storeId: z.string().min(1, 'Store is required'),
    customerTitle: z.string().optional(),
    customerImage: z.string().optional(),
    productPurchased: z.string().optional(),
    content: z.string().min(10, 'Testimonial content is required (min 10 characters)'),
    rating: z.number().min(1).max(5).optional(),
    isActive: z.boolean(),
    order: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

const defaultValues: FormData = {
    customerName: '',
    storeId: '',
    customerTitle: '',
    customerImage: '',
    productPurchased: '',
    content: '',
    rating: 5,
    isActive: true,
    order: 0,
};

interface TestimonialFormProps {
    initialData?: Testimonial;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function TestimonialForm({ initialData, onSubmit, isSubmitting = false }: TestimonialFormProps) {
    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? initialData.storeId._id
                : initialData.storeId;

            reset({
                customerName: initialData.customerName || '',
                storeId: storeId || '',
                customerTitle: initialData.customerTitle || '',
                customerImage: initialData.customerImage || '',
                productPurchased: initialData.productPurchased || '',
                content: initialData.content || '',
                rating: initialData.rating || 5,
                isActive: initialData.isActive ?? true,
                order: initialData.order || 0,
            });
        }
    }, [initialData, reset]);

    const handleImageSelect = (files: FileItem[]) => {
        if (files.length > 0) {
            setValue('customerImage', files[0].url);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Left Column - Main Content */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Customer Information
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Controller
                                    name="customerName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Customer Name"
                                            fullWidth
                                            required
                                            error={!!errors.customerName}
                                            helperText={errors.customerName?.message}
                                            placeholder="John Doe"
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Controller
                                    name="customerTitle"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Customer Title / Role"
                                            fullWidth
                                            placeholder="CEO, Acme Corp"
                                            helperText="Optional job title or company"
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Controller
                                    name="productPurchased"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Product Purchased"
                                            fullWidth
                                            placeholder="Standard Widget"
                                            helperText="Optional verified product"
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12 }}>
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Customer Photo (Optional)
                                    </Typography>
                                    <Controller
                                        name="customerImage"
                                        control={control}
                                        render={({ field }) => (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <FileManagerButton
                                                    onSelect={handleImageSelect}
                                                    accept="image/*"
                                                    label="Choose Photo"
                                                />
                                                {field.value && (
                                                    <Box
                                                        sx={{
                                                            width: 60,
                                                            height: 60,
                                                            borderRadius: '50%',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <img
                                                            src={field.value}
                                                            alt="Customer"
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                            }}
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Testimonial Content
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="content"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Testimonial"
                                            fullWidth
                                            required
                                            multiline
                                            rows={6}
                                            error={!!errors.content}
                                            helperText={errors.content?.message || 'What did the customer say about your product/service?'}
                                            placeholder="This product exceeded my expectations. The quality is outstanding and the customer service was exceptional..."
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="rating"
                                    control={control}
                                    render={({ field }) => (
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Rating
                                            </Typography>
                                            <Rating
                                                value={field.value || 5}
                                                onChange={(_, newValue) => field.onChange(newValue)}
                                                size="large"
                                            />
                                        </Box>
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Right Column - Settings */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Controller
                            name="storeId"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <StoreAutocomplete
                                    value={value || null}
                                    onChange={onChange}
                                    label="Store"
                                    error={!!errors.storeId}
                                    helperText={errors.storeId?.message}
                                    required
                                    disabled={!!initialData}
                                />
                            )}
                        />

                        <Controller
                            name="order"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    label="Display Order"
                                    type="number"
                                    fullWidth
                                    helperText="Lower numbers appear first"
                                />
                            )}
                        />

                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Active"
                                />
                            )}
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.7 : 1,
                            }}
                        >
                            {isSubmitting ? 'Saving...' : (initialData ? 'Update Testimonial' : 'Create Testimonial')}
                        </button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
