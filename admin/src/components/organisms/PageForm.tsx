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
} from '@mui/material';
import { Page } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import RichTextEditor from '@/components/molecules/RichTextEditor';
import { FileItem } from '@/types/file';

// Validation Schema
const schema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    storeId: z.string().min(1, 'Store is required'),
    content: z.string().optional(),
    featuredImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    status: z.enum(['draft', 'published']),
    template: z.enum(['default', 'full-width', 'sidebar', 'landing']),
    showInHeader: z.boolean(),
    showInFooter: z.boolean(),
    footerGroup: z.string().optional(),
    sortOrder: z.number().min(0).optional(),

    // SEO
    seo: z.object({
        metaTitle: z.string().max(60).optional(),
        metaDescription: z.string().max(160).optional(),
        metaKeywords: z.array(z.string()).optional(),
        ogImage: z.string().url().optional().or(z.literal('')),
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
    slug: '',
    storeId: '',
    content: '',
    featuredImage: '',
    status: 'draft',
    template: 'default',
    showInHeader: false,
    showInFooter: false,
    footerGroup: '',
    sortOrder: 0,
    seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
        ogImage: '',
    },
};

export default function PageForm({ initialData, onSubmit, isSubmitting = false }: PageFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const [activeTab, setActiveTab] = useState(0);
    const watchedTitle = watch('title');
    const watchedShowInFooter = watch('showInFooter');

    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? initialData.storeId._id
                : initialData.storeId || '';

            reset({
                title: initialData.title || '',
                slug: initialData.slug || '',
                storeId: storeId,
                content: initialData.content || '',
                featuredImage: initialData.featuredImage || '',
                status: initialData.status || 'draft',
                template: initialData.template || 'default',
                showInHeader: initialData.showInHeader ?? false,
                showInFooter: initialData.showInFooter ?? false,
                footerGroup: initialData.footerGroup || '',
                sortOrder: initialData.sortOrder ?? 0,
                seo: {
                    metaTitle: initialData.seo?.metaTitle || '',
                    metaDescription: initialData.seo?.metaDescription || '',
                    metaKeywords: initialData.seo?.metaKeywords || [],
                    ogImage: initialData.seo?.ogImage || '',
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
            setValue('slug', slug);
        }
    }, [watchedTitle, initialData, setValue]);

    return (
        <Box component="form" id="page-form" onSubmit={handleSubmit(onSubmit)}>
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
                                    <TextField
                                        {...field}
                                        label="Slug"
                                        fullWidth
                                        required
                                        error={!!errors.slug}
                                        helperText={errors.slug?.message || 'URL path: /page/your-slug'}
                                        disabled={!!initialData}
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

            {/* Tab 1: Settings */}
            {activeTab === 1 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="template"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Template"
                                    fullWidth
                                >
                                    <MenuItem value="default">Default</MenuItem>
                                    <MenuItem value="full-width">Full Width</MenuItem>
                                    <MenuItem value="sidebar">With Sidebar</MenuItem>
                                    <MenuItem value="landing">Landing Page</MenuItem>
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
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                            Navigation Settings
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="showInHeader"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Show in Header Navigation"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="showInFooter"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Show in Footer"
                                />
                            )}
                        />
                    </Grid>

                    {watchedShowInFooter && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="footerGroup"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Footer Group"
                                        fullWidth
                                        helperText="Group this page under a footer section"
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        <MenuItem value="Company">Company</MenuItem>
                                        <MenuItem value="Support">Support</MenuItem>
                                        <MenuItem value="Legal">Legal</MenuItem>
                                        <MenuItem value="Resources">Resources</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Tab 2: SEO */}
            {activeTab === 2 && (
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
                                    helperText={`${field.value?.length || 0}/60 characters`}
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
                                    helperText={`${field.value?.length || 0}/160 characters`}
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
                </Grid>
            )}
        </Box>
    );
}
