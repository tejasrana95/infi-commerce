'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Checkbox,
    FormControlLabel,
    Grid,
    Button,
    Divider,
    Typography,
    CircularProgress,
    Select,
    MenuItem,
    Chip,
    InputLabel,
    FormControl
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminAIAssistant from '../organisms/AdminAIAssistant/AdminAIAssistant';
import SeoSuggestions from '../molecules/SeoSuggestions';
import api from '@/lib/api';
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
    channels: z.array(z.string()).optional(),
    isActive: z.boolean(),
    seo: z.object({
        metaTitle: z.string().max(60).optional(),
        metaDescription: z.string().max(160).optional(),
        metaKeywords: z.array(z.string()).optional(),
        score: z.number().min(0).max(100).optional(),
    }).optional(),
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
        getValues, // Added getValues
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
            channels: [],
            isActive: true,
            seo: {
                metaTitle: '',
                metaDescription: '',
                metaKeywords: [],
                score: 0,
            },
        },
    });
    const [isCalculatingSeo, setIsCalculatingSeo] = useState(false);
    const [seoSuggestions, setSeoSuggestions] = useState<string[]>([]);
    const watchName = watch('name');
    const seoScore = watch('seo.score') || 0;



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
            setValue('channels', initialData.channels || []);
            setValue('isActive', initialData.isActive !== undefined ? initialData.isActive : true);
            if (initialData.seo) {
                setValue('seo.metaTitle', initialData.seo.metaTitle || '');
                setValue('seo.metaDescription', initialData.seo.metaDescription || '');
                setValue('seo.metaKeywords', initialData.seo.metaKeywords || []);
                setValue('seo.score', initialData.seo.score || 0);
            }
        }
    }, [initialData, setValue]);

    const handleCalculateSeo = async () => {
        setIsCalculatingSeo(true);
        try {
            const seoData = {
                title: getValues('seo.metaTitle') || getValues('name'),
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
                <Grid size={{ xs: 12 }}>
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
                    <Divider sx={{ my: 2 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">SEO Settings</Typography>
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
                                helperText={errors.seo?.metaTitle?.message}
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
                                helperText={errors.seo?.metaDescription?.message}
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <SeoSuggestions suggestions={seoSuggestions} score={seoScore} />
                </Grid>
            </Grid>
            <AdminAIAssistant entityType="brand" getValues={getValues} setValue={setValue as any} />
        </Box>
    );
}
