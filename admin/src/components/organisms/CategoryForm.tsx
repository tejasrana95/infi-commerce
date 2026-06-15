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
    InputAdornment,
    CircularProgress,
    Autocomplete,
    Button,
    Select,
    InputLabel,
    FormControl
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminAIAssistant from '../organisms/AdminAIAssistant/AdminAIAssistant';
import SeoSuggestions from '../molecules/SeoSuggestions';
import api from '@/lib/api';
import { Category } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';
import RichTextEditor from '../molecules/RichTextEditor';

// Validation Schema
const schema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title max 200 characters'),
    heading: z.string().min(1, 'Heading is required').max(200, 'Heading max 200 characters'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    storeId: z.string().min(1, 'Store is required'),
    parentCategory: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    status: z.enum(['active', 'inactive', 'draft']),
    sortOrder: z.number().min(0).optional(),
    isVisible: z.boolean(),
    channels: z.array(z.string()).optional(),

    // SEO Fields
    seo: z.object({
        metaTitle: z.string().max(60, 'Meta title max 60 characters').optional(),
        metaDescription: z.string().max(160, 'Meta description max 160 characters').optional(),
        metaKeywords: z.array(z.string()).optional(),
        ogTitle: z.string().max(60, 'OG title max 60 characters').optional(),
        ogDescription: z.string().max(160, 'OG description max 160 characters').optional(),
        ogImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
        twitterCard: z.enum(['summary', 'summary_large_image', 'app', 'player']).optional(),
        score: z.number().min(0).max(100).optional(),
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
    heading: '',
    slug: '',
    storeId: '',
    parentCategory: '',
    description: '',
    image: '',
    status: 'active',
    sortOrder: 0,
    isVisible: true,
    channels: [],
    seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        twitterCard: 'summary_large_image',
        score: 0,
    },
};

export default function CategoryForm({ initialData, onSubmit, isSubmitting = false }: CategoryFormProps) {
    const { control, handleSubmit, reset, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const [activeTab, setActiveTab] = useState(0);
    const [isCalculatingSeo, setIsCalculatingSeo] = useState(false);
    const [seoSuggestions, setSeoSuggestions] = useState<string[]>([]);
    const [slugCheck, setSlugCheck] = useState<{ loading: boolean; available: boolean | null; message: string; isReserved?: boolean; suggestedSlug?: string }>({ loading: false, available: null, message: '' });
    const watchedTitle = watch('title');
    const watchedSlug = watch('slug');
    const watchedStoreId = watch('storeId');
    const seoScore = watch('seo.score') || 0;

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
                heading: initialData.heading || '',
                slug: initialData.slug || '',
                storeId: storeId,
                parentCategory: parentCategory,
                description: initialData.description || '',
                image: initialData.image || '',
                status: initialData.status || 'active',
                sortOrder: initialData.sortOrder ?? 0,
                isVisible: initialData.isVisible ?? true,
                channels: initialData.channels || [],
                seo: {
                    metaTitle: initialData.seo?.metaTitle || '',
                    metaDescription: initialData.seo?.metaDescription || '',
                    metaKeywords: initialData.seo?.metaKeywords || [],
                    ogTitle: initialData.seo?.ogTitle || '',
                    ogDescription: initialData.seo?.ogDescription || '',
                    ogImage: initialData.seo?.ogImage || '',
                    twitterCard: initialData.seo?.twitterCard || 'summary_large_image',
                    score: initialData.seo?.score || 0,
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
            setValue('slug', slug, { shouldValidate: true });
        }
    }, [watchedTitle, initialData, setValue]);

    // Check slug availability
    useEffect(() => {
        const checkSlug = async () => {
            const storeId = typeof watchedStoreId === 'object' && watchedStoreId !== null
                ? (watchedStoreId as any)._id
                : watchedStoreId;

            if (!watchedSlug || !storeId) {
                setSlugCheck({ loading: false, available: null, message: '' });
                return;
            }

            // Skip check if slug hasn't changed from initial data
            if (initialData && initialData.slug === watchedSlug) {
                setSlugCheck({ loading: false, available: true, message: '' });
                return;
            }

            setSlugCheck(prev => ({ ...prev, loading: true }));
            try {
                const response = await api.get(`/slug/check/${storeId}/${watchedSlug}`, {
                    params: { type: 'category', id: initialData?._id }
                });

                if (response.data.success) {
                    if (response.data.isReserved) {
                        setSlugCheck({
                            loading: false,
                            available: false,
                            message: response.data.message || 'This is a reserved URL and cannot be used',
                            isReserved: true,
                            suggestedSlug: response.data.suggestedSlug
                        });
                    } else if (response.data.isAvailable) {
                        setSlugCheck({ loading: false, available: true, message: 'Slug is available' });
                    } else {
                        setSlugCheck({
                            loading: false,
                            available: false,
                            message: response.data.message || 'Slug is already taken by another entity',
                            suggestedSlug: response.data.suggestedSlug
                        });
                    }
                }
            } catch (error) {
                console.error('Slug check failed', error);
                setSlugCheck({ loading: false, available: null, message: 'Failed to validate slug' });
            }
        };

        const timer = setTimeout(checkSlug, 500);
        return () => clearTimeout(timer);
    }, [watchedSlug, watchedStoreId, initialData]);

    const handleCalculateSeo = async () => {
        setIsCalculatingSeo(true);
        try {
            const seoData = {
                title: getValues('seo.metaTitle') || getValues('title'),
                description: getValues('seo.metaDescription') || getValues('description'),
                keywords: getValues('seo.metaKeywords'),
            };

            const response = await api.post('/ai/admin/seo-score', { data: seoData });
            if (response.data.success) {
                const { score, suggestions } = response.data.analysis;
                setValue('seo.score', score, { shouldDirty: true });
                setSeoSuggestions(suggestions || []);
            }
        } catch (error) {
            console.error('Failed to calculate SEO score:', error);
        } finally {
            setIsCalculatingSeo(false);
        }
    };

    return (
        <Box
            component="form"
            id="category-form"
            onSubmit={handleSubmit(onSubmit, (formErrors) => {
                if (formErrors?.seo) {
                    setActiveTab(1);
                }
            })}
        >
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
                            name="heading"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Heading Title (H1)"
                                    fullWidth
                                    required
                                    error={!!errors.heading}
                                    helperText={errors.heading?.message}
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
                                <Box>
                                    <TextField
                                        {...field}
                                        label="Slug"
                                        fullWidth
                                        required
                                        error={!!errors.slug || (slugCheck.available === false)}
                                        helperText={
                                            (errors.slug?.message) ||
                                            (slugCheck.available === false ? slugCheck.message : null) ||
                                            (slugCheck.loading ? 'Checking availability...' : 'URL path: /your-slug (Must be unique across all content)')
                                        }
                                        color={slugCheck.available === true ? 'success' : undefined}
                                        placeholder="electronics"
                                        disabled={!!initialData}
                                    />
                                    {slugCheck.suggestedSlug && slugCheck.available === false && !initialData && (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Suggested:
                                            </Typography>
                                            <Chip
                                                label={slugCheck.suggestedSlug}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                onClick={() => setValue('slug', slugCheck.suggestedSlug!, { shouldValidate: true })}
                                                sx={{ ml: 1, cursor: 'pointer' }}
                                            />
                                        </Box>
                                    )}
                                </Box>
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

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="channels"
                            control={control}
                            render={({ field }) => {
                                const availableChannels = (process.env.NEXT_PUBLIC_AVAILABLE_CHANNELS || 'WEB,POS,MOB').split(',').map(c => c.trim());
                                return (
                                    <FormControl fullWidth>
                                        <InputLabel>Channels</InputLabel>
                                        <Select
                                            {...field}
                                            multiple
                                            label="Channels"
                                            value={field.value || []}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {(selected as string[]).map((value) => (
                                                        <Chip key={value} label={value} size="small" />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {availableChannels.map((channel) => (
                                                <MenuItem key={channel} value={channel}>
                                                    {channel}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                );
                            }}
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
                                    showSourceToggle
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
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
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
                                                </InputAdornment>
                                            ),
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
                                    InputProps={{ inputProps: { min: 0 } }}
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
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="body2" color="text.secondary">
                                Optimize your category for search engines and social media
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2}>
                                {seoScore > 0 && (
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: seoScore >= 70 ? 'success.main' : seoScore >= 40 ? 'warning.main' : 'error.main'
                                        }}
                                    >
                                        {seoScore}/100
                                    </Typography>
                                )}
                                <Button
                                    variant="outlined"
                                    startIcon={isCalculatingSeo ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />}
                                    onClick={handleCalculateSeo}
                                    size="small"
                                    disabled={isCalculatingSeo}
                                >
                                    {isCalculatingSeo ? 'Calculating...' : 'Calculate SEO Score'}
                                </Button>
                            </Box>
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
                                    error={!!errors.seo?.metaTitle}
                                    helperText={errors.seo?.metaTitle?.message || `${field.value?.length || 0}/60 characters`}
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
                                    helperText={errors.seo?.ogTitle?.message || `${field.value?.length || 0}/60 characters`}
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
                                    helperText={errors.seo?.metaDescription?.message || `${field.value?.length || 0}/160 characters`}
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
                                    helperText={errors.seo?.ogDescription?.message || `${field.value?.length || 0}/160 characters`}
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
                    <Grid size={{ xs: 12 }}>
                        <SeoSuggestions suggestions={seoSuggestions} score={seoScore} />
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
            <AdminAIAssistant entityType="category" getValues={getValues} setValue={setValue as any} />
        </Box>
    );
}
