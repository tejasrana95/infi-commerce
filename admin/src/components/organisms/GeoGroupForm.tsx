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
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Chip,
    OutlinedInput,
} from '@mui/material';
import { Geo, GeoGroup } from '@/types';
import CountryAutocomplete from '@/components/molecules/CountryAutocomplete';

// Validation Schema
const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    countries: z.array(z.string()),
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
    description: '',
    countries: [],
    isActive: true,
};

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

export default function GeoGroupForm({ initialData, onSubmit, availableCountries }: GeoGroupFormProps) {
    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name || '',
                description: initialData.description || '',
                countries: initialData.countries || initialData.geos || [],
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
                        name="countries"
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <CountryAutocomplete
                                value={value || []}
                                onChange={onChange}
                                multiple
                                label="Countries"
                                error={!!errors.countries}
                                helperText={errors.countries?.message}
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
        </Box>
    );
}
