'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Checkbox,
    FormControlLabel,
    Tabs,
    Tab,
    Button,
    IconButton,
    Typography,
    Paper,
    Grid,
} from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StoreAutocomplete from '../molecules/StoreAutocomplete';
import FileManagerButton from '../molecules/FileManagerButton';
import { ColorPicker } from '../atoms';

// Validation schema
const productOptionValueSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    value: z.string().min(1, 'Value is required'),
    colorCode: z.string().optional(),
    image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    storeId: z.string().min(1, 'Store is required'),
    type: z.enum(['select', 'multiselect', 'text', 'color', 'size']),
    values: z.array(productOptionValueSchema).min(1, 'At least one value is required'),
    isFilterable: z.boolean(),
    sortOrder: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

interface ProductOptionFormProps {
    initialData?: any;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function ProductOptionForm({ initialData, onSubmit, isSubmitting = false }: ProductOptionFormProps) {
    const [activeTab, setActiveTab] = useState(0);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            slug: '',
            storeId: '',
            type: 'select',
            values: [{ label: '', value: '', colorCode: '', image: '' }],
            isFilterable: true,
            sortOrder: 0,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'values',
    });

    const watchName = watch('name');
    const watchType = watch('type');
    const watchValues = watch('values');

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

    // Auto-generate value from label
    useEffect(() => {
        watchValues.forEach((val, index) => {
            if (val.label && !val.value) {
                const autoValue = val.label
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                setValue(`values.${index}.value`, autoValue);
            }
        });
    }, [watchValues, setValue]);

    // Initialize form with existing data
    useEffect(() => {
        if (initialData) {
            setValue('name', initialData.name || '');
            setValue('slug', initialData.slug || '');
            setValue('storeId', typeof initialData.storeId === 'object' ? initialData.storeId._id : initialData.storeId || '');
            setValue('type', initialData.type || 'select');
            setValue('values', initialData.values && initialData.values.length > 0
                ? initialData.values.map((v: any) => ({
                    label: v.label || '',
                    value: v.value || '',
                    colorCode: v.colorCode || '',
                    image: v.image || '',
                }))
                : [{ label: '', value: '', colorCode: '', image: '' }]
            );
            setValue('isFilterable', initialData.isFilterable !== undefined ? initialData.isFilterable : true);
            setValue('sortOrder', initialData.sortOrder || 0);
        }
    }, [initialData, setValue]);

    const handleFormSubmit = (data: FormData) => {
        // Clean up empty optional fields
        const cleanedData = {
            ...data,
            values: data.values.map(v => ({
                label: v.label,
                value: v.value,
                colorCode: v.colorCode || undefined,
                image: v.image || undefined,
            })),
        };
        onSubmit(cleanedData);
    };

    return (
        <Box component="form" id="product-option-form" onSubmit={handleSubmit(handleFormSubmit)}>
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                    <Tab label="Basic Info" />
                    <Tab label="Option Values" />
                </Tabs>
            </Paper>

            {/* Basic Info Tab */}
            {activeTab === 0 && (
                <Paper sx={{ p: 3 }}>
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

                        <Grid size={{ xs: 12, md: 6 }}>
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

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth required error={!!errors.type}>
                                        <InputLabel>Type</InputLabel>
                                        <Select {...field} label="Type">
                                            <MenuItem value="select">Select (Single Choice)</MenuItem>
                                            <MenuItem value="multiselect">Multi-Select (Multiple Choice)</MenuItem>
                                            <MenuItem value="text">Text</MenuItem>
                                            <MenuItem value="color">Color</MenuItem>
                                            <MenuItem value="size">Size</MenuItem>
                                        </Select>
                                        {errors.type && (
                                            <Typography variant="caption" color="error">
                                                {errors.type.message}
                                            </Typography>
                                        )}
                                    </FormControl>
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="sortOrder"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Sort Order"
                                        type="number"
                                        fullWidth
                                        error={!!errors.sortOrder}
                                        helperText={errors.sortOrder?.message}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="isFilterable"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={field.value} />}
                                        label="Show in Product Filters"
                                    />
                                )}
                            />
                        </Grid>


                    </Grid>
                </Paper>
            )}

            {/* Values Tab */}
            {activeTab === 1 && (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Option Values</Typography>
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => append({ label: '', value: '', colorCode: '', image: '' })}
                            variant="outlined"
                        >
                            Add Value
                        </Button>
                    </Box>

                    {errors.values && typeof errors.values.message === 'string' && (
                        <Typography variant="caption" color="error" sx={{ mb: 2, display: 'block' }}>
                            {errors.values.message}
                        </Typography>
                    )}

                    {fields.map((field, index) => (
                        <Paper key={field.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <Grid container spacing={2} alignItems="flex-start">
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <Controller
                                        name={`values.${index}.label`}
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Label"
                                                fullWidth
                                                required
                                                size="small"
                                                error={!!errors.values?.[index]?.label}
                                                helperText={errors.values?.[index]?.label?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 3 }}>
                                    <Controller
                                        name={`values.${index}.value`}
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Value"
                                                fullWidth
                                                required
                                                size="small"
                                                error={!!errors.values?.[index]?.value}
                                                helperText={errors.values?.[index]?.value?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                {watchType === 'color' && (
                                    <Grid size={{ xs: 12, md: 2 }}>
                                        <Controller
                                            name={`values.${index}.colorCode`}
                                            control={control}
                                            render={({ field }) => (
                                                <ColorPicker
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    label="Color Code"
                                                    size="small"
                                                    error={!!errors.values?.[index]?.colorCode}
                                                    helperText={errors.values?.[index]?.colorCode?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                )}

                                <Grid size={{ xs: 12, md: watchType === 'color' ? 3 : 5 }}>
                                    <Controller
                                        name={`values.${index}.image`}
                                        control={control}
                                        render={({ field }) => (
                                            <Box>
                                                <FileManagerButton
                                                    label="Select Image"
                                                    onSelect={(files) => field.onChange(files[0]?.url || '')}
                                                    accept="image/*"
                                                    size="small"
                                                    fullWidth
                                                />
                                                {field.value && (
                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                        {field.value}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 1 }}>
                                    <IconButton
                                        onClick={() => remove(index)}
                                        color="error"
                                        disabled={fields.length === 1}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                </Paper>
            )}
        </Box>
    );
}
