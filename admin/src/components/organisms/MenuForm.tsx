'use client';

import { useEffect, useState } from 'react';
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
    Tabs,
    Tab,
    Typography,
} from '@mui/material';
import { Menu, MenuItem as MenuItemType } from '@/types';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import MenuItemBuilder from '@/components/organisms/MenuItemBuilder';

// Validation Schema
const schema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    storeId: z.string().min(1, 'Store is required'),
    location: z.enum(['header-main', 'header-top', 'footer-primary', 'footer-secondary', 'sidebar', 'mobile', 'custom']),
    description: z.string().max(255).optional(),
    isActive: z.boolean(),

    // Settings
    settings: z.object({
        style: z.enum(['horizontal', 'vertical', 'mega', 'flyout', 'accordion']),
        showIcons: z.boolean(),
        maxDepth: z.number().min(1).max(5),
        mobileBreakpoint: z.number().min(320).max(1200),
    }),
});

type FormData = z.infer<typeof schema>;

export interface MenuFormData extends FormData {
    items: MenuItemType[];
}

interface MenuFormProps {
    initialData?: Partial<Menu>;
    onSubmit: (data: MenuFormData) => Promise<void>;
    isSubmitting?: boolean;
}

const defaultValues: FormData = {
    name: '',
    slug: '',
    storeId: '',
    location: 'custom',
    description: '',
    isActive: true,
    settings: {
        style: 'horizontal',
        showIcons: false,
        maxDepth: 3,
        mobileBreakpoint: 768,
    },
};

export default function MenuForm({ initialData, onSubmit, isSubmitting = false }: MenuFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const [activeTab, setActiveTab] = useState(0);
    const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
    const watchedName = watch('name');
    const watchedStoreId = watch('storeId');
    const watchedMaxDepth = watch('settings.maxDepth');

    useEffect(() => {
        if (initialData) {
            const storeId = typeof initialData.storeId === 'object' && initialData.storeId !== null
                ? initialData.storeId._id
                : initialData.storeId || '';

            reset({
                name: initialData.name || '',
                slug: initialData.slug || '',
                storeId: storeId,
                location: initialData.location || 'custom',
                description: initialData.description || '',
                isActive: initialData.isActive ?? true,
                settings: {
                    style: initialData.settings?.style || 'horizontal',
                    showIcons: initialData.settings?.showIcons ?? false,
                    maxDepth: initialData.settings?.maxDepth ?? 3,
                    mobileBreakpoint: initialData.settings?.mobileBreakpoint ?? 768,
                },
            });
            setMenuItems(initialData.items || []);
        } else {
            reset(defaultValues);
            setMenuItems([]);
        }
    }, [initialData, reset]);

    // Auto-generate slug from name
    useEffect(() => {
        if (!initialData && watchedName) {
            const slug = watchedName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setValue('slug', slug);
        }
    }, [watchedName, initialData, setValue]);

    const handleFormSubmit = (data: FormData) => {
        onSubmit({ ...data, items: menuItems });
    };

    return (
        <Box component="form" id="menu-form" onSubmit={handleSubmit(handleFormSubmit)}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Basic Info" />
                <Tab label="Menu Items" />
                <Tab label="Settings" />
            </Tabs>

            {/* Tab 0: Basic Info */}
            {activeTab === 0 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Menu Name"
                                    fullWidth
                                    required
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                    placeholder="Main Navigation"
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
                                    helperText={errors.slug?.message || 'Unique identifier for this menu'}
                                    disabled={!!initialData}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
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
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="location"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Location"
                                    fullWidth
                                    required
                                    error={!!errors.location}
                                    helperText="Where this menu will be displayed"
                                >
                                    <MenuItem value="header-main">Header Main</MenuItem>
                                    <MenuItem value="header-top">Header Top</MenuItem>
                                    <MenuItem value="footer-primary">Footer Primary</MenuItem>
                                    <MenuItem value="footer-secondary">Footer Secondary</MenuItem>
                                    <MenuItem value="sidebar">Sidebar</MenuItem>
                                    <MenuItem value="mobile">Mobile</MenuItem>
                                    <MenuItem value="custom">Custom</MenuItem>
                                </TextField>
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
                                    rows={2}
                                    error={!!errors.description}
                                    helperText={errors.description?.message || 'Optional description for this menu'}
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
            )}

            {/* Tab 1: Menu Items */}
            {activeTab === 1 && (
                <Box>
                    <MenuItemBuilder
                        items={menuItems}
                        onChange={setMenuItems}
                        storeId={watchedStoreId}
                        maxDepth={watchedMaxDepth}
                    />
                </Box>
            )}

            {/* Tab 2: Settings */}
            {activeTab === 2 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                            Display Settings
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.style"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Menu Style"
                                    fullWidth
                                    helperText="How the menu items are displayed"
                                >
                                    <MenuItem value="horizontal">Horizontal</MenuItem>
                                    <MenuItem value="vertical">Vertical</MenuItem>
                                    <MenuItem value="mega">Mega Menu</MenuItem>
                                    <MenuItem value="flyout">Flyout</MenuItem>
                                    <MenuItem value="accordion">Accordion</MenuItem>
                                </TextField>
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.maxDepth"
                            control={control}
                            render={({ field: { onChange, value, ...field } }) => (
                                <TextField
                                    {...field}
                                    value={value}
                                    onChange={(e) => onChange(Number(e.target.value))}
                                    select
                                    label="Maximum Depth"
                                    fullWidth
                                    helperText="Maximum nesting level for menu items"
                                >
                                    <MenuItem value={1}>1 Level</MenuItem>
                                    <MenuItem value={2}>2 Levels</MenuItem>
                                    <MenuItem value={3}>3 Levels</MenuItem>
                                    <MenuItem value={4}>4 Levels</MenuItem>
                                    <MenuItem value={5}>5 Levels</MenuItem>
                                </TextField>
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.mobileBreakpoint"
                            control={control}
                            render={({ field: { onChange, value, ...field } }) => (
                                <TextField
                                    {...field}
                                    value={value}
                                    onChange={(e) => onChange(Number(e.target.value))}
                                    label="Mobile Breakpoint (px)"
                                    type="number"
                                    fullWidth
                                    helperText="Screen width below which mobile menu is shown"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="settings.showIcons"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Show Icons"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
