'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    Grid,
} from '@mui/material';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import IconPicker from '@/components/atoms/IconPicker';

const schema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/),
    storeId: z.string().min(1, 'Store is required'),
    description: z.string().optional(),
    icon: z.string().optional(),
    displayOrder: z.number().min(0).optional(),
    isActive: z.boolean(),
    seo: z.object({
        metaTitle: z.string().max(60).optional(),
        metaDescription: z.string().max(160).optional(),
        metaKeywords: z.array(z.string()).optional(),
    }).optional(),
});

type FormData = z.infer<typeof schema>;

interface ContentCardCategoryFormProps {
    initialData?: Partial<any>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
}

const defaultValues: FormData = {
    name: '',
    slug: '',
    storeId: '',
    description: '',
    icon: '',
    displayOrder: 0,
    isActive: true,
    seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
    },
};

export default function ContentCardCategoryForm({ initialData, onSubmit, isSubmitting = false }: ContentCardCategoryFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const watchedName = watch('name');

    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? (initialData.storeId as any)._id
                : initialData.storeId || '';

            reset({
                name: initialData.name || '',
                slug: initialData.slug || '',
                storeId: storeId,
                description: initialData.description || '',
                icon: initialData.icon || '',
                displayOrder: initialData.displayOrder ?? 0,
                isActive: initialData.isActive ?? true,
                seo: {
                    metaTitle: initialData.seo?.metaTitle || '',
                    metaDescription: initialData.seo?.metaDescription || '',
                    metaKeywords: initialData.seo?.metaKeywords || [],
                },
            });
        } else {
            reset(defaultValues);
        }
    }, [initialData, reset]);

    useEffect(() => {
        if (!initialData && watchedName) {
            const slug = watchedName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setValue('slug', slug);
        }
    }, [watchedName, initialData, setValue]);

    return (
        <Box component="form" id="content-card-category-form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Name"
                                fullWidth
                                required
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                placeholder="Jobs, Events, Features"
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="slug"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Slug"
                                fullWidth
                                required
                                error={!!errors.slug}
                                helperText={errors.slug?.message || 'URL-friendly identifier'}
                                disabled={!!initialData}
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
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
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="icon"
                        control={control}
                        render={({ field }) => (
                            <IconPicker
                                value={field.value || ''}
                                onChange={field.onChange}
                                label="Category Icon"
                                fullWidth
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
                                rows={3}
                                error={!!errors.description}
                                helperText={errors.description?.message}
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="displayOrder"
                        control={control}
                        render={({ field: { onChange, value, ...field } }) => (
                            <TextField
                                {...field}
                                value={value ?? 0}
                                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
                                label="Display Order"
                                type="number"
                                fullWidth
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
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
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Box sx={{ mt: 2, mb: 1 }}>
                        <strong>SEO (Optional)</strong>
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="seo.metaTitle"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Meta Title"
                                fullWidth
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="seo.metaDescription"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Meta Description"
                                fullWidth
                                multiline
                                rows={2}
                            />
                        )}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
