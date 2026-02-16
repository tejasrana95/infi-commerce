'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Button,
    Alert,
    Divider,
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
    domains: z.array(z.string().refine((value) => {
        const isLocalhost = /^localhost(:\d{1,5})?$/.test(value);
        const isStandardDomain = /^[a-z0-9.-]+\.[a-z]{2,}$/.test(value);
        return isLocalhost || isStandardDomain;
    }, 'Invalid domain format')).min(1, 'At least one domain is required'),
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
        allowCustomerLogin: z.boolean().optional(),
        allowCustomerSignup: z.boolean().optional(),
        allowGuestCheckout: z.boolean().optional(),
        requireEmailVerification: z.boolean().optional(),
        minOrderAmount: z.number().min(0).optional(),
        maxOrderAmount: z.number().min(0).optional(),
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
        // Social Login
        socialLogin: z.object({
            google: z.object({
                enabled: z.boolean(),
                clientId: z.string().optional(),
                clientSecret: z.string().optional(),
            }),
            facebook: z.object({
                enabled: z.boolean(),
                clientId: z.string().optional(),
                clientSecret: z.string().optional(),
            }),
        }).optional(),
        // Google Analytics
        // Google Analytics
        googleAnalytics: z.object({
            enabled: z.boolean(),
            trackingId: z.string().optional(),
        }),
        // Contact Info
        contact: z.object({
            address: z.string().optional(),
            phone: z.string().optional(),
            email: z.string().email('Invalid email address').optional().or(z.literal('')),
        }).optional(),
        // Price Visibility
        priceVisibility: z.object({
            showPrice: z.boolean(),
            hiddenPriceMessage: z.string().optional(),
            contactUsLink: z.string().optional(),
            hideForUnauthenticated: z.boolean().optional(),
            geoRestrictions: z.array(z.object({
                countryCodes: z.array(z.string()).optional(),
                stateCodes: z.array(z.string()).optional(),
                cityNames: z.array(z.string()).optional(),
            })).optional(),
        }).optional(),
    }),
});

export type StoreFormData = z.infer<typeof schema>;

interface StoreFormProps {
    initialData?: Partial<Store>;
    onSubmit: (data: StoreFormData) => Promise<void>;
    isSubmitting?: boolean;
}

const defaultValues: StoreFormData = {
    name: '',
    slug: '',
    domains: [],
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
        allowCustomerLogin: true,
        allowCustomerSignup: true,
        allowGuestCheckout: true,
        shippingEnabled: true,
        reviewSettings: {
            allowReviews: true,
            allowGuestReviews: true,
            requireGuestEmailVerification: false,
            requireApproval: true,
            allowImages: true,
            maxImagesPerReview: 5,
        },
        socialLogin: {
            google: { enabled: false, clientId: '', clientSecret: '' },
            facebook: { enabled: false, clientId: '', clientSecret: '' },
        },
        googleAnalytics: {
            enabled: false,
            trackingId: '',
        },
        contact: {
            address: '',
            phone: '',
            email: '',
        },
        priceVisibility: {
            showPrice: true,
            hiddenPriceMessage: 'Login to View Price',
            contactUsLink: '/contact',
            hideForUnauthenticated: false,
            geoRestrictions: [],
        },
    },
};

export default function StoreForm({ initialData, onSubmit, isSubmitting = false }: StoreFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<StoreFormData>({
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
                domains: initialData.domains || [],
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
                    allowCustomerLogin: initialData.settings?.allowCustomerLogin ?? true,
                    allowCustomerSignup: initialData.settings?.allowCustomerSignup ?? true,
                    allowGuestCheckout: initialData.settings?.allowGuestCheckout ?? true,
                    requireEmailVerification: initialData.settings?.requireEmailVerification ?? false,
                    minOrderAmount: initialData.settings?.minOrderAmount,
                    maxOrderAmount: initialData.settings?.maxOrderAmount,
                    shippingEnabled: initialData.settings?.shippingEnabled ?? true,
                    reviewSettings: {
                        allowReviews: initialData.settings?.reviewSettings?.allowReviews ?? true,
                        allowGuestReviews: initialData.settings?.reviewSettings?.allowGuestReviews ?? true,
                        requireGuestEmailVerification: initialData.settings?.reviewSettings?.requireGuestEmailVerification ?? false,
                        requireApproval: initialData.settings?.reviewSettings?.requireApproval ?? true,
                        allowImages: initialData.settings?.reviewSettings?.allowImages ?? true,
                        maxImagesPerReview: initialData.settings?.reviewSettings?.maxImagesPerReview ?? 5,
                    },
                    socialLogin: {
                        google: {
                            enabled: initialData.settings?.socialLogin?.google?.enabled ?? false,
                            clientId: initialData.settings?.socialLogin?.google?.clientId ?? '',
                            clientSecret: initialData.settings?.socialLogin?.google?.clientSecret ?? '',
                        },
                        facebook: {
                            enabled: initialData.settings?.socialLogin?.facebook?.enabled ?? false,
                            clientId: initialData.settings?.socialLogin?.facebook?.clientId ?? '',
                            clientSecret: initialData.settings?.socialLogin?.facebook?.clientSecret ?? '',
                        },
                    },
                    googleAnalytics: {
                        enabled: initialData.settings?.googleAnalytics?.enabled ?? false,
                        trackingId: initialData.settings?.googleAnalytics?.trackingId ?? '',
                    },
                    contact: {
                        address: initialData.settings?.contact?.address || '',
                        phone: initialData.settings?.contact?.phone || '',
                        email: initialData.settings?.contact?.email || '',
                    },
                    priceVisibility: {
                        showPrice: initialData.settings?.priceVisibility?.showPrice ?? true,
                        hiddenPriceMessage: initialData.settings?.priceVisibility?.hiddenPriceMessage || 'Login to View Price',
                        contactUsLink: initialData.settings?.priceVisibility?.contactUsLink || '/contact',
                        hideForUnauthenticated: initialData.settings?.priceVisibility?.hideForUnauthenticated ?? false,
                        geoRestrictions: initialData.settings?.priceVisibility?.geoRestrictions || [],
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
                <Tab label="Social Login" />
                <Tab label="Analytics" />
            </Tabs>

            {/* Tab 4: Analytics */}
            {activeTab === 4 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom>Google Analytics</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="settings.googleAnalytics.enabled"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Enable Google Analytics Tracking"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.googleAnalytics.trackingId"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Tracking ID"
                                    fullWidth
                                    placeholder="G-XXXXXXXXXX"
                                    helperText="Enter your Google Analytics 4 Measurement ID"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            )}

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
                            name="domains"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Autocomplete
                                    multiple
                                    freeSolo
                                    value={value || []}
                                    onChange={(_, newValue) => onChange(newValue.map((v: string) => v.toLowerCase().trim()))}
                                    options={[]}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                label={index === 0 ? `${option} (Primary)` : option}
                                                {...getTagProps({ index })}
                                                key={index}
                                                color={index === 0 ? 'primary' : 'default'}
                                            />
                                        ))
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Domains *"
                                            placeholder="Type domain and press Enter"
                                            error={!!errors.domains}
                                            helperText={errors.domains?.message || 'First domain is primary. Add www, subdomains as needed.'}
                                        />
                                    )}
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
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Contact Information</Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="settings.contact.address"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Store Address"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="123 Store Street, City, Country"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.contact.phone"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Customer Care Number"
                                    fullWidth
                                    placeholder="+1 234 567 8900"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.contact.email"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Customer Care Email"
                                    fullWidth
                                    error={!!errors.settings?.contact?.email}
                                    helperText={errors.settings?.contact?.email?.message}
                                    placeholder="support@example.com"
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
                        <Typography variant="h6" gutterBottom>Customer Authentication</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.allowCustomerLogin"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Allow Customer Login"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.allowCustomerSignup"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Allow Customer Signup"
                                />
                            )}
                        />
                    </Grid>
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
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Shipping</Typography>
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

                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Price Visibility</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Control how and when product prices are displayed to visitors
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="settings.priceVisibility.showPrice"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Show Price"
                                />
                            )}
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                            When disabled, prices are hidden everywhere and a custom message is shown instead
                        </Typography>
                    </Grid>

                    {!watch('settings.priceVisibility.showPrice') && (
                        <>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Controller
                                    name="settings.priceVisibility.hiddenPriceMessage"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Hidden Price Message"
                                            fullWidth
                                            placeholder="Login to View Price"
                                            helperText="This message will be shown in place of the price"
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Controller
                                    name="settings.priceVisibility.contactUsLink"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Contact Us Link"
                                            fullWidth
                                            placeholder="/contact"
                                            helperText="URL for the 'Contact Us' button shown in place of Add to Cart / Buy Now (e.g. /contact or https://example.com/contact)"
                                        />
                                    )}
                                />
                            </Grid>
                        </>
                    )}

                    {watch('settings.priceVisibility.showPrice') && (
                        <>
                            <Grid size={{ xs: 12 }}>
                                <Accordion defaultExpanded={
                                    watch('settings.priceVisibility.hideForUnauthenticated') ||
                                    (watch('settings.priceVisibility.geoRestrictions')?.length ?? 0) > 0
                                }>
                                    <AccordionSummary expandIcon={<span>&#9660;</span>}>
                                        <Typography variant="subtitle1" fontWeight={600}>Advanced Settings</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12 }}>
                                                <Controller
                                                    name="settings.priceVisibility.hideForUnauthenticated"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <FormControlLabel
                                                            control={<Switch checked={field.value ?? false} onChange={field.onChange} />}
                                                            label="Hide price for unauthenticated users"
                                                        />
                                                    )}
                                                />
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Users must log in to see prices. Useful for B2B or wholesale stores.
                                                </Typography>
                                            </Grid>

                                            {watch('settings.priceVisibility.hideForUnauthenticated') && (
                                                <Grid size={{ xs: 12, md: 8 }}>
                                                    <Controller
                                                        name="settings.priceVisibility.hiddenPriceMessage"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <TextField
                                                                {...field}
                                                                label="Hidden Price Message"
                                                                fullWidth
                                                                placeholder="Login to View Price"
                                                                helperText="Message shown to unauthenticated users instead of the price"
                                                            />
                                                        )}
                                                    />
                                                </Grid>
                                            )}

                                            <Grid size={{ xs: 12 }}>
                                                <Divider sx={{ my: 1 }} />
                                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                                                    Hide Price for GEO Locations
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                    Add rules to hide prices for specific geographic locations.
                                                    If any field in a rule matches the visitor&apos;s location, prices will be hidden.
                                                </Typography>
                                            </Grid>

                                            {(watch('settings.priceVisibility.geoRestrictions') || []).map((_: any, index: number) => (
                                                <Grid size={{ xs: 12 }} key={index}>
                                                    <Box sx={{
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        borderRadius: 2,
                                                        p: 2,
                                                        position: 'relative',
                                                    }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                            <Typography variant="subtitle2" color="text.secondary">
                                                                Rule {index + 1}
                                                            </Typography>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => {
                                                                    const current = watch('settings.priceVisibility.geoRestrictions') || [];
                                                                    setValue(
                                                                        'settings.priceVisibility.geoRestrictions',
                                                                        current.filter((_: any, i: number) => i !== index)
                                                                    );
                                                                }}
                                                                title="Remove Rule"
                                                            >
                                                                &#10005;
                                                            </IconButton>
                                                        </Box>
                                                        <Grid container spacing={2}>
                                                            <Grid size={{ xs: 12, md: 4 }}>
                                                                <Controller
                                                                    name={`settings.priceVisibility.geoRestrictions.${index}.countryCodes` as any}
                                                                    control={control}
                                                                    render={({ field: { onChange, value } }) => (
                                                                        <TextField
                                                                            value={(value || []).join(', ')}
                                                                            onChange={(e) => {
                                                                                const values = e.target.value
                                                                                    .split(',')
                                                                                    .map(v => v.trim().toUpperCase())
                                                                                    .filter(v => v.length > 0);
                                                                                onChange(values);
                                                                            }}
                                                                            label="Country Codes (ISO)"
                                                                            placeholder="e.g. US, GB, IN"
                                                                            helperText="ISO 3166-1 alpha-2 codes (comma-separated)"
                                                                            size="small"
                                                                            fullWidth
                                                                        />
                                                                    )}
                                                                />
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 4 }}>
                                                                <Controller
                                                                    name={`settings.priceVisibility.geoRestrictions.${index}.stateCodes` as any}
                                                                    control={control}
                                                                    render={({ field: { onChange, value } }) => (
                                                                        <TextField
                                                                            value={(value || []).join(', ')}
                                                                            onChange={(e) => {
                                                                                const values = e.target.value
                                                                                    .split(',')
                                                                                    .map(v => v.trim().toUpperCase())
                                                                                    .filter(v => v.length > 0);
                                                                                onChange(values);
                                                                            }}
                                                                            label="State Codes (ISO)"
                                                                            placeholder="e.g. US-CA, IN-MH"
                                                                            helperText="ISO 3166-2 subdivision codes (comma-separated)"
                                                                            size="small"
                                                                            fullWidth
                                                                        />
                                                                    )}
                                                                />
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 4 }}>
                                                                <Controller
                                                                    name={`settings.priceVisibility.geoRestrictions.${index}.cityNames` as any}
                                                                    control={control}
                                                                    render={({ field: { onChange, value } }) => (
                                                                        <TextField
                                                                            value={(value || []).join(', ')}
                                                                            onChange={(e) => {
                                                                                const values = e.target.value
                                                                                    .split(',')
                                                                                    .map(v => v.trim())
                                                                                    .filter(v => v.length > 0);
                                                                                onChange(values);
                                                                            }}
                                                                            label="City Names"
                                                                            placeholder="e.g. Mumbai, New York"
                                                                            helperText="Exact city names (comma-separated)"
                                                                            size="small"
                                                                            fullWidth
                                                                        />
                                                                    )}
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                </Grid>
                                            ))}

                                            <Grid size={{ xs: 12 }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => {
                                                        const current = watch('settings.priceVisibility.geoRestrictions') || [];
                                                        setValue('settings.priceVisibility.geoRestrictions', [
                                                            ...current,
                                                            { countryCodes: [], stateCodes: [], cityNames: [] },
                                                        ]);
                                                    }}
                                                >
                                                    + Add GEO Rule
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            </Grid>
                        </>
                    )}

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

            {/* Tab 3: Social Login */}
            {activeTab === 3 && (
                <Grid container spacing={3}>
                    {/* Google Login */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom>Google Login</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="settings.socialLogin.google.enabled"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Enable Google Login"
                                />
                            )}
                        />
                    </Grid>
                    {watch('settings.socialLogin.google.enabled') && (
                        <>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="settings.socialLogin.google.clientId"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Google Client ID"
                                            fullWidth
                                            helperText="From Google Cloud Console"
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="settings.socialLogin.google.clientSecret"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Google Client Secret"
                                            fullWidth
                                            type="password"
                                        />
                                    )}
                                />
                            </Grid>
                        </>
                    )}

                    {/* Facebook Login */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Facebook Login</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="settings.socialLogin.facebook.enabled"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Enable Facebook Login"
                                />
                            )}
                        />
                    </Grid>
                    {watch('settings.socialLogin.facebook.enabled') && (
                        <>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="settings.socialLogin.facebook.clientId"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Facebook App ID"
                                            fullWidth
                                            helperText="From Meta for Developers"
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="settings.socialLogin.facebook.clientSecret"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Facebook App Secret"
                                            fullWidth
                                            type="password"
                                        />
                                    )}
                                />
                            </Grid>
                        </>
                    )}
                </Grid>
            )}
        </Box>
    );
}
