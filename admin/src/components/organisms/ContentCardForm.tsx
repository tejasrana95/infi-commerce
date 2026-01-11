'use client';

import { useEffect, useState } from 'react';
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
    Button,
    Typography,
    IconButton,
    Radio,
    RadioGroup,
    FormControl,
    FormLabel,
    Autocomplete,
    Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import ContentCardCategoryAutocomplete from '@/components/molecules/ContentCardCategoryAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import RichTextEditor from '@/components/molecules/RichTextEditor';
import IconPicker from '@/components/atoms/IconPicker';
import { FileItem } from '@/types/file';

// Validation Schema
const schema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/),
    storeId: z.string().min(1, 'Store is required'),

    visualType: z.enum(['image', 'icon']),
    image: z.string().url().optional().or(z.literal('')),
    icon: z.string().optional(),

    excerpt: z.string().optional(),
    content: z.string().min(1, 'Content is required'),

    metadata: z.array(z.object({
        icon: z.string().optional(),
        label: z.string().min(1, 'Label is required'),
        value: z.string().min(1, 'Value is required'),
    })).optional(),

    valueDisplay: z.object({
        prefix: z.string().optional(),
        amount: z.string().optional(),
        postfix: z.string().optional(),
    }).optional(),

    categoryId: z.string().optional(),
    tags: z.array(z.string()).optional(),

    buttons: z.array(z.object({
        label: z.string().min(1, 'Button label is required'),
        url: z.string().min(1, 'Button URL is required'),
        isPrimary: z.boolean(),
        openInNewTab: z.boolean(),
    })).max(2, 'Maximum 2 buttons allowed'),

    status: z.enum(['draft', 'published', 'archived']),

    seo: z.object({
        metaTitle: z.string().max(60).optional(),
        metaDescription: z.string().max(160).optional(),
        metaKeywords: z.array(z.string()).optional(),
        ogImage: z.string().url().optional().or(z.literal('')),
        score: z.number().min(0).max(100).optional(),
    }).optional(),
});

type FormData = z.infer<typeof schema>;

interface ContentCardFormProps {
    initialData?: Partial<any>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
}

const defaultValues: FormData = {
    title: '',
    slug: '',
    storeId: '',
    visualType: 'image',
    image: '',
    icon: '',
    excerpt: '',
    content: '',
    metadata: [],
    valueDisplay: undefined,
    categoryId: '',
    tags: [],
    buttons: [],
    status: 'draft',
    seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
        ogImage: '',
        score: 0,
    },
};

export default function ContentCardForm({ initialData, onSubmit, isSubmitting = false }: ContentCardFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const [activeTab, setActiveTab] = useState(0);
    const watchedTitle = watch('title');
    const watchedStoreId = watch('storeId');
    const watchedVisualType = watch('visualType');

    const { fields: metadataFields, append: appendMetadata, remove: removeMetadata } = useFieldArray({
        control,
        name: 'metadata',
    });

    const { fields: buttonFields, append: appendButton, remove: removeButton } = useFieldArray({
        control,
        name: 'buttons',
    });

    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? (initialData.storeId as any)._id
                : initialData.storeId || '';

            const categoryId = typeof initialData.categoryId === 'object' && initialData.categoryId !== null
                ? (initialData.categoryId as any)._id
                : initialData.categoryId || '';

            reset({
                title: initialData.title || '',
                slug: initialData.slug || '',
                storeId: storeId,
                visualType: initialData.visualType || 'image',
                image: initialData.image || '',
                icon: initialData.icon || '',
                excerpt: initialData.excerpt || '',
                content: initialData.content || '',
                metadata: initialData.metadata || [],
                valueDisplay: initialData.valueDisplay,
                categoryId: categoryId,
                tags: initialData.tags || [],
                buttons: initialData.buttons || [],
                status: initialData.status || 'draft',
                seo: {
                    metaTitle: initialData.seo?.metaTitle || '',
                    metaDescription: initialData.seo?.metaDescription || '',
                    metaKeywords: initialData.seo?.metaKeywords || [],
                    ogImage: initialData.seo?.ogImage || '',
                    score: initialData.seo?.score || 0,
                },
            });
        } else {
            reset(defaultValues);
        }
    }, [initialData, reset]);

    useEffect(() => {
        if (!initialData && watchedTitle) {
            const slug = watchedTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setValue('slug', slug);
        }
    }, [watchedTitle, initialData, setValue]);

    return (
        <Box component="form" id="content-card-form" onSubmit={handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Content" />
                <Tab label="Metadata & Details" />
                <Tab label="Actions" />
                <Tab label="Settings" />
                <Tab label="SEO" />
            </Tabs>

            {/* Tab 0: Content */}
            {activeTab === 0 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="title"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Title"
                                            fullWidth
                                            required
                                            error={!!errors.title}
                                            helperText={errors.title?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="content"
                                    control={control}
                                    render={({ field }) => (
                                        <RichTextEditor
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            label="Content"
                                            variant="full"
                                            error={!!errors.content}
                                            helperText={errors.content?.message}
                                            minHeight={300}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="excerpt"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Excerpt"
                                            fullWidth
                                            multiline
                                            rows={3}
                                            error={!!errors.excerpt}
                                            helperText={errors.excerpt?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

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
                                    />
                                )}
                            />
                            <Controller
                                name="categoryId"
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <ContentCardCategoryAutocomplete
                                        value={value || null}
                                        onChange={onChange}
                                        storeId={watchedStoreId}
                                        label="Category"
                                    />
                                )}
                            />
                            <Controller
                                name="visualType"
                                control={control}
                                render={({ field }) => (
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend">Visual Type</FormLabel>
                                        <RadioGroup {...field} row>
                                            <FormControlLabel value="image" control={<Radio />} label="Image" />
                                            <FormControlLabel value="icon" control={<Radio />} label="Icon" />
                                        </RadioGroup>
                                    </FormControl>
                                )}
                            />



                            {watchedVisualType === 'image' ? (
                                <Controller
                                    name="image"
                                    control={control}
                                    render={({ field }) => (
                                        <Box>
                                            <TextField
                                                {...field}
                                                label="Image URL"
                                                fullWidth
                                                error={!!errors.image}
                                                helperText={errors.image?.message}
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
                            ) : (
                                <Controller
                                    name="icon"
                                    control={control}
                                    render={({ field }) => (
                                        <IconPicker
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            label="Select Icon"
                                            fullWidth
                                        />
                                    )}
                                />
                            )}

                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Status"
                                        fullWidth
                                    >
                                        <MenuItem value="draft">Draft</MenuItem>
                                        <MenuItem value="published">Published</MenuItem>
                                        <MenuItem value="archived">Archived</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Box>
                    </Grid>
                </Grid>
            )}

            {/* Tab 1: Metadata & Details */}
            {activeTab === 1 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">Metadata Fields</Typography>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={() => appendMetadata({ icon: '', label: '', value: '' })}
                                variant="outlined"
                                size="small"
                            >
                                Add Metadata
                            </Button>
                        </Box>

                        {metadataFields.map((field, index) => (
                            <Box key={field.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid size={{ xs: 12, sm: 3 }}>
                                        <Controller
                                            name={`metadata.${index}.icon`}
                                            control={control}
                                            render={({ field }) => (
                                                <IconPicker
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    label="Icon"
                                                    size="small"
                                                    fullWidth
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Controller
                                            name={`metadata.${index}.label`}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Label"
                                                    fullWidth
                                                    size="small"
                                                    placeholder="e.g., Location, Type"
                                                    error={!!errors.metadata?.[index]?.label}
                                                    helperText={errors.metadata?.[index]?.label?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Controller
                                            name={`metadata.${index}.value`}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Value"
                                                    fullWidth
                                                    size="small"
                                                    placeholder="e.g., San Francisco, Full Time"
                                                    error={!!errors.metadata?.[index]?.value}
                                                    helperText={errors.metadata?.[index]?.value?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 1 }}>
                                        <IconButton onClick={() => removeMetadata(index)} color="error" size="small">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom>Value Display (Optional)</Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <Controller
                                    name="valueDisplay.prefix"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Prefix"
                                            fullWidth
                                            placeholder="e.g., $, €"
                                            error={!!errors.valueDisplay?.prefix}
                                            helperText={errors.valueDisplay?.prefix?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Controller
                                    name="valueDisplay.amount"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Amount"
                                            fullWidth
                                            placeholder="e.g., 30000"
                                            error={!!errors.valueDisplay?.amount}
                                            helperText={errors.valueDisplay?.amount?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 5 }}>
                                <Controller
                                    name="valueDisplay.postfix"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Postfix"
                                            fullWidth
                                            placeholder="e.g., /yr, /month"
                                            error={!!errors.valueDisplay?.postfix}
                                            helperText={errors.valueDisplay?.postfix?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={{ xs: 12, md: 12 }}>
                        <Controller
                            name="tags"
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
                                            label="Tags"
                                            placeholder="Add tags"
                                        />
                                    )}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            )}

            {/* Tab 2: Actions (Buttons) */}
            {activeTab === 2 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">Action Buttons (Max 2)</Typography>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={() => appendButton({ label: '', url: '', isPrimary: false, openInNewTab: false })}
                                variant="outlined"
                                size="small"
                                disabled={buttonFields.length >= 2}
                            >
                                Add Button
                            </Button>
                        </Box>

                        {buttonFields.map((field, index) => (
                            <Box key={field.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Controller
                                            name={`buttons.${index}.label`}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Button Label"
                                                    fullWidth
                                                    placeholder="e.g., Apply Now, View Details"
                                                    error={!!errors.buttons?.[index]?.label}
                                                    helperText={errors.buttons?.[index]?.label?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 5 }}>
                                        <Controller
                                            name={`buttons.${index}.url`}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Button URL"
                                                    fullWidth
                                                    placeholder="https://..."
                                                    error={!!errors.buttons?.[index]?.url}
                                                    helperText={errors.buttons?.[index]?.url?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 1.5 }}>
                                        <Controller
                                            name={`buttons.${index}.isPrimary`}
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                                    label="Primary"
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 1.5 }}>
                                        <IconButton onClick={() => removeButton(index)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name={`buttons.${index}.openInNewTab`}
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                                    label="Open in New Tab"
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                    </Grid>
                </Grid>
            )}

            {/* Tab 3: Settings */}
            {activeTab === 3 && (
                <Grid container spacing={3}>
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
                                    helperText={errors.slug?.message}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            )}

            {/* Tab 4: SEO */}
            {activeTab === 4 && (
                <Grid container spacing={3}>
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
                                    helperText={errors.seo?.metaTitle?.message || 'Max 60 characters'}
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
                                    helperText={errors.seo?.metaDescription?.message || 'Max 160 characters'}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
