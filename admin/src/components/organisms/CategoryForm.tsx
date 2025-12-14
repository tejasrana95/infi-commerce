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
import { Category } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';
import RichTextEditor from '../molecules/RichTextEditor';

// Validation Schema
const schema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title max 200 characters'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    storeId: z.string().min(1, 'Store is required'),
    parentCategory: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    status: z.enum(['active', 'inactive', 'draft']),
    sortOrder: z.number().min(0).optional(),
    isVisible: z.boolean(),

    // SEO Fields
    seo: z.object({
        metaTitle: z.string().max(60, 'Meta title max 60 characters').optional(),
        metaDescription: z.string().max(160, 'Meta description max 160 characters').optional(),
        metaKeywords: z.array(z.string()).optional(),
        ogTitle: z.string().optional(),
        ogDescription: z.string().optional(),
        ogImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
        twitterCard: z.enum(['summary', 'summary_large_image', 'app', 'player']).optional(),
    }).optional(),
});

type FormData = z.infer<typeof schema>;

interface CategoryFormProps {
    initialData?: Partial<Category>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
}

const defaultValues: FormData = {
    title: '',
    slug: '',
    storeId: '',
    parentCategory: '',
    description: '',
    image: '',
    status: 'active',
    sortOrder: 0,
    isVisible: true,
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

export default function CategoryForm({ initialData, onSubmit, isSubmitting = false }: CategoryFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const [activeTab, setActiveTab] = useState(0);
    const watchedTitle = watch('title');
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
                title: initialData.title || '',
                slug: initialData.slug || '',
                storeId: storeId,
                parentCategory: parentCategory,
                description: initialData.description || '',
                image: initialData.image || '',
                status: initialData.status || 'active',
                sortOrder: initialData.sortOrder ?? 0,
                isVisible: initialData.isVisible ?? true,
                seo: {
                    metaTitle: initialData.seo?.metaTitle || '',
                    metaDescription: initialData.seo?.metaDescription || '',
                    metaKeywords: initialData.seo?.metaKeywords || [],
                    ogTitle: initialData.seo?.ogTitle || '',
                    ogDescription: initialData.seo?.ogDescription || '',
                    ogImage: initialData.seo?.ogImage || '',
                    twitterCard: initialData.seo?.twitterCard || 'summary_large_image',
                },
            });
        } else {
            reset(defaultValues);
        }
    }, [initialData, reset]);

    // Auto-generate slug from title (only for new categories)
    useEffect(() => {
        if (!initialData && watchedTitle) {
            const slug = watchedTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setValue('slug', slug);
        }
    }, [watchedTitle, initialData, setValue]);

    return (
        <Box component="form" id="category-form" onSubmit={handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Basic Info" />
                <Tab label="SEO" />
                {initialData && <Tab label="Hierarchy Info" />}
            </Tabs>

            {/* Tab 0: Basic Info */}
            {activeTab === 0 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Title"
                                    fullWidth
                                    required
                                    error={!!errors.title}
                                    helperText={errors.title?.message}
                                    placeholder="Electronics"
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
                                    placeholder="electronics"
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
                                <CategoryAutocomplete
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
                                        placeholder="https://example.com/category.jpg"
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
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Status"
                                    fullWidth
                                    required
                                    error={!!errors.status}
                                    helperText={errors.status?.message}
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                    <MenuItem value="draft">Draft</MenuItem>
                                </TextField>
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
                                    helperText="Lower numbers appear first"
                                    slotProps={{ htmlInput: { min: 0 } }}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="isVisible"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Visible"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            )}

            {/* Tab 1: SEO */}
            {activeTab === 1 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Optimize your category for search engines and social media
                        </Typography>
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
                                    error={!!errors.seo?.metaTitle}
                                    helperText={errors.seo?.metaTitle?.message || 'Recommended: 50-60 characters'}
                                    placeholder="Best Electronics - Shop Now"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="seo.ogTitle"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Open Graph Title"
                                    fullWidth
                                    error={!!errors.seo?.ogTitle}
                                    helperText={errors.seo?.ogTitle?.message || 'For social media sharing'}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="seo.metaDescription"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Meta Description"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    error={!!errors.seo?.metaDescription}
                                    helperText={errors.seo?.metaDescription?.message || 'Recommended: 150-160 characters'}
                                    placeholder="Discover amazing electronics at great prices..."
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="seo.ogDescription"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Open Graph Description"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    error={!!errors.seo?.ogDescription}
                                    helperText={errors.seo?.ogDescription?.message || 'For social media sharing'}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="seo.metaKeywords"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Autocomplete
                                    multiple
                                    freeSolo
                                    value={value || []}
                                    onChange={(_, newValue) => onChange(newValue)}
                                    options={[]}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip label={option} {...getTagProps({ index })} key={index} />
                                        ))
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Meta Keywords"
                                            placeholder="Type and press Enter"
                                            helperText="Press Enter to add keywords"
                                        />
                                    )}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="seo.ogImage"
                            control={control}
                            render={({ field }) => (
                                <Box>
                                    <TextField
                                        {...field}
                                        label="Open Graph Image URL"
                                        fullWidth
                                        error={!!errors.seo?.ogImage}
                                        helperText={errors.seo?.ogImage?.message || 'Recommended: 1200x630px'}
                                        placeholder="https://example.com/og-image.jpg"
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
                            name="seo.twitterCard"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Twitter Card Type"
                                    fullWidth
                                    error={!!errors.seo?.twitterCard}
                                    helperText={errors.seo?.twitterCard?.message}
                                >
                                    <MenuItem value="summary">Summary</MenuItem>
                                    <MenuItem value="summary_large_image">Summary Large Image</MenuItem>
                                    <MenuItem value="app">App</MenuItem>
                                    <MenuItem value="player">Player</MenuItem>
                                </TextField>
                            )}
                        />
                    </Grid>
                </Grid>
            )}

            {/* Tab 2: Hierarchy Info (only for editing) */}
            {activeTab === 2 && initialData && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Auto-generated hierarchy information
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Level"
                            value={initialData.level ?? 0}
                            fullWidth
                            disabled
                            helperText="Category depth (0 = root)"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                            label="Path"
                            value={initialData.path || ''}
                            fullWidth
                            disabled
                            helperText="Full category path"
                        />
                    </Grid>

                    {initialData.seo?.canonicalUrl && (
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Canonical URL"
                                value={initialData.seo.canonicalUrl}
                                fullWidth
                                disabled
                                helperText="Auto-generated SEO canonical URL"
                            />
                        </Grid>
                    )}
                </Grid>
            )}
        </Box>
    );
}
