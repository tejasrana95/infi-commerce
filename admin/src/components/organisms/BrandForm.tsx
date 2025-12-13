'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Checkbox,
    FormControlLabel,
    Grid,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import StoreAutocomplete from '../molecules/StoreAutocomplete';
import FileManagerButton from '../molecules/FileManagerButton';

// Validation schema
const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    storeId: z.string().min(1, 'Store is required'),
    logo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    description: z.string().optional(),
    website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface BrandFormProps {
    initialData?: any;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function BrandForm({ initialData, onSubmit, isSubmitting = false }: BrandFormProps) {
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            slug: '',
            storeId: '',
            logo: '',
            description: '',
            website: '',
            isActive: true,
        },
    });

    const watchName = watch('name');

    // Auto-generate slug from name
    useEffect(() => {
        if (watchName && !initialData) {
            const slug = watchName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setValue('slug', slug);
        }
    }, [watchName, setValue, initialData]);

    // Initialize form with existing data
    useEffect(() => {
        if (initialData) {
            setValue('name', initialData.name || '');
            setValue('slug', initialData.slug || '');
            setValue('storeId', typeof initialData.storeId === 'object' ? initialData.storeId._id : initialData.storeId || '');
            setValue('logo', initialData.logo || '');
            setValue('description', initialData.description || '');
            setValue('website', initialData.website || '');
            setValue('isActive', initialData.isActive !== undefined ? initialData.isActive : true);
        }
    }, [initialData, setValue]);

    const handleFormSubmit = (data: FormData) => {
        // Clean up empty optional fields
        const cleanedData = {
            ...data,
            logo: data.logo || undefined,
            description: data.description || undefined,
            website: data.website || undefined,
        };
        onSubmit(cleanedData);
    };

    return (
        <Box component="form" id="brand-form" onSubmit={handleSubmit(handleFormSubmit)}>
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
                                helperText={errors.slug?.message || 'Auto-generated from name'}
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
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
                        name="logo"
                        control={control}
                        render={({ field }) => (
                            <Box>
                                <FileManagerButton
                                    label="Select Logo"
                                    onSelect={(files) => field.onChange(files[0]?.url || '')}
                                    accept="image/*"
                                    fullWidth
                                />
                                {field.value && (
                                    <TextField
                                        value={field.value}
                                        label="Logo URL"
                                        fullWidth
                                        margin="normal"
                                        error={!!errors.logo}
                                        helperText={errors.logo?.message}
                                        onChange={(e) => field.onChange(e.target.value)}
                                    />
                                )}
                            </Box>
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

                <Grid size={{ xs: 12 }}>
                    <Controller
                        name="website"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Website"
                                fullWidth
                                type="url"
                                placeholder="https://example.com"
                                error={!!errors.website}
                                helperText={errors.website?.message}
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
                                label="Active"
                            />
                        )}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
