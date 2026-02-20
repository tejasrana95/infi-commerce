'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    Grid,
    Typography,
} from '@mui/material';
import { Geo, GeoGroup } from '@/types';
import CountryAutocomplete from '@/components/molecules/CountryAutocomplete';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';

// Validation Schema
const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    storeId: z.string().min(1, 'Store is required'),
    description: z.string().optional(),
    countries: z.array(z.string()),
    includeAllCountries: z.boolean().default(false),
    excludedCountries: z.array(z.string()).default([]),
    isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface GeoGroupFormProps {
    initialData?: Partial<GeoGroup>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
    availableCountries: Geo[];
}

const defaultValues: FormData = {
    name: '',
    storeId: '',
    description: '',
    countries: [],
    includeAllCountries: false,
    excludedCountries: [],
    isActive: true,
};

export default function GeoGroupForm({ initialData, onSubmit, availableCountries }: GeoGroupFormProps) {
    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });
    const includeAllCountries = watch('includeAllCountries');

    useEffect(() => {
        if (initialData) {
            // Handle storeId - it might be populated as an object or just a string
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? (initialData.storeId as { _id?: string })._id
                : initialData.storeId || '';

            reset({
                name: initialData.name || '',
                storeId: storeId,
                description: initialData.description || '',
                countries: initialData.countries || initialData.geos || [],
                includeAllCountries: initialData.includeAllCountries || false,
                excludedCountries: initialData.excludedCountries || [],
                isActive: initialData.isActive ?? true,
            });
        } else {
            reset(defaultValues);
        }
    }, [initialData, reset]);

    return (
        <Box component="form" id="geo-group-form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Name"
                                fullWidth
                                error={!!errors.name}
                                helperText={errors.name?.message}
                            />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
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
                        name="includeAllCountries"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={!!field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                }
                                label="Include all countries"
                            />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">
                        {includeAllCountries
                            ? 'All countries will be included except the excluded countries below.'
                            : 'Select specific countries to include in this group.'}
                    </Typography>
                </Grid>
                {!includeAllCountries && (
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="countries"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <CountryAutocomplete
                                    value={value || []}
                                    onChange={onChange}
                                    multiple
                                    label="Included Countries"
                                    error={!!errors.countries}
                                    helperText={errors.countries?.message}
                                />
                            )}
                        />
                    </Grid>
                )}
                {includeAllCountries && (
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="excludedCountries"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <CountryAutocomplete
                                    value={value || []}
                                    onChange={onChange}
                                    multiple
                                    label="Excluded Countries"
                                    helperText="These countries will be excluded from the group."
                                />
                            )}
                        />
                    </Grid>
                )}
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
        </Box>
    );
}
