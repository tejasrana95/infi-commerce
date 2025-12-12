'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    MenuItem,
    Grid,
    Typography,
    Autocomplete,
} from '@mui/material';
import { Geo } from '@/types';
import api from '@/lib/api';
import CountryAutocomplete from '@/components/molecules/CountryAutocomplete';

// Validation Schema
const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['country', 'state', 'city']),
    code: z.string().optional(), // For state/city codes
    countryCode: z.string().optional(), // For country ISO code
    parentCountry: z.string().optional(),
    parentState: z.string().optional(),
    isActive: z.boolean(),
    isShippingAvailable: z.boolean().optional(),
}).refine((data) => {
    if (data.type === 'country' && !data.countryCode) return false;
    if (data.type === 'state') {
        if (!data.code || !data.parentCountry) return false;
    }
    if (data.type === 'city') {
        if (!data.parentCountry || !data.parentState) return false;
    }
    return true;
}, {
    message: "Code and Parent references are required dependent on type",
    path: ["code"]
});

type FormData = z.infer<typeof schema>;

interface GeoFormProps {
    initialData?: Partial<Geo> & { parentCountry?: string; parentState?: string };
    onSubmit: (data: FormData) => Promise<void>;
    availableCountries: Geo[]; // Countries only
}

const defaultValues: FormData = {
    name: '',
    type: 'country',
    code: '',
    countryCode: '',
    parentCountry: '',
    parentState: '',
    isActive: true,
    isShippingAvailable: true,
};

export default function GeoForm({ initialData, onSubmit, availableCountries }: GeoFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const watchedType = watch('type');
    const watchedParentCountry = watch('parentCountry');
    const [availableStates, setAvailableStates] = useState<Geo[]>([]);
    const [loadingStates, setLoadingStates] = useState(false);

    // Fetch states when country is selected OR when initialData has parentCountry
    useEffect(() => {
        const fetchStates = async () => {
            if (!watchedParentCountry) {
                setAvailableStates([]);
                return;
            }

            const country = availableCountries.find(c => c.code === watchedParentCountry);
            if (!country) return;

            setLoadingStates(true);
            try {
                const response = await api.get(`/geo/countries/${country._id}/states`);
                setAvailableStates(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch states:', error);
                setAvailableStates([]);
            } finally {
                setLoadingStates(false);
            }
        };

        fetchStates();
    }, [watchedParentCountry, availableCountries]);

    // Handle initialData - set form values
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name || '',
                type: (initialData.type as 'country' | 'state' | 'city') || 'country',
                code: initialData.code || '',
                countryCode: initialData.code || '', // In flat structure, countries use 'code'
                parentCountry: initialData.parentCountry || '',
                parentState: initialData.parentState || '',
                isActive: initialData.isActive ?? true,
                isShippingAvailable: initialData.isShippingAvailable ?? true,
            });
        } else {
            reset(defaultValues);
        }
    }, [initialData, reset]);

    // Filter states that belong to the selected country
    const statesForSelectedCountry = useMemo(() => {
        return availableStates;
    }, [availableStates]);

    return (
        <Box component="form" id="geo-form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 12 }}>
                    <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                label="Type"
                                fullWidth
                                disabled={!!initialData} // Lock type on edit if desired, or allow change? Usually lock.
                                error={!!errors.type}
                                helperText={errors.type?.message}
                                onChange={(e) => {
                                    field.onChange(e);
                                    // Reset dep fields on type change
                                    setValue('parentCountry', '');
                                    setValue('parentState', '');
                                }}
                            >
                                <MenuItem value="country">Country</MenuItem>
                                <MenuItem value="state">State</MenuItem>
                                <MenuItem value="city">City</MenuItem>
                            </TextField>
                        )}
                    />
                </Grid>

                {/* Parent Country - for State and City */}
                {(watchedType === 'state' || watchedType === 'city') && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                            name="parentCountry"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <CountryAutocomplete
                                    value={value || null}
                                    onChange={(newValue) => {
                                        onChange(newValue);
                                        // Reset state when country changes
                                        setValue('parentState', '');
                                    }}
                                    label="Parent Country"
                                    error={!!errors.parentCountry}
                                    helperText={errors.parentCountry?.message}
                                />
                            )}
                        />
                    </Grid>
                )}

                {/* Parent State - for City */}
                {watchedType === 'city' && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                            name="parentState"
                            control={control}
                            render={({ field: { onChange, value, ...field } }) => (
                                <Autocomplete
                                    {...field}
                                    value={statesForSelectedCountry.find(s => s.code === value) || null}
                                    onChange={(_, newValue) => onChange(newValue?.code || '')}
                                    options={statesForSelectedCountry}
                                    getOptionLabel={(option) => `${option.name} (${option.code})`}
                                    isOptionEqualToValue={(option, value) => option.code === value?.code}
                                    disabled={!watchedParentCountry}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Parent State"
                                            error={!!errors.parentState}
                                            helperText={errors.parentState?.message || (!watchedParentCountry ? 'Select a country first' : '')}
                                        />
                                    )}
                                />
                            )}
                        />
                    </Grid>
                )}

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={watchedType === 'country' ? 'Country Name' : 'Name'}
                                fullWidth
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                placeholder={watchedType === 'country' ? 'United States' : watchedType === 'state' ? 'New York' : 'New York City'}
                            />
                        )}
                    />
                </Grid>

                {watchedType === 'country' ? (
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                            name="countryCode"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Country Code (ISO)"
                                    fullWidth
                                    error={!!errors.countryCode}
                                    helperText={errors.countryCode?.message || "2-letter ISO code (e.g., US, GB, CA)"}
                                    placeholder="US"
                                    slotProps={{ htmlInput: { style: { textTransform: 'uppercase' }, maxLength: 2 } }}
                                />
                            )}
                        />
                    </Grid>
                ) : watchedType === 'state' ? (
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                            name="code"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="State Code"
                                    fullWidth
                                    error={!!errors.code}
                                    helperText={errors.code?.message || "State abbreviation (e.g., NY, CA)"}
                                    placeholder="NY"
                                    slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                                />
                            )}
                        />
                    </Grid>
                ) : null}

                <Grid size={{ xs: 12 }}>
                    <Box display="flex" gap={3}>
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
                        {watchedType === 'country' && (
                            <Controller
                                name="isShippingAvailable"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Switch checked={field.value} onChange={field.onChange} />}
                                        label="Shipping Available"
                                    />
                                )}
                            />
                        )}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
