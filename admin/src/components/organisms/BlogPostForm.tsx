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
    Autocomplete,
    Chip,
    Button,
    Typography,
    CircularProgress,
    Checkbox,
    Divider,
    ToggleButton,
    ToggleButtonGroup,
    Paper,
    InputAdornment,
    Alert,
    Stack,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import AdminAIAssistant from '../organisms/AdminAIAssistant/AdminAIAssistant';
import SeoSuggestions from '../molecules/SeoSuggestions';
import api from '@/lib/api';
import { BlogPost } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import BlogCategoryAutocomplete from '@/components/molecules/BlogCategoryAutocomplete';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';
import ProductAutoComplete, { ProductOption } from '@/components/molecules/ProductAutoComplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import RichTextEditor from '@/components/molecules/RichTextEditor';
import { FileItem } from '@/types/file';

// Validation Schema
const schema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/),
    storeId: z.string().min(1, 'Store is required'),
    excerpt: z.string().optional(),
    content: z.string().min(1, 'Content is required'),
    featuredImage: z.string().url().optional().or(z.literal('')),
    categoryIds: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['draft', 'published', 'archived', 'scheduled']),
    scheduledAt: z.string().optional(), // Date string
    allowComments: z.boolean(),
    isFeatured: z.boolean(),
    isPinned: z.boolean(),
    showRelatedArticles: z.boolean(),

    // Linked products config
    linkedProductsConfig: z.object({
        enabled: z.boolean(),
        sourceType: z.enum(['category', 'products']),
        categoryId: z.string().optional().nullable(),
        productIds: z.array(z.any()).optional(),
        limit: z.number().optional(),
        order: z.enum(['latest', 'random', 'best-selling', 'most-viewed']).optional(),
        layout: z.enum(['carousel', 'grid']).optional(),
        columns: z.number().optional(),
        title: z.string().optional(),
    }).optional(),

    // SEO
    seo: z.object({
        metaTitle: z.string().max(60, 'Meta title max 60 characters').optional(),
        metaDescription: z.string().max(160, 'Meta description max 160 characters').optional(),
        metaKeywords: z.array(z.string()).optional(),
        ogTitle: z.string().max(60, 'OG title max 60 characters').optional(),
        ogDescription: z.string().max(160, 'OG description max 160 characters').optional(),
        ogImage: z.string().url().optional().or(z.literal('')),
        score: z.number().min(0).max(100).optional(),
    }).optional(),
});

type FormData = z.infer<typeof schema>;

interface BlogPostFormProps {
    initialData?: Partial<BlogPost>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
}

const defaultValues: FormData = {
    title: '',
    slug: '',
    storeId: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    categoryIds: [],
    tags: [],
    status: 'draft',
    scheduledAt: '',
    allowComments: true,
    isFeatured: false,
    isPinned: false,
    showRelatedArticles: false,
    linkedProductsConfig: {
        enabled: false,
        sourceType: 'products',
        categoryId: null,
        productIds: [],
        limit: 8,
        order: 'latest',
        layout: 'grid',
        columns: 4,
        title: '',
    },
    seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        score: 0,
    },
};

export default function BlogPostForm({ initialData, onSubmit, isSubmitting = false }: BlogPostFormProps) {
    const { control, handleSubmit, reset, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const [activeTab, setActiveTab] = useState(0);
    const [isCalculatingSeo, setIsCalculatingSeo] = useState(false);
    const [seoSuggestions, setSeoSuggestions] = useState<string[]>([]);
    const watchedTitle = watch('title');
    const watchedStoreId = watch('storeId');
    const seoScore = watch('seo.score') || 0;
    const linkedEnabled = watch('linkedProductsConfig.enabled');
    const linkedSourceType = watch('linkedProductsConfig.sourceType');
    const linkedLayout = watch('linkedProductsConfig.layout');
    const linkedColumns = watch('linkedProductsConfig.columns') ?? 4;
    const linkedProducts = watch('linkedProductsConfig.productIds');
    const linkedProductsCount = Array.isArray(linkedProducts) ? linkedProducts.length : 0;
    const hasStore = Boolean(watchedStoreId);

    const normalizeChipValues = (values: string[]) => {
        return Array.from(
            new Set(
                values
                    .flatMap((value) => value.split(','))
                    .map((value) => value.trim())
                    .filter(Boolean)
            )
        );
    };

    const parseCommaSeparatedValues = (rawValue: string) => {
        return rawValue
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
    };

    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? (initialData.storeId as any)._id
                : initialData.storeId || '';

            // Map category objects to IDs if needed
            const categoryIds = Array.isArray(initialData.categoryIds)
                ? initialData.categoryIds.map((c: any) => typeof c === 'object' ? c._id : c)
                : [];

            // Hydrate linkedProductsConfig
            const lpc = (initialData as any).linkedProductsConfig;
            const linkedProductsConfig: FormData['linkedProductsConfig'] = {
                enabled: lpc?.enabled ?? false,
                sourceType: lpc?.sourceType ?? 'products',
                categoryId: typeof lpc?.categoryId === 'object' && lpc?.categoryId?._id
                    ? lpc.categoryId._id
                    : lpc?.categoryId || null,
                productIds: Array.isArray(lpc?.productIds)
                    ? lpc.productIds.map((p: any) => typeof p === 'object' ? p : { _id: p })
                    : [],
                limit: lpc?.limit ?? 8,
                order: lpc?.order ?? 'latest',
                layout: lpc?.layout ?? 'grid',
                columns: lpc?.columns ?? 4,
                title: lpc?.title ?? '',
            };

            reset({
                title: initialData.title || '',
                slug: initialData.slug || '',
                storeId: storeId,
                excerpt: initialData.excerpt || '',
                content: initialData.content || '',
                featuredImage: initialData.featuredImage || '',
                categoryIds: categoryIds,
                tags: initialData.tags || [],
                status: initialData.status || 'draft',
                scheduledAt: initialData.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : '', // datetime-local format
                allowComments: initialData.allowComments ?? true,
                isFeatured: initialData.isFeatured ?? false,
                isPinned: initialData.isPinned ?? false,
                showRelatedArticles: (initialData as any).showRelatedArticles ?? false,
                linkedProductsConfig,
                seo: {
                    metaTitle: initialData.seo?.metaTitle || '',
                    metaDescription: initialData.seo?.metaDescription || '',
                    metaKeywords: (initialData.seo as any)?.metaKeywords || initialData.seo?.keywords || [],
                    ogTitle: (initialData.seo as any)?.ogTitle || '',
                    ogDescription: (initialData.seo as any)?.ogDescription || '',
                    ogImage: (initialData.seo as any)?.ogImage || '',
                    score: initialData.seo?.score || 0,
                },
            });
        } else {
            reset(defaultValues);
        }
    }, [initialData, reset]);

    useEffect(() => {
        if (!initialData && watchedTitle) {
            const slug = watchedTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setValue('slug', slug);
        }
    }, [watchedTitle, initialData, setValue]);

    const handleCalculateSeo = async () => {
        setIsCalculatingSeo(true);
        try {
            const seoData = {
                title: getValues('seo.metaTitle') || getValues('title'),
                description: getValues('seo.metaDescription') || getValues('excerpt') || getValues('content')?.substring(0, 160) || '',
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

    // Normalize form data before submission: extract _id from ProductOption objects
    const handleFormSubmit = async (data: FormData) => {
        const normalized = { ...data };
        if (normalized.seo) {
            normalized.seo = {
                ...normalized.seo,
                metaKeywords: (normalized.seo.metaKeywords || []).map((keyword) => keyword.trim()).filter(Boolean),
            };
        }
        if (normalized.linkedProductsConfig) {
            normalized.linkedProductsConfig = {
                ...normalized.linkedProductsConfig,
                // Convert ProductOption[] → string[] of _id values
                productIds: (normalized.linkedProductsConfig.productIds || []).map(
                    (p: any) => (typeof p === 'object' && p._id ? p._id : p)
                ),
                // Ensure null categoryId is stripped
                categoryId: normalized.linkedProductsConfig.categoryId || undefined,
            };
        }
        await onSubmit(normalized);
    };


    return (
        <Box
            component="form"
            id="blog-post-form"
            onSubmit={handleSubmit(handleFormSubmit, (formErrors) => {
                if (formErrors?.seo) {
                    setActiveTab(2);
                }
            })}
        >
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Content" />
                <Tab label="Settings" />
                <Tab label="SEO" />
            </Tabs>

            {/* Tab 0: Content */}
            {activeTab === 0 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="title"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Post Title"
                                            fullWidth
                                            required
                                            error={!!errors.title}
                                            helperText={errors.title?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="content"
                                    control={control}
                                    render={({ field }) => (
                                        <RichTextEditor
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            label="Content"
                                            variant="full"
                                            error={!!errors.content}
                                            helperText={errors.content?.message}
                                            minHeight={400}
                                            showSourceToggle
                                            showFullscreen
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="excerpt"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Excerpt"
                                            fullWidth
                                            multiline
                                            rows={3}
                                            error={!!errors.excerpt}
                                            helperText={errors.excerpt?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

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
                                    />
                                )}
                            />

                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Status"
                                        fullWidth
                                    >
                                        <MenuItem value="draft">Draft</MenuItem>
                                        <MenuItem value="published">Published</MenuItem>
                                        <MenuItem value="scheduled">Scheduled</MenuItem>
                                        <MenuItem value="archived">Archived</MenuItem>
                                    </TextField>
                                )}
                            />

                            <Controller
                                name="scheduledAt"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="datetime-local"
                                        label="Schedule Publish"
                                        fullWidth
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                )}
                            />

                            <Controller
                                name="categoryIds"
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <BlogCategoryAutocomplete
                                        multiple
                                        value={value || []}
                                        onChange={onChange}
                                        storeId={watchedStoreId}
                                        label="Categories"
                                    />
                                )}
                            />

                            <Controller
                                name="tags"
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <Autocomplete
                                        multiple
                                        freeSolo
                                        value={value || []}
                                        onChange={(_, newValue) => {
                                            const normalized = normalizeChipValues(newValue.map((item) => String(item)));
                                            onChange(normalized);
                                        }}
                                        options={[]}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip label={option} {...getTagProps({ index })} key={index} />
                                            ))
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Tags"
                                                placeholder="Add tags"
                                                onPaste={(event) => {
                                                    const pastedText = event.clipboardData.getData('text');
                                                    if (!pastedText.includes(',')) {
                                                        return;
                                                    }

                                                    event.preventDefault();
                                                    const parsedValues = parseCommaSeparatedValues(pastedText);
                                                    const merged = normalizeChipValues([...(value || []), ...parsedValues]);
                                                    onChange(merged);
                                                }}
                                            />
                                        )}
                                    />
                                )}
                            />

                            <Controller
                                name="featuredImage"
                                control={control}
                                render={({ field }) => (
                                    <Box>
                                        <TextField
                                            {...field}
                                            label="Featured Image URL"
                                            fullWidth
                                            error={!!errors.featuredImage}
                                            helperText={errors.featuredImage?.message}
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
                        </Box>
                    </Grid>
                </Grid>
            )}

            {/* Tab 1: Settings */}
            {activeTab === 1 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Post Settings
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Control publish URL and visibility behavior for this post.
                            </Typography>

                            <Grid container spacing={2}>
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
                                                helperText={errors.slug?.message || 'Used in URL: /blog/your-slug'}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        spacing={1}
                                        sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap' }}
                                    >
                                        <Controller
                                            name="allowComments"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                                    label="Allow Comments"
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="isFeatured"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                                    label="Featured Post"
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="isPinned"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                                    label="Pin to Top"
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="showRelatedArticles"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch checked={field.value ?? false} onChange={field.onChange} />}
                                                    label="Show Related Articles"
                                                />
                                            )}
                                        />
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Link Products Section */}
                    <Grid size={{ xs: 12 }}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Linked Products
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Show relevant products below the blog content.
                                    </Typography>
                                </Box>
                                <Controller
                                    name="linkedProductsConfig.enabled"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            sx={{ mr: 0 }}
                                            control={
                                                <Checkbox
                                                    checked={field.value ?? false}
                                                    onChange={field.onChange}
                                                />
                                            }
                                            label="Link products"
                                        />
                                    )}
                                />
                            </Box>

                            {linkedEnabled && (
                                <Box sx={{ mt: 2 }}>
                                    {!hasStore && (
                                        <Alert severity="warning" sx={{ mb: 2 }}>
                                            Select a store in the Content tab to configure product/category source.
                                        </Alert>
                                    )}
                                <Grid container spacing={3}>
                                    {/* Source type toggle */}
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Product Source
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                            Pick products manually or auto-populate from a single category.
                                        </Typography>
                                        <Controller
                                            name="linkedProductsConfig.sourceType"
                                            control={control}
                                            render={({ field }) => (
                                                <ToggleButtonGroup
                                                    value={field.value}
                                                    exclusive
                                                    onChange={(_, val) => { if (val) field.onChange(val); }}
                                                    size="small"
                                                >
                                                    <ToggleButton value="category" disabled={!hasStore}>By Category</ToggleButton>
                                                    <ToggleButton value="products" disabled={!hasStore}>By Products</ToggleButton>
                                                </ToggleButtonGroup>
                                            )}
                                        />
                                    </Grid>

                                    {/* ── By Category ── */}
                                    {linkedSourceType === 'category' && (
                                        <>
                                            <Grid size={{ xs: 12 }}>
                                                <Controller
                                                    name="linkedProductsConfig.categoryId"
                                                    control={control}
                                                    render={({ field: { onChange, value } }) => (
                                                        <CategoryAutocomplete
                                                            label="Product Category"
                                                            storeId={watchedStoreId}
                                                            value={value || null}
                                                            onChange={(val) => onChange(val)}
                                                            multiple={false}
                                                            disabled={!hasStore}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="linkedProductsConfig.limit"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            label="Limit"
                                                            type="number"
                                                            fullWidth
                                                            value={field.value ?? 8}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 8)}
                                                            slotProps={{ htmlInput: { min: 1, max: 50 } }}
                                                            disabled={!hasStore}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="linkedProductsConfig.order"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            select
                                                            label="Order"
                                                            fullWidth
                                                            disabled={!hasStore}
                                                        >
                                                            <MenuItem value="latest">Latest</MenuItem>
                                                            <MenuItem value="random">Random</MenuItem>
                                                            <MenuItem value="best-selling">Best Selling</MenuItem>
                                                            <MenuItem value="most-viewed">Most Viewed</MenuItem>
                                                        </TextField>
                                                    )}
                                                />
                                            </Grid>
                                        </>
                                    )}

                                    {/* ── By Products ── */}
                                    {linkedSourceType === 'products' && (
                                        <Grid size={{ xs: 12 }}>
                                            <Controller
                                                name="linkedProductsConfig.productIds"
                                                control={control}
                                                render={({ field: { onChange, value } }) => (
                                                    <ProductAutoComplete
                                                        storeId={watchedStoreId}
                                                        multiple
                                                        label="Search & Add Products"
                                                        value={value as ProductOption[] || []}
                                                        onChange={onChange}
                                                        disabled={!hasStore}
                                                        helperText={hasStore ? 'Drag selected products below search to set exact order.' : undefined}
                                                    />
                                                )}
                                            />
                                            {hasStore && (
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                                                    {linkedProductsCount} product{linkedProductsCount === 1 ? '' : 's'} selected
                                                </Typography>
                                            )}
                                        </Grid>
                                    )}

                                    {/* ── Layout Options ── */}
                                    <Grid size={{ xs: 12 }}>
                                        <Divider sx={{ mb: 2 }} />
                                        <Typography variant="subtitle2" gutterBottom>
                                            Layout
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                            <Controller
                                                name="linkedProductsConfig.layout"
                                                control={control}
                                                render={({ field }) => (
                                                    <ToggleButtonGroup
                                                        value={field.value ?? 'grid'}
                                                        exclusive
                                                        onChange={(_, val) => { if (val) field.onChange(val); }}
                                                        size="small"
                                                    >
                                                        <ToggleButton value="grid" sx={{ gap: 0.5 }} disabled={!hasStore}>
                                                            <GridViewIcon fontSize="small" /> Grid
                                                        </ToggleButton>
                                                        <ToggleButton value="carousel" sx={{ gap: 0.5 }} disabled={!hasStore}>
                                                            <ViewCarouselIcon fontSize="small" /> Carousel
                                                        </ToggleButton>
                                                    </ToggleButtonGroup>
                                                )}
                                            />

                                            {linkedLayout === 'grid' && (
                                                <Controller
                                                    name="linkedProductsConfig.columns"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            select
                                                            label="Products per row"
                                                            size="small"
                                                            value={field.value ?? 4}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                            sx={{ minWidth: 160 }}
                                                            helperText={`Mobile: 1 col · Tablet: ${linkedColumns === 1 ? 1 : 2} col`}
                                                            disabled={!hasStore}
                                                        >
                                                            <MenuItem value={1}>1</MenuItem>
                                                            <MenuItem value={2}>2</MenuItem>
                                                            <MenuItem value={3}>3</MenuItem>
                                                            <MenuItem value={4}>4</MenuItem>
                                                            <MenuItem value={5}>5</MenuItem>
                                                        </TextField>
                                                    )}
                                                />
                                            )}
                                            {linkedLayout === 'carousel' && (
                                                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                                    Carousel uses horizontal swipe/scroll on all devices.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>

                                    {/* Optional title */}
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="linkedProductsConfig.title"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Section Title (optional)"
                                                    fullWidth
                                                    placeholder="Related Products"
                                                    slotProps={{
                                                        input: {
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <Typography variant="caption" color="text.secondary">Title:</Typography>
                                                                </InputAdornment>
                                                            ),
                                                        },
                                                    }}
                                                    disabled={!hasStore}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Tab 2: SEO */}
            {activeTab === 2 && (
                <Grid container spacing={3}>
                    {/* Basic SEO */}
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="body2" color="text.secondary">
                                Optimize your post for search engines
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
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="seo.metaKeywords"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Autocomplete
                                    multiple
                                    freeSolo
                                    value={value || []}
                                    onChange={(_, newValue) => {
                                        const normalized = normalizeChipValues(newValue.map((item) => String(item)));
                                        onChange(normalized);
                                    }}
                                    options={[]}
                                    renderTags={(keywords, getTagProps) =>
                                        keywords.map((keyword, index) => (
                                            <Chip label={keyword} {...getTagProps({ index })} key={index} size="small" />
                                        ))
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Meta Keywords"
                                            placeholder="Add keywords"
                                            helperText="Press Enter to add, or paste comma-separated keywords"
                                            onPaste={(event) => {
                                                const pastedText = event.clipboardData.getData('text');
                                                if (!pastedText.includes(',')) {
                                                    return;
                                                }

                                                event.preventDefault();
                                                const parsedValues = parseCommaSeparatedValues(pastedText);
                                                const merged = normalizeChipValues([...(value || []), ...parsedValues]);
                                                onChange(merged);
                                            }}
                                        />
                                    )}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <SeoSuggestions suggestions={seoSuggestions} score={seoScore} />
                    </Grid>
                </Grid>
            )}
            <AdminAIAssistant entityType="blog_post" getValues={getValues} setValue={setValue as any} />
        </Box>
    );
}
