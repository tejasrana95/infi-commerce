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
    Paper,
    Grid,
    Chip,
    IconButton,
    Typography,
    Button,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import api from '@/lib/api';
import StoreAutocomplete from '../molecules/StoreAutocomplete';
import BrandAutocomplete from '../molecules/BrandAutocomplete';
import CategoryAutocomplete from '../molecules/CategoryAutocomplete';
import FileManagerButton from '../molecules/FileManagerButton';
import VideosField from './ProductForm/VideosField';
import GeoLimitsField from './ProductForm/GeoLimitsField';
import DownloadFilesField from './ProductForm/DownloadFilesField';
import ProductOptionManager from './ProductForm/ProductOptionManager';
import SpecificationManager from './ProductForm/SpecificationManager';
import VariantManager from './ProductForm/VariantManager';
import RichTextEditor from '../molecules/RichTextEditor';


// Validation schema
const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    storeId: z.string().min(1, 'Store is required'),
    type: z.enum(['simple', 'variable', 'digital']),
    sku: z.string().min(1, 'SKU is required'),
    description: z.string().min(1, 'Description is required'),
    shortDescription: z.string().optional(),
    brand: z.string().optional(),
    categoryIds: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),

    // Pricing
    price: z.number().min(0, 'Price must be positive'),
    salePrice: z.number().min(0).optional(),
    salePriceStartDate: z.string().optional(),
    salePriceEndDate: z.string().optional(),
    costPrice: z.number().min(0).optional(),

    // Inventory
    stock: z.number().min(0, 'Stock must be positive'),
    manageStock: z.boolean(),
    stockStatus: z.enum(['in_stock', 'out_of_stock', 'on_backorder', 'made_to_order']),
    lowStockThreshold: z.number().min(0).optional(),

    // Shipping
    weight: z.number().min(0).optional(),
    dimensions: z.object({
        length: z.number().min(0).optional(),
        width: z.number().min(0).optional(),
        height: z.number().min(0).optional(),
        unit: z.enum(['cm', 'in']).optional(),
    }).optional(),

    // Geo Limits
    geoLimit: z.object({
        enabled: z.boolean(),
        countries: z.array(z.string()).optional(),
        states: z.array(z.string()).optional(),
        cities: z.array(z.string()).optional(),
    }).optional(),

    // Media
    images: z.array(z.string()).optional(),
    featuredImage: z.string().optional(),
    videos: z.array(z.object({
        type: z.enum(['youtube', 'vimeo', 'url']),
        url: z.string(),
        thumbnail: z.string().optional(),
        title: z.string().optional(),
    })).optional(),

    // Product Options & Variants (for variable products)
    productOptions: z.array(z.object({
        optionId: z.string(),
        values: z.array(z.string()),
        isVariation: z.boolean(),
    })).optional(),
    // Legacy attributes field for backward compatibility
    attributes: z.array(z.object({
        attributeId: z.string(),
        values: z.array(z.string()),
        isVariation: z.boolean(),
    })).optional(),
    // Product Specifications (for product details)
    specifications: z.array(z.object({
        attributeId: z.string(),
        value: z.any(),
    })).optional(),
    variants: z.array(z.object({
        sku: z.string(),
        attributes: z.record(z.string()),
        price: z.number(),
        salePrice: z.number().optional(),
        stock: z.number(),
        images: z.array(z.string()).optional(),
        weight: z.number().optional(),
        dimensions: z.object({
            length: z.number().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
        }).optional(),
    })).optional(),

    // Digital/Downloadable
    downloadFiles: z.array(z.object({
        name: z.string(),
        url: z.string(),
        fileSize: z.number(),
    })).optional(),
    downloadLimit: z.number().optional(),
    downloadExpiry: z.number().optional(),

    // SEO
    seo: z.object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaKeywords: z.array(z.string()).optional(),
        focusKeyword: z.string().optional(),
        ogTitle: z.string().optional(),
        ogDescription: z.string().optional(),
        ogImage: z.string().url().optional().or(z.literal('')),
    }).optional(),

    // Status
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    downloadable: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface ProductFormProps {
    initialData?: any;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

export default function ProductForm({ initialData, onSubmit, isSubmitting = false }: ProductFormProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [tagInput, setTagInput] = useState('');
    const [keywordInput, setKeywordInput] = useState('');

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
            type: 'simple',
            sku: '',
            description: '',
            shortDescription: '',
            brand: '',
            categoryIds: [],
            tags: [],
            price: 0,
            salePrice: undefined,
            salePriceStartDate: '',
            salePriceEndDate: '',
            costPrice: undefined,
            stock: 0,
            manageStock: true,
            stockStatus: 'in_stock',
            lowStockThreshold: undefined,
            weight: undefined,
            dimensions: {
                length: undefined,
                width: undefined,
                height: undefined,
                unit: 'cm',
            },
            geoLimit: {
                enabled: false,
                countries: [],
                states: [],
                cities: [],
            },
            images: [],
            featuredImage: '',
            videos: [],
            productOptions: [],
            attributes: [],
            specifications: [],
            variants: [],
            downloadFiles: [],
            downloadLimit: undefined,
            downloadExpiry: undefined,
            seo: {
                metaTitle: '',
                metaDescription: '',
                metaKeywords: [],
                focusKeyword: '',
                ogTitle: '',
                ogDescription: '',
                ogImage: '',
            },
            isActive: true,
            isFeatured: false,
            downloadable: false,
        },
    });

    const watchName = watch('name');
    const watchStoreId = watch('storeId');
    const watchTags = watch('tags') || [];
    const watchType = watch('type');


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

    // Auto-set downloadable for digital products
    useEffect(() => {
        if (watchType === 'digital') {
            setValue('downloadable', true);
        }
    }, [watchType, setValue]);

    // Initialize form with existing data
    useEffect(() => {
        if (initialData) {
            setValue('name', initialData.name || '');
            setValue('slug', initialData.slug || '');
            setValue('storeId', typeof initialData.storeId === 'object' ? initialData.storeId._id : initialData.storeId || '');
            setValue('type', initialData.type || 'simple');
            setValue('sku', initialData.sku || '');
            setValue('description', initialData.description || '');
            setValue('shortDescription', initialData.shortDescription || '');
            setValue('brand', initialData.brand || '');
            setValue('categoryIds', initialData.categoryIds?.map((c: any) => typeof c === 'object' ? c._id : c) || []);
            setValue('tags', initialData.tags || []);
            setValue('price', initialData.price || 0);
            setValue('salePrice', initialData.salePrice);
            // Convert dates to datetime-local format
            if (initialData.salePriceStartDate) {
                const startDate = new Date(initialData.salePriceStartDate);
                setValue('salePriceStartDate', startDate.toISOString().slice(0, 16));
            }
            if (initialData.salePriceEndDate) {
                const endDate = new Date(initialData.salePriceEndDate);
                setValue('salePriceEndDate', endDate.toISOString().slice(0, 16));
            }
            setValue('costPrice', initialData.costPrice);
            setValue('stock', initialData.stock || 0);
            setValue('manageStock', initialData.manageStock !== undefined ? initialData.manageStock : true);
            setValue('stockStatus', initialData.stockStatus || 'in_stock');
            setValue('lowStockThreshold', initialData.lowStockThreshold);
            setValue('weight', initialData.weight);
            setValue('dimensions', initialData.dimensions || { unit: 'cm' });
            setValue('geoLimit', initialData.geoLimit || { enabled: false, countries: [], states: [], cities: [] });
            setValue('images', initialData.images || []);
            setValue('featuredImage', initialData.featuredImage || '');
            setValue('videos', initialData.videos || []);
            setValue('productOptions', initialData.productOptions?.map((opt: any) => ({
                ...opt,
                optionId: typeof opt.optionId === 'object' ? opt.optionId._id : opt.optionId,
                // Flatten values if they are objects (from new API structure)
                values: Array.isArray(opt.values) && typeof opt.values[0] === 'object'
                    ? opt.values.map((v: any) => v.value)
                    : opt.values
            })) || []);
            setValue('attributes', initialData.attributes?.map((attr: any) => ({
                ...attr,
                attributeId: typeof attr.attributeId === 'object' ? attr.attributeId._id : attr.attributeId
            })) || []);
            setValue('specifications', initialData.specifications?.map((spec: any) => ({
                ...spec,
                attributeId: typeof spec.attributeId === 'object' ? spec.attributeId._id : spec.attributeId
            })) || []);
            setValue('variants', initialData.variants || []);
            setValue('downloadFiles', initialData.downloadFiles || []);
            setValue('downloadLimit', initialData.downloadLimit);
            setValue('downloadExpiry', initialData.downloadExpiry);
            setValue('seo', {
                metaTitle: initialData.seo?.metaTitle || '',
                metaDescription: initialData.seo?.metaDescription || '',
                metaKeywords: initialData.seo?.metaKeywords || [],
                focusKeyword: initialData.seo?.focusKeyword || '',
                ogTitle: initialData.seo?.ogTitle || '',
                ogDescription: initialData.seo?.ogDescription || '',
                ogImage: initialData.seo?.ogImage || '',
            });
            setValue('isActive', initialData.isActive !== undefined ? initialData.isActive : true);
            setValue('isFeatured', initialData.isFeatured || false);
            setValue('downloadable', initialData.downloadable || false);
        }
    }, [initialData, setValue]);

    const handleFormSubmit = (data: FormData) => {
        // Clean up empty optional fields
        const cleanedData = {
            ...data,
            shortDescription: data.shortDescription || undefined,
            brand: data.brand || undefined,
            salePrice: data.salePrice || undefined,
            salePriceStartDate: data.salePriceStartDate || undefined,
            salePriceEndDate: data.salePriceEndDate || undefined,
            costPrice: data.costPrice || undefined,
            lowStockThreshold: data.lowStockThreshold || undefined,
            featuredImage: data.featuredImage || undefined,
            seo: {
                ...data.seo,
                ogImage: data.seo?.ogImage || undefined,
            },
            downloadable: data.type === 'digital',
        };
        onSubmit(cleanedData);
    };

    const handleAddTag = () => {
        if (tagInput.trim()) {
            setValue('tags', [...watchTags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleDeleteTag = (tagToDelete: string) => {
        setValue('tags', watchTags.filter(tag => tag !== tagToDelete));
    };

    return (
        <Box component="form" id="product-form" onSubmit={handleSubmit(handleFormSubmit, (errors) => console.error('Form Errors:', errors))}>
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto">
                    <Tab label="Basic Info" />
                    <Tab label="Pricing & Inventory" />
                    <Tab label="Media" />
                    <Tab label="Variants & Downloads" />
                    <Tab label="Specifications" />
                    <Tab label="SEO & Settings" />
                    <Tab label="Other" />
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
                                        label="Product Name"
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

                        <Grid size={{ xs: 12, md: 3 }}>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth required error={!!errors.type}>
                                        <InputLabel>Product Type</InputLabel>
                                        <Select {...field} label="Product Type">
                                            <MenuItem value="simple">Simple Product</MenuItem>
                                            <MenuItem value="variable">Variable Product</MenuItem>
                                            <MenuItem value="digital">Digital Product</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                            <Controller
                                name="sku"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="SKU"
                                        fullWidth
                                        required
                                        error={!!errors.sku}
                                        helperText={errors.sku?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <RichTextEditor
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        label="Description"
                                        variant="standard"
                                        error={!!errors.description}
                                        helperText={errors.description?.message}
                                        minHeight={200}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="shortDescription"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Short Description"
                                        fullWidth
                                        multiline
                                        rows={3}
                                        error={!!errors.shortDescription}
                                        helperText={errors.shortDescription?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="brand"
                                control={control}
                                render={({ field }) => (
                                    <BrandAutocomplete
                                        value={field.value || null}
                                        onChange={(value) => field.onChange(value || '')}
                                        storeId={watchStoreId}
                                        label="Brand"
                                        error={!!errors.brand}
                                        helperText={errors.brand?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="categoryIds"
                                control={control}
                                render={({ field }) => {
                                    const [tempCategory, setTempCategory] = useState<string | null>(null);
                                    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
                                    const selectedCategories = field.value || [];

                                    // Fetch category names when categories are loaded
                                    useEffect(() => {
                                        const fetchCategoryNames = async () => {
                                            if (selectedCategories.length > 0 && watchStoreId) {
                                                try {
                                                    const response = await api.get('/categories', {
                                                        params: { storeId: watchStoreId }
                                                    });
                                                    const categories = response.data.categories || [];
                                                    const map: Record<string, string> = {};
                                                    categories.forEach((cat: any) => {
                                                        map[cat._id] = cat.title;
                                                    });
                                                    setCategoryMap(map);
                                                } catch (err) {
                                                    console.error('Failed to fetch category names');
                                                }
                                            }
                                        };
                                        fetchCategoryNames();
                                    }, [selectedCategories.length, watchStoreId]);

                                    const handleAddCategory = (categoryId: string | null) => {
                                        if (categoryId && !selectedCategories.includes(categoryId)) {
                                            field.onChange([...selectedCategories, categoryId]);
                                            setTempCategory(null);
                                        }
                                    };

                                    const handleRemoveCategory = (categoryId: string) => {
                                        field.onChange(selectedCategories.filter((id: string) => id !== categoryId));
                                    };

                                    return (
                                        <Box>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <CategoryAutocomplete
                                                        value={tempCategory}
                                                        onChange={setTempCategory}
                                                        storeId={watchStoreId}
                                                        label="Categories"
                                                        error={!!errors.categoryIds}
                                                        helperText={errors.categoryIds?.message || 'Select categories for this product'}
                                                    />
                                                </Box>
                                                <IconButton
                                                    onClick={() => handleAddCategory(tempCategory)}
                                                    color="primary"
                                                    disabled={!tempCategory}
                                                    sx={{ mt: 1 }}
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                            </Box>
                                            {selectedCategories.length > 0 && (
                                                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {selectedCategories.map((catId: string) => (
                                                        <Chip
                                                            key={catId}
                                                            label={categoryMap[catId] || catId}
                                                            onDelete={() => handleRemoveCategory(catId)}
                                                            deleteIcon={<CloseIcon />}
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Tags
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <TextField
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                        placeholder="Add a tag"
                                        size="small"
                                        fullWidth
                                    />
                                    <IconButton onClick={handleAddTag} color="primary">
                                        <AddIcon />
                                    </IconButton>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {watchTags.map((tag, index) => (
                                        <Chip
                                            key={index}
                                            label={tag}
                                            onDelete={() => handleDeleteTag(tag)}
                                            deleteIcon={<CloseIcon />}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Pricing & Inventory Tab */}
            {activeTab === 1 && (
                <Paper sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="price"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Regular Price"
                                        type="number"
                                        fullWidth
                                        required
                                        error={!!errors.price}
                                        helperText={errors.price?.message}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="salePrice"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Sale Price"
                                        type="number"
                                        fullWidth
                                        error={!!errors.salePrice}
                                        helperText={errors.salePrice?.message}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="costPrice"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Cost Price"
                                        type="number"
                                        fullWidth
                                        error={!!errors.costPrice}
                                        helperText={errors.costPrice?.message}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="salePriceStartDate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Sale Start Date"
                                        type="datetime-local"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="salePriceEndDate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Sale End Date"
                                        type="datetime-local"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Inventory</Typography>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="stock"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Stock Quantity"
                                        type="number"
                                        fullWidth
                                        required
                                        error={!!errors.stock}
                                        helperText={errors.stock?.message}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="stockStatus"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth required>
                                        <InputLabel>Stock Status</InputLabel>
                                        <Select {...field} label="Stock Status">
                                            <MenuItem value="in_stock">In Stock</MenuItem>
                                            <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                                            <MenuItem value="on_backorder">On Backorder</MenuItem>
                                            <MenuItem value="made_to_order">Made to Order</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="lowStockThreshold"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Low Stock Threshold"
                                        type="number"
                                        fullWidth
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="manageStock"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={field.value} />}
                                        label="Manage Stock"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Shipping</Typography>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                            <Controller
                                name="weight"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value || ''}
                                        label="Weight (kg)"
                                        type="number"
                                        fullWidth
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <Controller
                                name="dimensions.length"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value || ''}
                                        label="Length"
                                        type="number"
                                        fullWidth
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <Controller
                                name="dimensions.width"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value || ''}
                                        label="Width"
                                        type="number"
                                        fullWidth
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <Controller
                                name="dimensions.height"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value || ''}
                                        label="Height"
                                        type="number"
                                        fullWidth
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                            <Controller
                                name="dimensions.unit"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>Unit</InputLabel>
                                        <Select {...field} label="Unit">
                                            <MenuItem value="cm">Centimeters (cm)</MenuItem>
                                            <MenuItem value="in">Inches (in)</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Media Tab */}
            {activeTab === 2 && (
                <Paper sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Product Images</Typography>
                            <Controller
                                name="images"
                                control={control}
                                render={({ field }) => (
                                    <Box>
                                        <FileManagerButton
                                            label="Select Images"
                                            onSelect={(files) => field.onChange(files.map(f => f.url))}
                                            accept="image/*"
                                            multiple
                                            fullWidth
                                        />
                                        {field.value && field.value.length > 0 && (
                                            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {field.value.map((url, index) => (
                                                    <Box
                                                        key={index}
                                                        component="img"
                                                        src={url}
                                                        alt={`Product ${index + 1}`}
                                                        sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1 }}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Featured Image</Typography>
                            <Controller
                                name="featuredImage"
                                control={control}
                                render={({ field }) => (
                                    <Box>
                                        <FileManagerButton
                                            label="Select Featured Image"
                                            onSelect={(files) => field.onChange(files[0]?.url || '')}
                                            accept="image/*"
                                            fullWidth
                                        />
                                        {field.value && (
                                            <Box
                                                component="img"
                                                src={field.value}
                                                alt="Featured"
                                                sx={{ mt: 2, maxWidth: 200, height: 'auto', borderRadius: 1 }}
                                            />
                                        )}
                                    </Box>
                                )}
                            />
                        </Grid>

                        <VideosField control={control} />
                    </Grid>
                </Paper>
            )}

            {/* Variants & Downloads Tab */}
            {activeTab === 3 && (
                <Paper sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        {/* Downloadable Product Section */}
                        {watchType === 'digital' && (
                            <>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>Download Files</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Configure downloadable files for digital products
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="downloadLimit"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                value={field.value ?? ''}
                                                label="Download Limit"
                                                type="number"
                                                fullWidth
                                                helperText="Number of times customer can download (leave empty for unlimited)"
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="downloadExpiry"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                value={field.value ?? ''}
                                                label="Download Expiry (days)"
                                                type="number"
                                                fullWidth
                                                helperText="Number of days download link is valid (leave empty for no expiry)"
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                        )}
                                    />
                                </Grid>

                                <DownloadFilesField control={control} />
                            </>
                        )}

                        {/* Variable Product Section */}
                        {watchType === 'variable' && (
                            <>
                                <ProductOptionManager control={control} watchStoreId={watchStoreId} />
                                <VariantManager control={control} watch={watch} />
                            </>
                        )}

                        {/* Simple Product Message */}
                        {watchType === 'simple' && (
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                                    This tab is for Variable Products and Downloadable Products.
                                    <br />
                                    Simple products don't require variant or download configuration.
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            )}

            {/* Specifications Tab */}
            {activeTab === 4 && (
                <Paper sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        <SpecificationManager control={control} watchStoreId={watchStoreId} />
                    </Grid>
                </Paper>
            )}

            {/* SEO & Settings Tab */}
            {activeTab === 5 && (
                <Paper sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>SEO Settings</Typography>
                        </Grid>



                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="seo.metaTitle"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Meta Title"
                                        fullWidth
                                        helperText="Recommended: 50-60 characters"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="seo.metaDescription"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Meta Description"
                                        fullWidth
                                        multiline
                                        rows={3}
                                        helperText="Recommended: 150-160 characters"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="seo.metaKeywords"
                                control={control}
                                render={({ field }) => {
                                    const keywords = field.value || [];

                                    return (
                                        <Box>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                                <TextField
                                                    value={keywordInput}
                                                    onChange={(e) => setKeywordInput(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (keywordInput.trim()) {
                                                                field.onChange([...keywords, keywordInput.trim()]);
                                                                setKeywordInput('');
                                                            }
                                                        }
                                                    }}
                                                    label="Meta Keywords"
                                                    placeholder="Add keyword and press Enter"
                                                    size="small"
                                                    fullWidth
                                                />
                                                <IconButton
                                                    onClick={() => {
                                                        if (keywordInput.trim()) {
                                                            field.onChange([...keywords, keywordInput.trim()]);
                                                            setKeywordInput('');
                                                        }
                                                    }}
                                                    color="primary"
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {keywords.map((keyword: string, index: number) => (
                                                    <Chip
                                                        key={index}
                                                        label={keyword}
                                                        onDelete={() => field.onChange(keywords.filter((_: string, i: number) => i !== index))}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    );
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="seo.focusKeyword"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Focus Keyword"
                                        fullWidth
                                        helperText="Primary keyword for SEO"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="seo.ogTitle"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="OG Title"
                                        fullWidth
                                        helperText="Open Graph title for social sharing"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="seo.ogDescription"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="OG Description"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        helperText="Open Graph description for social sharing"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="seo.ogImage"
                                control={control}
                                render={({ field }) => (
                                    <Box>
                                        <FileManagerButton
                                            label="Select OG Image"
                                            onSelect={(files) => field.onChange(files[0]?.url || '')}
                                            accept="image/*"
                                            fullWidth
                                        />
                                        {field.value && (
                                            <TextField
                                                value={field.value}
                                                label="OG Image URL"
                                                fullWidth
                                                margin="normal"
                                                onChange={(e) => field.onChange(e.target.value)}
                                            />
                                        )}
                                    </Box>
                                )}
                            />
                        </Grid>



                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Settings</Typography>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={field.value} />}
                                        label="Active"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="isFeatured"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={field.value} />}
                                        label="Featured"
                                    />
                                )}
                            />
                        </Grid>

                    </Grid>
                </Paper>
            )}

            {/* Other Tab */}
            {activeTab === 6 && (
                <Paper sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        <GeoLimitsField control={control} watch={watch} />
                    </Grid>
                </Paper>
            )}
        </Box>
    );
}
