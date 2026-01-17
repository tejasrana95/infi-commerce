'use client';

import { useEffect } from 'react';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    Grid,
    MenuItem,
    Typography,
    Slider,
    Paper,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Banner } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { ColorPicker } from '@/components/atoms';
import { FileItem } from '@/types/file';

// Validation Schema
const schema = z.object({
    name: z.string().min(1, 'Banner name is required'),
    storeId: z.string().min(1, 'Store is required'),
    image: z.string().min(1, 'Banner image is required'),
    mobileImage: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right']),
    overlay: z.object({
        enabled: z.boolean(),
        color: z.string(),
        opacity: z.number().min(0).max(1),
    }),
    textColor: z.string().optional(),
    isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const defaultValues: FormData = {
    name: '',
    storeId: '',
    image: '',
    mobileImage: '',
    title: '',
    subtitle: '',
    ctaText: '',
    ctaLink: '',
    alignment: 'center',
    overlay: {
        enabled: false,
        color: '#000000',
        opacity: 0.3,
    },
    textColor: '#ffffff',
    isActive: true,
};

interface BannerFormProps {
    initialData?: Banner;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function BannerForm({ initialData, onSubmit, isSubmitting = false }: BannerFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const watchOverlayEnabled = watch('overlay.enabled');

    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? initialData.storeId._id
                : initialData.storeId;

            reset({
                name: initialData.name || '',
                storeId: storeId || '',
                image: initialData.image || '',
                mobileImage: initialData.mobileImage || '',
                title: initialData.title || '',
                subtitle: initialData.subtitle || '',
                ctaText: initialData.ctaText || '',
                ctaLink: initialData.ctaLink || '',
                alignment: initialData.alignment || 'center',
                overlay: initialData.overlay || { enabled: false, color: '#000000', opacity: 0.3 },
                textColor: initialData.textColor || '#ffffff',
                isActive: initialData.isActive ?? true,
            });
        }
    }, [initialData, reset]);

    const handleImageSelect = (files: FileItem[]) => {
        if (files.length > 0) {
            setValue('image', files[0].url);
        }
    };

    const handleMobileImageSelect = (files: FileItem[]) => {
        if (files.length > 0) {
            setValue('mobileImage', files[0].url);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Left Column - Main Content */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Banner Details
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Banner Name"
                                            fullWidth
                                            required
                                            error={!!errors.name}
                                            helperText={errors.name?.message || 'Internal name for identification'}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="title"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Banner Title"
                                            fullWidth
                                            error={!!errors.title}
                                            helperText="Headline text displayed on the banner"
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="subtitle"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Subtitle"
                                            fullWidth
                                            error={!!errors.subtitle}
                                            helperText="Secondary text below the title"
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="ctaText"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="CTA Button Text"
                                            fullWidth
                                            placeholder="Shop Now"
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="ctaLink"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="CTA Button Link"
                                            fullWidth
                                            placeholder="/collections/summer-sale"
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Images Section */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Banner Images
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Desktop Image *
                                    </Typography>
                                    <Controller
                                        name="image"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                <FileManagerButton
                                                    onSelect={handleImageSelect}
                                                    accept="image/*"
                                                    label="Choose Desktop Image"
                                                    fullWidth
                                                />
                                                {field.value && (
                                                    <Box mt={1}>
                                                        <img
                                                            src={field.value}
                                                            alt="Banner preview"
                                                            style={{
                                                                width: '100%',
                                                                height: 150,
                                                                objectFit: 'cover',
                                                                borderRadius: 8,
                                                            }}
                                                        />
                                                    </Box>
                                                )}
                                                {errors.image && (
                                                    <Typography color="error" variant="caption">
                                                        {errors.image.message}
                                                    </Typography>
                                                )}
                                            </>
                                        )}
                                    />
                                </Box>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Mobile Image (Optional)
                                    </Typography>
                                    <Controller
                                        name="mobileImage"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                <FileManagerButton
                                                    onSelect={handleMobileImageSelect}
                                                    accept="image/*"
                                                    label="Choose Mobile Image"
                                                    fullWidth
                                                />
                                                {field.value && (
                                                    <Box mt={1}>
                                                        <img
                                                            src={field.value}
                                                            alt="Mobile preview"
                                                            style={{
                                                                width: '100%',
                                                                height: 150,
                                                                objectFit: 'cover',
                                                                borderRadius: 8,
                                                            }}
                                                        />
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Overlay Settings */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Text Overlay
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="overlay.enabled"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={<Switch checked={field.value} onChange={field.onChange} />}
                                            label="Enable overlay for better text visibility"
                                        />
                                    )}
                                />
                            </Grid>

                            {watchOverlayEnabled && (
                                <>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="overlay.color"
                                            control={control}
                                            render={({ field }) => (
                                                <Box>

                                                    <ColorPicker
                                                        label="Overlay Color"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                </Box>
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="overlay.opacity"
                                            control={control}
                                            render={({ field }) => (
                                                <Box>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Overlay Opacity: {Math.round(field.value * 100)}%
                                                    </Typography>
                                                    <Slider
                                                        value={field.value}
                                                        onChange={(_, val) => field.onChange(val)}
                                                        min={0}
                                                        max={1}
                                                        step={0.1}
                                                    />
                                                </Box>
                                            )}
                                        />
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </Paper>
                </Grid>

                {/* Right Column - Settings */}
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
                                    disabled={!!initialData}
                                />
                            )}
                        />

                        <Controller
                            name="alignment"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Text Alignment"
                                    fullWidth
                                >
                                    <MenuItem value="left">Left</MenuItem>
                                    <MenuItem value="center">Center</MenuItem>
                                    <MenuItem value="right">Right</MenuItem>
                                </TextField>
                            )}
                        />

                        <Controller
                            name="textColor"
                            control={control}
                            render={({ field }) => (
                                <Box>

                                    <ColorPicker
                                        label="Text Color"
                                        value={field.value || '#ffffff'}
                                        onChange={field.onChange}
                                    />
                                </Box>
                            )}
                        />

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

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.7 : 1,
                            }}
                        >
                            {isSubmitting ? 'Saving...' : (initialData ? 'Update Banner' : 'Create Banner')}
                        </button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
