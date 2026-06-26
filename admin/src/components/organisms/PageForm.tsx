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
    Button,
    CircularProgress,
    Chip,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminAIAssistant from '../organisms/AdminAIAssistant/AdminAIAssistant';
import SeoSuggestions from '../molecules/SeoSuggestions';
import api from '@/lib/api';
import { Page } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import RichTextEditor from '@/components/molecules/RichTextEditor';
import { FileItem } from '@/types/file';

// Validation Schema
const schema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    heading: z.string().max(200, 'Max limit is 200').optional(),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    storeId: z.string().min(1, 'Store is required'),
    content: z.string().optional(),
    featuredImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    status: z.enum(['draft', 'published']),

    // SEO
    seo: z.object({
        metaTitle: z.string().max(60).optional(),
        metaDescription: z.string().max(160).optional(),
        metaKeywords: z.array(z.string()).optional(),
        ogTitle: z.string().max(60).optional(),
        ogDescription: z.string().max(160).optional(),
        ogImage: z.string().url().optional().or(z.literal('')),
        score: z.number().min(0).max(100).optional(),
    }).optional(),
});

type FormData = z.infer<typeof schema>;

interface PageFormProps {
    initialData?: Partial<Page>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
}

const defaultValues: FormData = {
    title: '',
    heading: '',
    slug: '',
    storeId: '',
    content: '',
    featuredImage: '',
    status: 'draft',
    seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
        ogImage: '',
        ogTitle: '',
        ogDescription: '',
        score: 0,
    },
};

export default function PageForm({ initialData, onSubmit, isSubmitting = false }: PageFormProps) {
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
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? initialData.storeId._id
                : initialData.storeId || '';

            reset({
                title: initialData.title || '',
                heading: initialData.heading || '',
                slug: initialData.slug || '',
                storeId: storeId,
                content: initialData.content || '',
                featuredImage: initialData.featuredImage || '',
                status: initialData.status || 'draft',
                seo: {
                    metaTitle: initialData.seo?.metaTitle || '',
                    metaDescription: initialData.seo?.metaDescription || '',
                    metaKeywords: initialData.seo?.metaKeywords || [],
                    ogImage: initialData.seo?.ogImage || '',
                    ogTitle: initialData.seo?.ogTitle || '',
                    ogDescription: initialData.seo?.ogDescription || '',
                    score: initialData.seo?.score || 0,
                },
            });
        } else {
            reset(defaultValues);
        }
    }, [initialData, reset]);

    // Auto-generate slug from title
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
                    params: { type: 'page', id: initialData?._id }
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
                description: getValues('seo.metaDescription') || '',
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
            id="page-form"
            onSubmit={handleSubmit(onSubmit, (formErrors) => {
                if (formErrors?.seo) {
                    setActiveTab(1);
                }
            })}
        >
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Content" />
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
                                            label="Page Title"
                                            fullWidth
                                            required
                                            error={!!errors.title}
                                            helperText={errors.title?.message}
                                            placeholder="About Us"
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="heading"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Page Heading (H1)"
                                            fullWidth
                                            error={!!errors.heading}
                                            helperText={errors.heading?.message}
                                            placeholder="About Us"
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
                                            label="Page Content"
                                            variant="full"
                                            error={!!errors.content}
                                            helperText={errors.content?.message}
                                            minHeight={400}
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
                                    </TextField>
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

            {/* Tab 1: SEO */}
            {activeTab === 1 && (
                <Grid container spacing={3}>
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
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="seo.metaKeywords"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Meta Keywords"
                                    fullWidth
                                    placeholder="keyword1, keyword2, keyword3"
                                    helperText="Separate keywords with commas"
                                    value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // Store as array of strings
                                        const kws = val.split(',').map(k => k.trim());
                                        field.onChange(kws);
                                    }}
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
                                    label="OG Title"
                                    fullWidth
                                    error={!!errors.seo?.ogTitle}
                                    helperText={errors.seo?.ogTitle?.message || `${field.value?.length || 0}/60 characters`}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="seo.ogDescription"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="OG Description"
                                    fullWidth
                                    error={!!errors.seo?.ogDescription}
                                    helperText={errors.seo?.ogDescription?.message || `${field.value?.length || 0}/160 characters`}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="seo.ogImage"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="OG Image URL"
                                    fullWidth
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
                            )}
                        />
                    </Grid>
                    {initialData?.seo?.canonicalUrl && (
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
                    <Grid size={{ xs: 12 }}>
                        <SeoSuggestions suggestions={seoSuggestions} score={seoScore} />
                    </Grid>
                </Grid>
            )}

            {activeTab === 1 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
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
                        disabled={isCalculatingSeo}
                    >
                        {isCalculatingSeo ? 'Calculating...' : 'Calculate SEO Score'}
                    </Button>
                </Box>
            )}

            <AdminAIAssistant entityType="page" getValues={getValues} setValue={setValue as any} />
        </Box>
    );
}
