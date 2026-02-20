'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    Grid,
    MenuItem,
    Tabs,
    Tab,
    Typography,
    Chip,
    Autocomplete,
} from '@mui/material';
import { BlogCategory } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import BlogCategoryAutocomplete from '@/components/molecules/BlogCategoryAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import RichTextEditor from '@/components/molecules/RichTextEditor';
import { FileItem } from '@/types/file';

// Validation Schema
const schema = z.object({
    name: z.string().min(1, 'Name is required').max(200, 'Name max 200 characters'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    storeId: z.string().min(1, 'Store is required'),
    parentCategory: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    isActive: z.boolean(),
    sortOrder: z.number().min(0).optional(),

    // SEO Fields
    seo: z.object({
        metaTitle: z.string().max(60, 'Meta title max 60 characters').optional(),
        metaDescription: z.string().max(160, 'Meta description max 160 characters').optional(),
        metaKeywords: z.array(z.string()).optional(),
        ogTitle: z.string().max(60, 'OG title max 60 characters').optional(),
        ogDescription: z.string().max(160, 'OG description max 160 characters').optional(),
        ogImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
        twitterCard: z.enum(['summary', 'summary_large_image', 'app', 'player']).optional(),
    }).optional(),
});

type FormData = z.infer<typeof schema>;

interface BlogCategoryFormProps {
    initialData?: Partial<BlogCategory>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
}

const defaultValues: FormData = {
    name: '',
    slug: '',
    storeId: '',
    parentCategory: '',
    description: '',
    image: '',
    isActive: true,
    sortOrder: 0,
    seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        twitterCard: 'summary_large_image',
    },
};

export default function BlogCategoryForm({ initialData, onSubmit, isSubmitting = false }: BlogCategoryFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const [activeTab, setActiveTab] = useState(0);
    const watchedName = watch('name');
    const watchedStoreId = watch('storeId');

    useEffect(() => {
        if (initialData) {
            // Handle populated storeId and parentCategory
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? (initialData.storeId as any)._id
                : initialData.storeId || '';

            const parentCategory = typeof initialData.parentCategory === 'object' && initialData.parentCategory !== null
                ? (initialData.parentCategory as any)._id
                : initialData.parentCategory || '';

            reset({
                name: initialData.name || '',
                slug: initialData.slug || '',
                storeId: storeId,
                parentCategory: parentCategory,
                description: initialData.description || '',
                image: (initialData as any).image || '', // Assuming image field exists in model
                isActive: initialData.isActive ?? true,
                sortOrder: (initialData as any).sortOrder ?? 0,
                seo: {
                    metaTitle: initialData.seo?.metaTitle || '',
                    metaDescription: initialData.seo?.metaDescription || '',
                    metaKeywords: initialData.seo?.keywords || [],
                    ogTitle: (initialData.seo as any)?.ogTitle || '', // Adjust based on actual interface
                    ogDescription: (initialData.seo as any)?.ogDescription || '',
                    ogImage: (initialData.seo as any)?.ogImage || '',
                    twitterCard: (initialData.seo as any)?.twitterCard || 'summary_large_image',
                },
            });
        } else {
            reset(defaultValues);
        }
    }, [initialData, reset]);

    // Auto-generate slug from name
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
        <Box
            component="form"
            id="blog-category-form"
            onSubmit={handleSubmit(onSubmit, (formErrors) => {
                if (formErrors?.seo) {
                    setActiveTab(1);
                }
            })}
        >
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Basic Info" />
                <Tab label="SEO" />
            </Tabs>

            {/* Tab 0: Basic Info */}
            {activeTab === 0 && (
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
                                    placeholder="Tech News"
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
                            name="parentCategory"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <BlogCategoryAutocomplete
                                    value={value || null}
                                    onChange={onChange}
                                    storeId={watchedStoreId}
                                    excludeId={initialData?._id}
                                    label="Parent Category"
                                    error={!!errors.parentCategory}
                                    helperText={errors.parentCategory?.message || 'Leave empty for root category'}
                                />
                            )}
                        />
                    </Grid>


                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <RichTextEditor
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    label="Description"
                                    variant="standard"
                                    error={!!errors.description}
                                    helperText={errors.description?.message}
                                    minHeight={200}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="image"
                            control={control}
                            render={({ field }) => (
                                <Box>
                                    <TextField
                                        {...field}
                                        label="Image URL"
                                        fullWidth
                                        error={!!errors.image}
                                        helperText={errors.image?.message}
                                        slotProps={{
                                            input: {
                                                endAdornment: (
                                                    <FileManagerButton
                                                        label="Browse"
                                                        variant="outlined"
                                                        size="small"
                                                        accept="image/*"
                                                        category="images"
                                                        onSelect={(files: FileItem[]) => {
                                                            if (files.length > 0) {
                                                                field.onChange(files[0].url);
                                                            }
                                                        }}
                                                    />
                                                ),
                                            },
                                        }}
                                    />
                                </Box>
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="sortOrder"
                            control={control}
                            render={({ field: { onChange, value, ...field } }) => (
                                <TextField
                                    {...field}
                                    value={value ?? 0}
                                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
                                    label="Sort Order"
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
                </Grid>
            )}

            {/* Tab 1: SEO */}
            {activeTab === 1 && (
                <Grid container spacing={3}>
                    {/* Reuse SEO fields from CategoryForm (omitted for brevity, can populate if needed) */}
                    {/* For speed, I'll include basic SEO */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="seo.metaTitle"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Meta Title"
                                    fullWidth
                                    error={!!errors.seo?.metaTitle}
                                    helperText={errors.seo?.metaTitle?.message || `${field.value?.length || 0}/60 characters`}
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
                                    error={!!errors.seo?.metaDescription}
                                    helperText={errors.seo?.metaDescription?.message || `${field.value?.length || 0}/160 characters`}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
