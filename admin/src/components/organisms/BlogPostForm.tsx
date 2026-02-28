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
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminAIAssistant from '../organisms/AdminAIAssistant/AdminAIAssistant';
import SeoSuggestions from '../molecules/SeoSuggestions';
import api from '@/lib/api';
import { BlogPost } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import BlogCategoryAutocomplete from '@/components/molecules/BlogCategoryAutocomplete';
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

    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? (initialData.storeId as any)._id
                : initialData.storeId || '';

            // Map category objects to IDs if needed
            const categoryIds = Array.isArray(initialData.categoryIds)
                ? initialData.categoryIds.map((c: any) => typeof c === 'object' ? c._id : c)
                : [];

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
                seo: {
                    metaTitle: initialData.seo?.metaTitle || '',
                    metaDescription: initialData.seo?.metaDescription || '',
                    metaKeywords: initialData.seo?.keywords || [],
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

    return (
        <Box
            component="form"
            id="blog-post-form"
            onSubmit={handleSubmit(onSubmit, (formErrors) => {
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
                                                label="Tags"
                                                placeholder="Add tags"
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
                                    helperText={errors.slug?.message}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
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
                        <SeoSuggestions suggestions={seoSuggestions} score={seoScore} />
                    </Grid>
                </Grid>
            )}
            <AdminAIAssistant entityType="blog_post" getValues={getValues} setValue={setValue as any} />
        </Box>
    );
}
