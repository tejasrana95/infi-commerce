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
import { Store } from '@/types';
import CurrencyAutocomplete from '@/components/molecules/CurrencyAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';

// Common timezones
const TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
];

// Validation Schema
const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    domain: z.string().min(1, 'Domain is required').regex(/^[a-z0-9.-]+$/, 'Invalid domain format'),
    description: z.string().optional(),
    logo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    favicon: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    currency: z.string().length(3, 'Currency must be 3 letters'),
    timezone: z.string().min(1, 'Timezone is required'),
    isActive: z.boolean(),

    // SEO Fields
    seo: z.object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaKeywords: z.array(z.string()).optional(),
        ogImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
        ogTitle: z.string().optional(),
        ogDescription: z.string().optional(),
    }).optional(),

    // Settings
    settings: z.object({
        emailNotifications: z.boolean().optional(),
        orderNotifications: z.boolean().optional(),
        maintenanceMode: z.boolean().optional(),
        allowGuestCheckout: z.boolean().optional(),
        requireEmailVerification: z.boolean().optional(),
        minOrderAmount: z.number().min(0).optional(),
        maxOrderAmount: z.number().min(0).optional(),
        taxEnabled: z.boolean().optional(),
        taxRate: z.number().min(0).max(100).optional(),
        shippingEnabled: z.boolean().optional(),
        // Review settings
        reviewSettings: z.object({
            allowReviews: z.boolean().optional(),
            allowGuestReviews: z.boolean().optional(),
            requireGuestEmailVerification: z.boolean().optional(),
            requireApproval: z.boolean().optional(),
            allowImages: z.boolean().optional(),
            maxImagesPerReview: z.number().min(1).max(10).optional(),
        }).optional(),
    }).optional(),
});

type FormData = z.infer<typeof schema>;

interface StoreFormProps {
    initialData?: Partial<Store>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
}

const defaultValues: FormData = {
    name: '',
    slug: '',
    domain: '',
    description: '',
    logo: '',
    favicon: '',
    currency: 'USD',
    timezone: 'UTC',
    isActive: true,
    seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
        ogImage: '',
        ogTitle: '',
        ogDescription: '',
    },
    settings: {
        emailNotifications: true,
        orderNotifications: true,
        maintenanceMode: false,
        allowGuestCheckout: true,
        requireEmailVerification: false,
        taxEnabled: false,
        shippingEnabled: true,
        reviewSettings: {
            allowReviews: true,
            allowGuestReviews: true,
            requireGuestEmailVerification: false,
            requireApproval: true,
            allowImages: true,
            maxImagesPerReview: 5,
        },
    },
};

export default function StoreForm({ initialData, onSubmit, isSubmitting = false }: StoreFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const [activeTab, setActiveTab] = useState(0);
    const watchedName = watch('name');

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name || '',
                slug: initialData.slug || '',
                domain: initialData.domain || '',
                description: initialData.description || '',
                logo: initialData.logo || '',
                favicon: initialData.favicon || '',
                currency: initialData.currency || 'USD',
                timezone: initialData.timezone || 'UTC',
                isActive: initialData.isActive ?? true,
                seo: {
                    metaTitle: initialData.seo?.metaTitle || '',
                    metaDescription: initialData.seo?.metaDescription || '',
                    metaKeywords: initialData.seo?.metaKeywords || [],
                    ogImage: initialData.seo?.ogImage || '',
                    ogTitle: initialData.seo?.ogTitle || '',
                    ogDescription: initialData.seo?.ogDescription || '',
                },
                settings: {
                    emailNotifications: initialData.settings?.emailNotifications ?? true,
                    orderNotifications: initialData.settings?.orderNotifications ?? true,
                    maintenanceMode: initialData.settings?.maintenanceMode ?? false,
                    allowGuestCheckout: initialData.settings?.allowGuestCheckout ?? true,
                    requireEmailVerification: initialData.settings?.requireEmailVerification ?? false,
                    minOrderAmount: initialData.settings?.minOrderAmount,
                    maxOrderAmount: initialData.settings?.maxOrderAmount,
                    taxEnabled: initialData.settings?.taxEnabled ?? false,
                    taxRate: initialData.settings?.taxRate,
                    shippingEnabled: initialData.settings?.shippingEnabled ?? true,
                    reviewSettings: {
                        allowReviews: initialData.settings?.reviewSettings?.allowReviews ?? true,
                        allowGuestReviews: initialData.settings?.reviewSettings?.allowGuestReviews ?? true,
                        requireGuestEmailVerification: initialData.settings?.reviewSettings?.requireGuestEmailVerification ?? false,
                        requireApproval: initialData.settings?.reviewSettings?.requireApproval ?? true,
                        allowImages: initialData.settings?.reviewSettings?.allowImages ?? true,
                        maxImagesPerReview: initialData.settings?.reviewSettings?.maxImagesPerReview ?? 5,
                    },
                },
            });
        } else {
            reset(defaultValues);
        }
    }, [initialData, reset]);

    // Auto-generate slug from name (only for new stores)
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
        <Box component="form" id="store-form" onSubmit={handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Basic Info" />
                <Tab label="SEO" />
                <Tab label="Settings" />
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
                                    label="Store Name"
                                    fullWidth
                                    required
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                    placeholder="My Awesome Store"
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
                                    placeholder="my-awesome-store"
                                    disabled={!!initialData}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="domain"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Domain"
                                    fullWidth
                                    required
                                    error={!!errors.domain}
                                    helperText={errors.domain?.message}
                                    placeholder="mystore.com"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="currency"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <CurrencyAutocomplete
                                    value={value || null}
                                    onChange={onChange}
                                    label="Currency"
                                    error={!!errors.currency}
                                    helperText={errors.currency?.message}
                                    required
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="timezone"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Timezone"
                                    fullWidth
                                    required
                                    error={!!errors.timezone}
                                    helperText={errors.timezone?.message}
                                >
                                    {TIMEZONES.map((tz) => (
                                        <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="logo"
                            control={control}
                            render={({ field }) => (
                                <Box>
                                    <TextField
                                        {...field}
                                        label="Logo URL"
                                        fullWidth
                                        error={!!errors.logo}
                                        helperText={errors.logo?.message}
                                        placeholder="https://example.com/logo.png"
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
                            name="favicon"
                            control={control}
                            render={({ field }) => (
                                <Box>
                                    <TextField
                                        {...field}
                                        label="Favicon URL"
                                        fullWidth
                                        error={!!errors.favicon}
                                        helperText={errors.favicon?.message}
                                        placeholder="https://example.com/favicon.ico"
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
                                    placeholder="Brief description of your store"
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
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Optimize your store for search engines and social media
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
                                    placeholder="Best Online Store - Shop Now"
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
                                    placeholder="Discover amazing products at great prices..."
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

                    <Grid size={{ xs: 12 }}>
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
                </Grid>
            )}

            {/* Tab 2: Settings */}
            {activeTab === 2 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom>Notifications</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.emailNotifications"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Email Notifications"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.orderNotifications"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Order Notifications"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Checkout</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.allowGuestCheckout"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Allow Guest Checkout"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.requireEmailVerification"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Require Email Verification"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.minOrderAmount"
                            control={control}
                            render={({ field: { onChange, value, ...field } }) => (
                                <TextField
                                    {...field}
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    label="Minimum Order Amount"
                                    type="number"
                                    fullWidth
                                    helperText="Leave empty for no minimum"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.maxOrderAmount"
                            control={control}
                            render={({ field: { onChange, value, ...field } }) => (
                                <TextField
                                    {...field}
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    label="Maximum Order Amount"
                                    type="number"
                                    fullWidth
                                    helperText="Leave empty for no maximum"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Tax & Shipping</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.taxEnabled"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Tax Enabled"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.taxRate"
                            control={control}
                            render={({ field: { onChange, value, ...field } }) => (
                                <TextField
                                    {...field}
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    label="Tax Rate (%)"
                                    type="number"
                                    fullWidth
                                    slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.shippingEnabled"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Shipping Enabled"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Maintenance</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="settings.maintenanceMode"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Maintenance Mode"
                                />
                            )}
                        />
                    </Grid>

                    {/* Review Settings Section */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Reviews</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.reviewSettings.allowReviews"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Allow Reviews"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.reviewSettings.allowGuestReviews"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Allow Guest Reviews"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.reviewSettings.requireGuestEmailVerification"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Require Guest Email Verification"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.reviewSettings.requireApproval"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Require Approval Before Publishing"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.reviewSettings.allowImages"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Allow Images in Reviews"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.reviewSettings.maxImagesPerReview"
                            control={control}
                            render={({ field: { onChange, value, ...field } }) => (
                                <TextField
                                    {...field}
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    label="Max Images Per Review"
                                    type="number"
                                    fullWidth
                                    slotProps={{ htmlInput: { min: 1, max: 10 } }}
                                    helperText="Maximum number of images allowed per review (1-10)"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
