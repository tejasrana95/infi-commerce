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
    Avatar,
} from '@mui/material';
import { useForm, Controller, useFieldArray, Control, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ImageIcon from '@mui/icons-material/Image';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BannerSlider } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';

// Validation Schema
const slideSchema = z.object({
    bannerId: z.string().optional(),
    image: z.string().optional(),
    mobileImage: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    textColor: z.string().optional(),
    order: z.number(),
});

const schema = z.object({
    name: z.string().min(1, 'Slider name is required'),
    storeId: z.string().min(1, 'Store is required'),
    slides: z.array(slideSchema).min(1, 'At least one slide is required'),
    settings: z.object({
        autoplay: z.boolean(),
        interval: z.number().min(1000),
        showArrows: z.boolean(),
        showDots: z.boolean(),
        pauseOnHover: z.boolean(),
        effect: z.enum(['slide', 'fade']),
    }),
    isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const defaultSlide = {
    image: '',
    mobileImage: '',
    title: '',
    subtitle: '',
    ctaText: '',
    ctaLink: '',
    alignment: 'center' as const,
    textColor: '#ffffff',
    order: 0,
};

const defaultValues: FormData = {
    name: '',
    storeId: '',
    slides: [{ ...defaultSlide, order: 0 }],
    settings: {
        autoplay: true,
        interval: 5000,
        showArrows: true,
        showDots: true,
        pauseOnHover: true,
        effect: 'slide',
    },
    isActive: true,
};

// Sortable Slide Item Component
interface SortableSlideItemProps {
    id: string;
    index: number;
    control: Control<FormData>;
    isExpanded: boolean;
    onToggle: () => void;
    onRemove: () => void;
    canRemove: boolean;
    onSelectImage: (files: FileItem[]) => void;
    onSelectMobileImage: (files: FileItem[]) => void;
}

function SortableSlideItem({
    id,
    index,
    control,
    isExpanded,
    onToggle,
    onRemove,
    canRemove,
    onSelectImage,
    onSelectMobileImage,
}: SortableSlideItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Use useWatch for proper subscription in child component
    const slideImage = useWatch({ control, name: `slides.${index}.image` as const });
    const slideMobileImage = useWatch({ control, name: `slides.${index}.mobileImage` as const });
    const slideTitle = useWatch({ control, name: `slides.${index}.title` as const });

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            variant="outlined"
            sx={{
                mb: 2,
                border: isExpanded ? '2px solid' : '1px solid',
                borderColor: isExpanded ? 'primary.main' : 'divider',
            }}
        >
            {/* Slide Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                }}
            >
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{ cursor: 'grab', display: 'flex', mr: 1 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <DragIndicatorIcon color="action" />
                </Box>
                <Box flex={1} onClick={onToggle} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                        variant="rounded"
                        src={slideImage}
                        sx={{ width: 48, height: 32, mr: 2, bgcolor: 'grey.200' }}
                    >
                        <ImageIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle2">
                        Slide {index + 1}
                        {slideTitle && `: ${slideTitle}`}
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    disabled={!canRemove}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Slide Content */}
            {isExpanded && (
                <Box sx={{ p: 2, pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Desktop Image
                            </Typography>
                            <FileManagerButton
                                onSelect={onSelectImage}
                                accept="image/*"
                                label="Choose Image"
                                fullWidth
                            />
                            {slideImage && (
                                <Box mt={1}>
                                    <img
                                        src={slideImage}
                                        alt="Slide preview"
                                        style={{
                                            width: '100%',
                                            height: 100,
                                            objectFit: 'cover',
                                            borderRadius: 4,
                                        }}
                                    />
                                </Box>
                            )}
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Mobile Image (Optional)
                            </Typography>
                            <FileManagerButton
                                onSelect={onSelectMobileImage}
                                accept="image/*"
                                label="Choose Mobile Image"
                                fullWidth
                            />
                            {slideMobileImage && (
                                <Box mt={1}>
                                    <img
                                        src={slideMobileImage}
                                        alt="Mobile preview"
                                        style={{
                                            width: '100%',
                                            height: 100,
                                            objectFit: 'cover',
                                            borderRadius: 4,
                                        }}
                                    />
                                </Box>
                            )}
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name={`slides.${index}.title`}
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Title"
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name={`slides.${index}.subtitle`}
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Subtitle"
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name={`slides.${index}.ctaText`}
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="CTA Text"
                                        fullWidth
                                        size="small"
                                        placeholder="Shop Now"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name={`slides.${index}.ctaLink`}
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="CTA Link"
                                        fullWidth
                                        size="small"
                                        placeholder="/collections/sale"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name={`slides.${index}.alignment`}
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Alignment"
                                        fullWidth
                                        size="small"
                                    >
                                        <MenuItem value="left">Left</MenuItem>
                                        <MenuItem value="center">Center</MenuItem>
                                        <MenuItem value="right">Right</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>
            )}
        </Paper>
    );
}

interface BannerSliderFormProps {
    initialData?: BannerSlider;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function BannerSliderForm({ initialData, onSubmit, isSubmitting = false }: BannerSliderFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: 'slides',
    });

    const [expandedSlide, setExpandedSlide] = useState<number | null>(0);

    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? initialData.storeId._id
                : initialData.storeId;

            reset({
                name: initialData.name || '',
                storeId: storeId || '',
                slides: initialData.slides?.length > 0
                    ? initialData.slides.map((s, i) => ({ ...s, order: s.order ?? i }))
                    : [{ ...defaultSlide, order: 0 }],
                settings: initialData.settings || defaultValues.settings,
                isActive: initialData.isActive ?? true,
            });
        }
    }, [initialData, reset]);

    const handleSlideImageSelect = (files: FileItem[], index: number) => {
        if (files.length > 0) {
            setValue(`slides.${index}.image`, files[0].url);
        }
    };

    const handleSlideMobileImageSelect = (files: FileItem[], index: number) => {
        if (files.length > 0) {
            setValue(`slides.${index}.mobileImage`, files[0].url);
        }
    };

    const addSlide = () => {
        append({ ...defaultSlide, order: fields.length });
        setExpandedSlide(fields.length);
    };

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over.id);
            move(oldIndex, newIndex);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Left Column - Slides */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Slider Details
                        </Typography>

                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Slider Name"
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
                                Slides ({fields.length})
                            </Typography>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={addSlide}
                                variant="outlined"
                                size="small"
                            >
                                Add Slide
                            </Button>
                        </Box>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={fields.map(f => f.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {fields.map((field, index) => (
                                    <SortableSlideItem
                                        key={field.id}
                                        id={field.id}
                                        index={index}
                                        control={control}
                                        isExpanded={expandedSlide === index}
                                        onToggle={() => setExpandedSlide(expandedSlide === index ? null : index)}
                                        onRemove={() => remove(index)}
                                        canRemove={fields.length > 1}
                                        onSelectImage={(files) => handleSlideImageSelect(files, index)}
                                        onSelectMobileImage={(files) => handleSlideMobileImageSelect(files, index)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {errors.slides && (
                            <Typography color="error" variant="caption">
                                {errors.slides.message}
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
                                Slider Settings
                            </Typography>

                            <Controller
                                name="settings.effect"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Effect"
                                        fullWidth
                                        size="small"
                                        sx={{ mb: 2 }}
                                    >
                                        <MenuItem value="slide">Slide</MenuItem>
                                        <MenuItem value="fade">Fade</MenuItem>
                                    </TextField>
                                )}
                            />

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
                                        sx={{ mb: 1, mt: 1 }}
                                    />
                                )}
                            />

                            <Controller
                                name="settings.showArrows"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Switch checked={field.value} onChange={field.onChange} size="small" />}
                                        label="Show Arrows"
                                    />
                                )}
                            />

                            <Controller
                                name="settings.showDots"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Switch checked={field.value} onChange={field.onChange} size="small" />}
                                        label="Show Dots"
                                    />
                                )}
                            />

                            <Controller
                                name="settings.pauseOnHover"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Switch checked={field.value} onChange={field.onChange} size="small" />}
                                        label="Pause on Hover"
                                    />
                                )}
                            />
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
                            {isSubmitting ? 'Saving...' : (initialData ? 'Update Slider' : 'Create Slider')}
                        </button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
