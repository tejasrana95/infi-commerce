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
    Button,
    IconButton,
    Typography,
    Paper,
    Grid,
    Chip,
} from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StoreAutocomplete from '../molecules/StoreAutocomplete';
import CategoryAutocomplete from '../molecules/CategoryAutocomplete';

// Validation schema
const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    storeId: z.string().min(1, 'Store is required'),
    type: z.enum(['select', 'multiselect', 'checkbox', 'text', 'number']),
    options: z.array(z.string()).optional(),
    unit: z.string().optional(),
    isFilterable: z.boolean(),
    isComparable: z.boolean(),
    isRequired: z.boolean(),
    categoryIds: z.array(z.string()).optional(),
    sortOrder: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

interface AttributeFormProps {
    initialData?: any;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function AttributeForm({ initialData, onSubmit, isSubmitting = false }: AttributeFormProps) {
    const [newOption, setNewOption] = useState('');

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
            options: [],
            unit: '',
            isFilterable: true,
            isComparable: true,
            isRequired: false,
            categoryIds: [],
            sortOrder: 0,
        },
    });

    const watchName = watch('name');
    const watchType = watch('type');
    const watchOptions = watch('options') || [];
    const watchStoreId = watch('storeId');

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
            setValue('type', initialData.type || 'select');
            setValue('options', initialData.options || []);
            setValue('unit', initialData.unit || '');
            setValue('isFilterable', initialData.isFilterable !== undefined ? initialData.isFilterable : true);
            setValue('isComparable', initialData.isComparable !== undefined ? initialData.isComparable : true);
            setValue('isRequired', initialData.isRequired !== undefined ? initialData.isRequired : false);
            setValue('categoryIds', initialData.categoryIds?.map((c: any) => typeof c === 'object' ? c._id : c) || []);
            setValue('sortOrder', initialData.sortOrder || 0);
        }
    }, [initialData, setValue]);

    const handleAddOption = () => {
        if (newOption.trim()) {
            setValue('options', [...watchOptions, newOption.trim()]);
            setNewOption('');
        }
    };

    const handleRemoveOption = (index: number) => {
        setValue('options', watchOptions.filter((_, i) => i !== index));
    };

    const handleFormSubmit = (data: FormData) => {
        // Clean up data based on type
        const cleanedData = {
            ...data,
            options: ['select', 'multiselect'].includes(data.type) ? data.options : undefined,
            unit: data.type === 'number' ? data.unit : undefined,
        };
        onSubmit(cleanedData);
    };

    const showOptionsField = watchType === 'select' || watchType === 'multiselect';
    const showUnitField = watchType === 'number';

    return (
        <Box component="form" id="attribute-form" onSubmit={handleSubmit(handleFormSubmit)}>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
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
                                    helperText={errors.name?.message || 'e.g., Screen Size, Weight, Recyclable'}
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
                                    helperText={errors.slug?.message || 'Used in URLs and filtering'}
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
                                        <MenuItem value="select">Dropdown (Single Select)</MenuItem>
                                        <MenuItem value="multiselect">Multi-Select</MenuItem>
                                        <MenuItem value="checkbox">Checkbox (Yes/No)</MenuItem>
                                        <MenuItem value="text">Text (Free Input)</MenuItem>
                                        <MenuItem value="number">Number (With Unit)</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Grid>

                    {showUnitField && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="unit"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Unit"
                                        fullWidth
                                        helperText="e.g., kg, GB, cm, inch"
                                    />
                                )}
                            />
                        </Grid>
                    )}

                    <Grid size={{ xs: 12, md: 6 }}>
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
                </Grid>
            </Paper>

            {/* Options Section - Only for select/multiselect */}
            {showOptionsField && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Options</Typography>
                    <Box display="flex" gap={1} mb={2}>
                        <TextField
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            label="Add Option"
                            size="small"
                            fullWidth
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddOption();
                                }
                            }}
                            helperText="Press Enter or click Add to add option"
                        />
                        <Button
                            variant="outlined"
                            onClick={handleAddOption}
                            startIcon={<AddIcon />}
                        >
                            Add
                        </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                        {watchOptions.map((option, index) => (
                            <Chip
                                key={index}
                                label={option}
                                onDelete={() => handleRemoveOption(index)}
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                        {watchOptions.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No options added yet. Add at least one option.
                            </Typography>
                        )}
                    </Box>
                </Paper>
            )}

            {/* Category Restrictions */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Category Restrictions (Optional)</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Leave empty to apply this attribute to all categories, or select specific categories.
                </Typography>
                <Controller
                    name="categoryIds"
                    control={control}
                    render={({ field }) => (
                        <CategoryAutocomplete
                            storeId={watchStoreId}
                            value={field.value || []}
                            onChange={field.onChange}
                            label="Limit to Categories"
                            multiple
                        />
                    )}
                />
            </Paper>

            {/* Settings */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Settings</Typography>
                <Grid container spacing={2}>
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

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="isComparable"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Show in Product Comparison"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="isRequired"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Required on Product"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
