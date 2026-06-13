'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    Grid,
    Typography,
    Paper,
    Tabs,
    Tab,
    Button,
    IconButton,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Card,
    CardContent,
} from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { HeroBanner } from '@/types/content';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import RichTextEditor from '@/components/molecules/RichTextEditor';
import { ColorPicker, GradientPicker } from '@/components/atoms';
import IconPicker from '@/components/atoms/IconPicker';
import { FileItem } from '@/types/file';
import { COMMON_FONTS, FONT_WEIGHTS } from '@/utils/fonts';

const schema = z.object({
    storeId: z.string().min(1, 'Store is required'),
    name: z.string().min(1, 'Name is required'),
    isActive: z.boolean(),
    order: z.number().default(0),
    title: z.object({
        text: z.string().min(1, 'Title text is required'),
        color: z.string().optional(),
        highlightColor: z.string().optional(),
        highlightFontFamily: z.string().optional(),
        fontSize: z.string().optional(),
        fontSizeTablet: z.string().optional(),
        fontSizeMobile: z.string().optional(),
        fontFamily: z.string().optional(),
        fontWeight: z.string().optional(),
        textAlign: z.string().optional(),
        lineHeight: z.string().optional(),
    }),
    description: z.object({
        text: z.string().min(1, 'Description is required'),
        color: z.string().optional(),
        fontSize: z.string().optional(),
        fontSizeTablet: z.string().optional(),
        fontSizeMobile: z.string().optional(),
        fontFamily: z.string().optional(),
        fontWeight: z.string().optional(),
        textAlign: z.string().optional(),
        lineHeight: z.string().optional(),
    }),
    stats: z.array(z.object({
        number: z.string().min(1, 'Number is required'),
        label: z.string().min(1, 'Label is required'),
        icon: z.string().optional(),
        color: z.string().optional(),
        numberColor: z.string().optional(),
        labelColor: z.string().optional(),
        fontSize: z.string().optional(),
        numberFontSize: z.string().optional(),
        labelFontSize: z.string().optional(),
        fontFamily: z.string().optional(),
        numberFontFamily: z.string().optional(),
        labelFontFamily: z.string().optional(),
        fontWeight: z.string().optional(),
        numberFontWeight: z.string().optional(),
        labelFontWeight: z.string().optional(),
        textAlign: z.string().optional(),
        lineHeight: z.string().optional(),
    })).optional(),
    chips: z.array(z.object({
        label: z.string().min(1, 'Label is required'),
        icon: z.string().optional(),
        color: z.string().optional(),
        fontSize: z.string().optional(),
        fontFamily: z.string().optional(),
        fontWeight: z.string().optional(),
        textAlign: z.string().optional(),
        lineHeight: z.string().optional(),
        backgroundColor: z.string().optional(),
        borderRadius: z.string().optional(),
        borderColor: z.string().optional(),
    })).optional(),
    image: z.object({
        src: z.string().min(1, 'Image is required'),
        borderRadius: z.string().optional(),
        borderColor: z.string().optional(),
        borderWidth: z.string().optional(),
        highlights: z.array(z.object({
            label: z.string().optional(),
            value: z.string().optional(),
            position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
            backgroundColor: z.string().optional(),
            textColor: z.string().optional(),
            labelColor: z.string().optional(),
            labelFontFamily: z.string().optional(),
            labelFontSize: z.string().optional(),
            labelFontWeight: z.string().optional(),
            valueColor: z.string().optional(),
            valueFontFamily: z.string().optional(),
            valueFontSize: z.string().optional(),
            valueFontWeight: z.string().optional(),
        })).optional(),
    }).optional(),
    ctas: z.array(z.object({
        label: z.string().min(1, 'Label is required'),
        link: z.string().min(1, 'Link is required'),
        target: z.string().optional(),
        color: z.string().optional(),
        fontSize: z.string().optional(),
        fontFamily: z.string().optional(),
        fontWeight: z.string().optional(),
        textAlign: z.string().optional(),
        lineHeight: z.string().optional(),
        backgroundColor: z.string().optional(),
        borderRadius: z.string().optional(),
        borderColor: z.string().optional(),
    })).max(2, 'Maximum of 2 CTAs allowed').optional(),
    config: z.object({
        backgroundGradient: z.string().optional(),
        padding: z.string().optional(),
        margin: z.string().optional(),
    }).optional(),
});

type FormData = z.infer<typeof schema>;

const defaultValues: FormData = {
    storeId: '',
    name: '',
    isActive: true,
    order: 0,
    title: {
        text: '',
        color: '#111827',
        highlightColor: '#b45309',
        highlightFontFamily: '',
        fontSize: '4.5rem',
        fontSizeTablet: '3.5rem',
        fontSizeMobile: '2.5rem',
        fontFamily: 'Playfair Display, serif',
        fontWeight: 'bold',
        textAlign: 'left',
        lineHeight: '1.2',
    },
    description: {
        text: '',
        color: '#4b5563',
        fontSize: '1.125rem',
        fontSizeTablet: '1rem',
        fontSizeMobile: '0.875rem',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        textAlign: 'left',
        lineHeight: '1.6',
    },
    stats: [],
    chips: [],
    image: {
        src: '',
        borderRadius: '24px',
        borderColor: '#e5e7eb',
        borderWidth: '0px',
        highlights: [],
    },
    ctas: [],
    config: {
        backgroundGradient: 'linear-gradient(135deg, #fefaf4 0%, #f7ebd9 100%)',
        padding: '80px 0',
        margin: '0',
    },
};


interface HeroBannerFormProps {
    initialData?: HeroBanner;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function HeroBannerForm({ initialData, onSubmit, isSubmitting = false }: HeroBannerFormProps) {
    const [tabVal, setTabVal] = useState(0);

    const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const { fields: statFields, append: appendStat, remove: removeStat } = useFieldArray({
        control,
        name: 'stats',
    });

    const { fields: chipFields, append: appendChip, remove: removeChip } = useFieldArray({
        control,
        name: 'chips',
    });

    const { fields: ctaFields, append: appendCta, remove: removeCta } = useFieldArray({
        control,
        name: 'ctas',
    });

    const { fields: highlightFields, append: appendHighlight, remove: removeHighlight } = useFieldArray({
        control,
        name: 'image.highlights',
    });

    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? initialData.storeId._id
                : initialData.storeId;

            reset({
                storeId: storeId || '',
                name: initialData.name || '',
                isActive: initialData.isActive ?? true,
                order: initialData.order || 0,
                title: {
                    text: initialData.title?.text || '',
                    color: initialData.title?.color || '#111827',
                    highlightColor: initialData.title?.highlightColor || '#b45309',
                    highlightFontFamily: initialData.title?.highlightFontFamily || '',
                    fontSize: initialData.title?.fontSize || '4.5rem',
                    fontSizeTablet: initialData.title?.fontSizeTablet || '3.5rem',
                    fontSizeMobile: initialData.title?.fontSizeMobile || '2.5rem',
                    fontFamily: initialData.title?.fontFamily || 'Playfair Display, serif',
                    fontWeight: initialData.title?.fontWeight || 'bold',
                    textAlign: initialData.title?.textAlign || 'left',
                    lineHeight: initialData.title?.lineHeight || '1.2',
                },
                description: {
                    text: initialData.description?.text || '',
                    color: initialData.description?.color || '#4b5563',
                    fontSize: initialData.description?.fontSize || '1.125rem',
                    fontSizeTablet: initialData.description?.fontSizeTablet || '1rem',
                    fontSizeMobile: initialData.description?.fontSizeMobile || '0.875rem',
                    fontFamily: initialData.description?.fontFamily || 'Inter, sans-serif',
                    fontWeight: initialData.description?.fontWeight || 'normal',
                    textAlign: initialData.description?.textAlign || 'left',
                    lineHeight: initialData.description?.lineHeight || '1.6',
                },
                stats: initialData.stats || [],
                chips: initialData.chips || [],
                image: {
                    src: initialData.image?.src || '',
                    borderRadius: initialData.image?.borderRadius || '24px',
                    borderColor: initialData.image?.borderColor || '#e5e7eb',
                    borderWidth: initialData.image?.borderWidth || '0px',
                    highlights: initialData.image?.highlights || [],
                },
                ctas: initialData.ctas || [],
                config: {
                    backgroundGradient: initialData.config?.backgroundGradient || 'linear-gradient(135deg, #fefaf4 0%, #f7ebd9 100%)',
                    padding: initialData.config?.padding || '80px 0',
                    margin: initialData.config?.margin || '0',
                },
            });
        }
    }, [initialData, reset]);

    const handleImageSelect = (files: FileItem[]) => {
        if (files.length > 0) {
            setValue('image.src', files[0].url);
        }
    };

    const imageSrc = watch('image.src');

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Tabs value={tabVal} onChange={(_, val) => setTabVal(val)} sx={{ mb: 3 }}>
                <Tab label="Banner Content" />
                <Tab label="Stats & Chips" />
                <Tab label="Image & Highlights" />
                <Tab label="CTAs & Settings" />
            </Tabs>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 9 }}>
                    {/* TAB 0: Content */}
                    {tabVal === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* TITLE CONFIGURATION CARD */}
                            <Card variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Typography variant="h6" fontWeight={600} color="primary.main">
                                    Title Style & Content
                                </Typography>

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={500}>
                                        Title Text (Use Rich Text Editor to bold, italic, underline, or highlight)
                                    </Typography>
                                    <Controller
                                        name="title.text"
                                        control={control}
                                        render={({ field }) => (
                                            <RichTextEditor
                                                value={field.value}
                                                onChange={field.onChange}
                                                variant="standard"
                                                showSourceToggle
                                                minHeight={150}
                                            />
                                        )}
                                    />
                                    {errors.title?.text && (
                                        <Typography color="error" variant="caption">
                                            {errors.title.text.message}
                                        </Typography>
                                    )}
                                </Box>

                                <Typography variant="subtitle2" fontWeight={600} sx={{ borderBottom: '1px solid #eaeaea', pb: 1, mt: 1 }}>
                                    Title Typography & Colors
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="title.fontFamily"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>Font Family</InputLabel>
                                                    <Select {...field} label="Font Family">
                                                        {COMMON_FONTS.map((font) => (
                                                            <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                                                {font.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="title.fontWeight"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>Font Weight</InputLabel>
                                                    <Select {...field} label="Font Weight">
                                                        {FONT_WEIGHTS.map((weight) => (
                                                            <MenuItem key={weight.value} value={weight.value}>
                                                                {weight.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="title.textAlign"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>Align</InputLabel>
                                                    <Select {...field} label="Align">
                                                        <MenuItem value="left">Left</MenuItem>
                                                        <MenuItem value="center">Center</MenuItem>
                                                        <MenuItem value="right">Right</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="title.color"
                                            control={control}
                                            render={({ field }) => (
                                                <ColorPicker label="Title Color" value={field.value || ''} onChange={field.onChange} />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="title.highlightColor"
                                            control={control}
                                            render={({ field }) => (
                                                <ColorPicker label="Highlight Span Color" value={field.value || ''} onChange={field.onChange} />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="title.highlightFontFamily"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>Highlight Font Family</InputLabel>
                                                    <Select {...field} label="Highlight Font Family">
                                                        {COMMON_FONTS.map((font) => (
                                                            <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                                                {font.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>
                                </Grid>

                                <Typography variant="subtitle2" fontWeight={600} sx={{ borderBottom: '1px solid #eaeaea', pb: 1, mt: 1 }}>
                                    Title Font Sizes (Responsive)
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="title.fontSize"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Desktop Font Size (e.g. 4.5rem)" size="small" fullWidth />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="title.fontSizeTablet"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Tablet Font Size (e.g. 3.5rem)" size="small" fullWidth />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="title.fontSizeMobile"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Mobile Font Size (e.g. 2.5rem)" size="small" fullWidth />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </Card>

                            {/* DESCRIPTION CONFIGURATION CARD */}
                            <Card variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Typography variant="h6" fontWeight={600} color="primary.main">
                                    Description Style & Content
                                </Typography>

                                <Box>
                                    <Controller
                                        name="description.text"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Description Text"
                                                multiline
                                                rows={4}
                                                fullWidth
                                                error={!!errors.description?.text}
                                                helperText={errors.description?.text?.message}
                                            />
                                        )}
                                    />
                                </Box>

                                <Typography variant="subtitle2" fontWeight={600} sx={{ borderBottom: '1px solid #eaeaea', pb: 1, mt: 1 }}>
                                    Description Typography & Colors
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="description.fontFamily"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>Font Family</InputLabel>
                                                    <Select {...field} label="Font Family">
                                                        {COMMON_FONTS.map((font) => (
                                                            <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                                                {font.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="description.fontWeight"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>Font Weight</InputLabel>
                                                    <Select {...field} label="Font Weight">
                                                        {FONT_WEIGHTS.map((weight) => (
                                                            <MenuItem key={weight.value} value={weight.value}>
                                                                {weight.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="description.color"
                                            control={control}
                                            render={({ field }) => (
                                                <ColorPicker label="Description Color" value={field.value || ''} onChange={field.onChange} />
                                            )}
                                        />
                                    </Grid>
                                </Grid>

                                <Typography variant="subtitle2" fontWeight={600} sx={{ borderBottom: '1px solid #eaeaea', pb: 1, mt: 1 }}>
                                    Description Font Sizes (Responsive)
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="description.fontSize"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Desktop Font Size (e.g. 1.125rem)" size="small" fullWidth />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="description.fontSizeTablet"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Tablet Font Size (e.g. 1rem)" size="small" fullWidth />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="description.fontSizeMobile"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Mobile Font Size (e.g. 0.875rem)" size="small" fullWidth />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </Card>
                        </Box>
                    )}

                    {/* TAB 1: Stats & Chips */}
                    {tabVal === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Paper sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        Header Chips
                                    </Typography>
                                    <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => appendChip({
                                        label: 'New Chip',
                                        color: '#b45309',
                                        backgroundColor: '#fffaf2',
                                        borderColor: '#e8d8bd',
                                        borderRadius: '30px',
                                        fontSize: '0.875rem',
                                        fontFamily: 'Inter',
                                    })}>
                                        Add Chip
                                    </Button>
                                </Box>

                                {chipFields.map((field, index) => (
                                    <Card key={field.id} variant="outlined" sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Typography variant="subtitle2">Chip #{index + 1}</Typography>
                                                <IconButton size="small" color="error" onClick={() => removeChip(index)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Controller
                                                        name={`chips.${index}.label`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="Label" size="small" fullWidth required />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Controller
                                                        name={`chips.${index}.icon`}
                                                        control={control}
                                                        render={({ field }) => <IconPicker value={field.value || ''} onChange={field.onChange} />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Controller
                                                        name={`chips.${index}.borderRadius`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="Border Radius" size="small" fullWidth />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`chips.${index}.color`}
                                                        control={control}
                                                        render={({ field }) => <ColorPicker label="Text Color" value={field.value || ''} onChange={field.onChange} />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`chips.${index}.backgroundColor`}
                                                        control={control}
                                                        render={({ field }) => <ColorPicker label="Bg Color" value={field.value || ''} onChange={field.onChange} />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`chips.${index}.borderColor`}
                                                        control={control}
                                                        render={({ field }) => <ColorPicker label="Border Color" value={field.value || ''} onChange={field.onChange} />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`chips.${index}.fontSize`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="Font Size" size="small" fullWidth />}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Paper>

                            <Paper sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        Footer Stats
                                    </Typography>
                                    <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => appendStat({
                                        number: '5000+',
                                        label: 'Happy Devotees',
                                        color: '#111827',
                                        fontSize: '1rem',
                                        fontFamily: 'Inter',
                                    })}>
                                        Add Stat
                                    </Button>
                                </Box>

                                {statFields.map((field, index) => (
                                    <Card key={field.id} variant="outlined" sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Typography variant="subtitle2">Stat #{index + 1}</Typography>
                                                <IconButton size="small" color="error" onClick={() => removeStat(index)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Controller
                                                        name={`stats.${index}.number`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="Number/Value" size="small" fullWidth required />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Controller
                                                        name={`stats.${index}.label`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="Label" size="small" fullWidth required />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Controller
                                                        name={`stats.${index}.icon`}
                                                        control={control}
                                                        render={({ field }) => <IconPicker value={field.value || ''} onChange={field.onChange} />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, borderBottom: '1px solid #eaeaea', pb: 0.5 }}>
                                                        Number/Value Typography
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                            <Controller
                                                                name={`stats.${index}.numberColor`}
                                                                control={control}
                                                                render={({ field }) => <ColorPicker label="Color" value={field.value || ''} onChange={field.onChange} />}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                            <Controller
                                                                name={`stats.${index}.numberFontSize`}
                                                                control={control}
                                                                render={({ field }) => <TextField {...field} label="Font Size" size="small" fullWidth />}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                            <Controller
                                                                name={`stats.${index}.numberFontFamily`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <FormControl size="small" fullWidth>
                                                                        <InputLabel>Font Family</InputLabel>
                                                                        <Select {...field} label="Font Family">
                                                                            {COMMON_FONTS.map((font) => (
                                                                                <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                                                                    {font.label}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                )}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                            <Controller
                                                                name={`stats.${index}.numberFontWeight`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <FormControl size="small" fullWidth>
                                                                        <InputLabel>Font Weight</InputLabel>
                                                                        <Select {...field} label="Font Weight">
                                                                            {FONT_WEIGHTS.map((weight) => (
                                                                                <MenuItem key={weight.value} value={weight.value}>
                                                                                    {weight.label}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                )}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, borderBottom: '1px solid #eaeaea', pb: 0.5 }}>
                                                        Label Typography
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                            <Controller
                                                                name={`stats.${index}.labelColor`}
                                                                control={control}
                                                                render={({ field }) => <ColorPicker label="Color" value={field.value || ''} onChange={field.onChange} />}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                            <Controller
                                                                name={`stats.${index}.labelFontSize`}
                                                                control={control}
                                                                render={({ field }) => <TextField {...field} label="Font Size" size="small" fullWidth />}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                            <Controller
                                                                name={`stats.${index}.labelFontFamily`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <FormControl size="small" fullWidth>
                                                                        <InputLabel>Font Family</InputLabel>
                                                                        <Select {...field} label="Font Family">
                                                                            {COMMON_FONTS.map((font) => (
                                                                                <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                                                                    {font.label}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                )}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                            <Controller
                                                                name={`stats.${index}.labelFontWeight`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <FormControl size="small" fullWidth>
                                                                        <InputLabel>Font Weight</InputLabel>
                                                                        <Select {...field} label="Font Weight">
                                                                            {FONT_WEIGHTS.map((weight) => (
                                                                                <MenuItem key={weight.value} value={weight.value}>
                                                                                    {weight.label}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                )}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Paper>
                        </Box>
                    )}

                    {/* TAB 2: Image & Highlights */}
                    {tabVal === 2 && (
                        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Image Configuration
                            </Typography>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Upload / Select Image
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <FileManagerButton
                                        onSelect={handleImageSelect}
                                        accept="image/*"
                                        label="Choose Image"
                                    />
                                    {imageSrc && (
                                        <Box sx={{ width: 120, height: 120, borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                            <img src={imageSrc} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </Box>
                                    )}
                                </Box>
                                {errors.image?.src && (
                                    <Typography color="error" variant="caption">
                                        {errors.image.src.message}
                                    </Typography>
                                )}
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                                <Controller
                                    name="image.borderRadius"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Image Border Radius" size="small" />}
                                />
                                <Controller
                                    name="image.borderWidth"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Image Border Width" size="small" />}
                                />
                                <Controller
                                    name="image.borderColor"
                                    control={control}
                                    render={({ field }) => <ColorPicker label="Image Border Color" value={field.value || ''} onChange={field.onChange} />}
                                />
                            </Box>

                            <Box sx={{ borderTop: '1px solid #eee', pt: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Floating Image Highlights
                                    </Typography>
                                    <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => appendHighlight({
                                        label: 'Since',
                                        value: '2009',
                                        position: 'top-right',
                                        backgroundColor: '#b45309',
                                        textColor: '#ffffff',
                                    })}>
                                        Add Highlight
                                    </Button>
                                </Box>

                                {highlightFields.map((field, index) => (
                                    <Card key={field.id} variant="outlined" sx={{ mb: 2 }}>
                                        <CardContent sx={{ pb: '16px !important' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Typography variant="subtitle2">Highlight #{index + 1}</Typography>
                                                <IconButton size="small" color="error" onClick={() => removeHighlight(index)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`image.highlights.${index}.label`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="Label" size="small" fullWidth />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`image.highlights.${index}.value`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="Value" size="small" fullWidth />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`image.highlights.${index}.position`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <FormControl size="small" fullWidth>
                                                                <InputLabel>Position</InputLabel>
                                                                <Select {...field} label="Position">
                                                                    <MenuItem value="top-left">Top Left</MenuItem>
                                                                    <MenuItem value="top-right">Top Right</MenuItem>
                                                                    <MenuItem value="bottom-left">Bottom Left</MenuItem>
                                                                    <MenuItem value="bottom-right">Bottom Right</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        )}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`image.highlights.${index}.backgroundColor`}
                                                        control={control}
                                                        render={({ field }) => <ColorPicker label="Card Bg Color" value={field.value || ''} onChange={field.onChange} />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`image.highlights.${index}.textColor`}
                                                        control={control}
                                                        render={({ field }) => <ColorPicker label="Card Text Color" value={field.value || ''} onChange={field.onChange} />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 12 }}>
                                                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, borderBottom: '1px solid #eaeaea', pb: 0.5 }} fontWeight={600}>
                                                        Label Typography Settings
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid size={{ xs: 12, md: 3 }}>
                                                            <Controller
                                                                name={`image.highlights.${index}.labelColor`}
                                                                control={control}
                                                                render={({ field }) => <ColorPicker label="Label Color" value={field.value || ''} onChange={field.onChange} />}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 3 }}>
                                                            <Controller
                                                                name={`image.highlights.${index}.labelFontFamily`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <FormControl size="small" fullWidth>
                                                                        <InputLabel>Label Font Family</InputLabel>
                                                                        <Select {...field} label="Label Font Family">
                                                                            {COMMON_FONTS.map((font) => (
                                                                                <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                                                                    {font.label}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                )}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 3 }}>
                                                            <Controller
                                                                name={`image.highlights.${index}.labelFontSize`}
                                                                control={control}
                                                                render={({ field }) => <TextField {...field} label="Label Font Size" size="small" fullWidth />}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 3 }}>
                                                            <Controller
                                                                name={`image.highlights.${index}.labelFontWeight`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <FormControl size="small" fullWidth>
                                                                        <InputLabel>Label Font Weight</InputLabel>
                                                                        <Select {...field} label="Label Font Weight">
                                                                            {FONT_WEIGHTS.map((weight) => (
                                                                                <MenuItem key={weight.value} value={weight.value}>
                                                                                    {weight.label}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                )}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 12 }}>
                                                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, borderBottom: '1px solid #eaeaea', pb: 0.5 }} fontWeight={600}>
                                                        Value Typography Settings
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid size={{ xs: 12, md: 3 }}>
                                                            <Controller
                                                                name={`image.highlights.${index}.valueColor`}
                                                                control={control}
                                                                render={({ field }) => <ColorPicker label="Value Color" value={field.value || ''} onChange={field.onChange} />}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 3 }}>
                                                            <Controller
                                                                name={`image.highlights.${index}.valueFontFamily`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <FormControl size="small" fullWidth>
                                                                        <InputLabel>Value Font Family</InputLabel>
                                                                        <Select {...field} label="Value Font Family">
                                                                            {COMMON_FONTS.map((font) => (
                                                                                <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                                                                    {font.label}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                )}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 3 }}>
                                                            <Controller
                                                                name={`image.highlights.${index}.valueFontSize`}
                                                                control={control}
                                                                render={({ field }) => <TextField {...field} label="Value Font Size" size="small" fullWidth />}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 3 }}>
                                                            <Controller
                                                                name={`image.highlights.${index}.valueFontWeight`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <FormControl size="small" fullWidth>
                                                                        <InputLabel>Value Font Weight</InputLabel>
                                                                        <Select {...field} label="Value Font Weight">
                                                                            {FONT_WEIGHTS.map((weight) => (
                                                                                <MenuItem key={weight.value} value={weight.value}>
                                                                                    {weight.label}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                )}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Paper>
                    )}

                    {/* TAB 3: CTAs & Settings */}
                    {tabVal === 3 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Paper sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        CTAs (Max 2)
                                    </Typography>
                                    <Button
                                        startIcon={<AddIcon />}
                                        variant="outlined"
                                        size="small"
                                        disabled={ctaFields.length >= 2}
                                        onClick={() => appendCta({
                                            label: 'Shop Now',
                                            link: '/shop',
                                            target: '_self',
                                            backgroundColor: '#b45309',
                                            color: '#ffffff',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            fontFamily: 'Inter',
                                        })}
                                    >
                                        Add CTA
                                    </Button>
                                </Box>

                                {ctaFields.map((field, index) => (
                                    <Card key={field.id} variant="outlined" sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Typography variant="subtitle2">CTA #{index + 1}</Typography>
                                                <IconButton size="small" color="error" onClick={() => removeCta(index)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Controller
                                                        name={`ctas.${index}.label`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="Label" size="small" fullWidth required />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Controller
                                                        name={`ctas.${index}.link`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="Link" size="small" fullWidth required />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Controller
                                                        name={`ctas.${index}.target`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <FormControl size="small" fullWidth>
                                                                <InputLabel>Target</InputLabel>
                                                                <Select {...field} label="Target">
                                                                    <MenuItem value="_self">Same Tab</MenuItem>
                                                                    <MenuItem value="_blank">New Tab</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        )}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`ctas.${index}.color`}
                                                        control={control}
                                                        render={({ field }) => <ColorPicker label="Text Color" value={field.value || ''} onChange={field.onChange} />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`ctas.${index}.backgroundColor`}
                                                        control={control}
                                                        render={({ field }) => <ColorPicker label="Bg Color" value={field.value || ''} onChange={field.onChange} />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`ctas.${index}.borderColor`}
                                                        control={control}
                                                        render={({ field }) => <ColorPicker label="Border Color" value={field.value || ''} onChange={field.onChange} />}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <Controller
                                                        name={`ctas.${index}.borderRadius`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="Border Radius" size="small" fullWidth />}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Paper>

                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Banner Container Style Config
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <Controller
                                            name="config.backgroundGradient"
                                            control={control}
                                            render={({ field }) => (
                                                <GradientPicker
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    label="Background CSS (color/gradient)"
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 3 }}>
                                        <Controller
                                            name="config.padding"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Container Padding" fullWidth size="small" placeholder="80px 0" />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 3 }}>
                                        <Controller
                                            name="config.margin"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Container Margin" fullWidth size="small" placeholder="0" />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Box>
                    )}
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Admin Settings
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Admin Reference Name"
                                            size="small"
                                            fullWidth
                                            required
                                            error={!!errors.name}
                                            helperText={errors.name?.message}
                                        />
                                    )}
                                />

                                <Controller
                                    name="order"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            label="Display Order"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            helperText="Lower numbers appear first"
                                        />
                                    )}
                                />

                                <Controller
                                    name="isActive"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={<Switch checked={field.value} onChange={field.onChange} />}
                                            label="Active / Visible"
                                        />
                                    )}
                                />
                            </Box>
                        </Paper>

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
