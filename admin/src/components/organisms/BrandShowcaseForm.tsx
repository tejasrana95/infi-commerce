'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    Grid,
    MenuItem,
    Typography,
    Paper,
    IconButton,
    Button,
} from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { BrandShowcase } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';

// Validation Schema
const logoSchema = z.object({
    image: z.string().min(1, 'Logo image is required'),
    alt: z.string().min(1, 'Alt text is required'),
    link: z.string().optional(),
    order: z.number(),
});

const schema = z.object({
    name: z.string().min(1, 'Showcase name is required'),
    storeId: z.string().min(1, 'Store is required'),
    logos: z.array(logoSchema).min(1, 'At least one logo is required'),
    settings: z.object({
        layout: z.enum(['grid', 'carousel']),
        columns: z.number().min(2).max(12),
        grayscale: z.boolean(),
        hoverEffect: z.boolean(),
        autoplay: z.boolean(),
        interval: z.number().min(1000),
    }),
    isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const defaultValues: FormData = {
    name: '',
    storeId: '',
    logos: [{ image: '', alt: '', link: '', order: 0 }],
    settings: {
        layout: 'grid',
        columns: 6,
        grayscale: false,
        hoverEffect: true,
        autoplay: true,
        interval: 3000,
    },
    isActive: true,
};

interface BrandShowcaseFormProps {
    initialData?: BrandShowcase;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function BrandShowcaseForm({ initialData, onSubmit, isSubmitting = false }: BrandShowcaseFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'logos',
    });

    const watchLayout = watch('settings.layout');

    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? initialData.storeId._id
                : initialData.storeId;

            reset({
                name: initialData.name || '',
                storeId: storeId || '',
                logos: initialData.logos?.length > 0 ? initialData.logos : [{ image: '', alt: '', link: '', order: 0 }],
                settings: initialData.settings || defaultValues.settings,
                isActive: initialData.isActive ?? true,
            });
        }
    }, [initialData, reset]);

    const handleLogoSelect = (files: FileItem[], index: number) => {
        if (files.length > 0) {
            setValue(`logos.${index}.image`, files[0].url);
        }
    };

    const addLogo = () => {
        append({ image: '', alt: '', link: '', order: fields.length });
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Left Column - Logos */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Showcase Details
                        </Typography>

                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Showcase Name"
                                    fullWidth
                                    required
                                    error={!!errors.name}
                                    helperText={errors.name?.message || 'Internal name for identification'}
                                />
                            )}
                        />
                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Brand Logos
                            </Typography>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={addLogo}
                                variant="outlined"
                                size="small"
                            >
                                Add Logo
                            </Button>
                        </Box>

                        {fields.map((field, index) => (
                            <Paper
                                key={field.id}
                                variant="outlined"
                                sx={{ p: 2, mb: 2 }}
                            >
                                <Grid container spacing={2} alignItems="center">
                                    <Grid size={{ xs: 12, md: 3 }}>
                                        <Controller
                                            name={`logos.${index}.image`}
                                            control={control}
                                            render={({ field: imgField }) => (
                                                <Box>
                                                    <FileManagerButton
                                                        onSelect={(files) => handleLogoSelect(files, index)}
                                                        accept="image/*"
                                                        label="Choose Logo"
                                                        fullWidth
                                                    />
                                                    {imgField.value && (
                                                        <Box mt={1} sx={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <img
                                                                src={imgField.value}
                                                                alt="Logo preview"
                                                                style={{ maxHeight: 50, maxWidth: '100%', objectFit: 'contain' }}
                                                            />
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 3 }}>
                                        <Controller
                                            name={`logos.${index}.alt`}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Alt Text"
                                                    fullWidth
                                                    size="small"
                                                    placeholder="Brand Name"
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name={`logos.${index}.link`}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Link (optional)"
                                                    fullWidth
                                                    size="small"
                                                    placeholder="/brands/brand-name"
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <IconButton
                                            onClick={() => remove(index)}
                                            color="error"
                                            disabled={fields.length <= 1}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}

                        {errors.logos && (
                            <Typography color="error" variant="caption">
                                {errors.logos.message || 'Please add at least one logo'}
                            </Typography>
                        )}
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

                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                Display Settings
                            </Typography>

                            <Controller
                                name="settings.layout"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Layout"
                                        fullWidth
                                        size="small"
                                        sx={{ mb: 2 }}
                                    >
                                        <MenuItem value="grid">Grid</MenuItem>
                                        <MenuItem value="carousel">Carousel</MenuItem>
                                    </TextField>
                                )}
                            />

                            <Controller
                                name="settings.columns"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        select
                                        label="Columns"
                                        fullWidth
                                        size="small"
                                        sx={{ mb: 2 }}
                                    >
                                        {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                                            <MenuItem key={n} value={n}>{n}</MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />

                            <Controller
                                name="settings.grayscale"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Switch checked={field.value} onChange={field.onChange} size="small" />}
                                        label="Grayscale logos"
                                    />
                                )}
                            />

                            <Controller
                                name="settings.hoverEffect"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Switch checked={field.value} onChange={field.onChange} size="small" />}
                                        label="Hover effect"
                                    />
                                )}
                            />

                            {watchLayout === 'carousel' && (
                                <>
                                    <Controller
                                        name="settings.autoplay"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel
                                                control={<Switch checked={field.value} onChange={field.onChange} size="small" />}
                                                label="Autoplay"
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="settings.interval"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                label="Interval (ms)"
                                                type="number"
                                                fullWidth
                                                size="small"
                                                sx={{ mt: 1 }}
                                            />
                                        )}
                                    />
                                </>
                            )}
                        </Paper>

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
                            {isSubmitting ? 'Saving...' : (initialData ? 'Update Showcase' : 'Create Showcase')}
                        </button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
