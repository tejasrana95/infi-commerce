'use client';

import { useState, useEffect, useCallback } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Avatar, Paper, IconButton, Chip } from '@mui/material';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

export interface ProductOption {
    _id: string;
    name: string;
    slug: string;
    sku: string;
    price: number;
    salePrice?: number;
    images?: string[];
    stock?: number;
    weight?: number;
    type?: 'simple' | 'variable' | 'digital';
    variants?: Array<{
        _id: string;
        sku: string;
        price?: number;
        salePrice?: number;
        attributes?: Record<string, string>;
        stock?: number;
        weight?: number;
    }>;
}

interface ProductAutoCompleteProps {
    storeId: string;
    value?: ProductOption | ProductOption[] | null;
    onChange: (value: any) => void;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    size?: 'small' | 'medium';
    excludeIds?: string[];
    currency?: string; // Optional: currency code for price display
    multiple?: boolean;
}

interface SortableSelectedProductProps {
    id: string;
    index: number;
    product: ProductOption;
    onRemove: () => void;
    formatConvertedPrice: (amount: number) => string;
}

function SortableSelectedProduct({
    id,
    index,
    product,
    onRemove,
    formatConvertedPrice,
}: SortableSelectedProductProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    return (
        <Paper
            ref={setNodeRef}
            variant="outlined"
            sx={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.65 : 1,
                mb: 1,
                px: 1,
                py: 0.75,
                borderRadius: 1.5,
                borderColor: isDragging ? 'primary.main' : 'divider',
                backgroundColor: isDragging ? 'action.selected' : 'background.paper',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                    size="small"
                    sx={{ cursor: 'grab', color: 'text.secondary' }}
                    {...attributes}
                    {...listeners}
                >
                    <DragIndicatorIcon fontSize="small" />
                </IconButton>

                <Typography variant="caption" color="text.secondary" sx={{ width: 22, flexShrink: 0 }}>
                    {index + 1}.
                </Typography>

                <Avatar
                    src={product.images?.[0]}
                    variant="rounded"
                    sx={{ width: 28, height: 28 }}
                >
                    {product.name?.charAt(0) || 'P'}
                </Avatar>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" noWrap title={product.name}>
                        {product.name || 'Unnamed Product'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        SKU: {product.sku || 'N/A'} | {formatConvertedPrice(product.salePrice || product.price || 0)}
                    </Typography>
                </Box>

                <IconButton size="small" onClick={onRemove} sx={{ color: 'text.secondary' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
        </Paper>
    );
}

export default function ProductAutoComplete({
    storeId,
    value,
    onChange,
    label = 'Search Product',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder = 'Type to search products...',
    size = 'medium',
    excludeIds = [],
    currency,
    multiple = false,
}: ProductAutoCompleteProps) {
    const [options, setOptions] = useState<ProductOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 6,
            },
        })
    );

    const { formatPrice, convertPrice, baseCurrency } = useCurrency();

    // Format and convert price based on selected currency
    const formatConvertedPrice = (amount: number) => {
        if (!currency || currency === baseCurrency?.code) {
            return formatPrice(amount);
        }
        const converted = convertPrice(amount, currency);
        return formatPrice(converted, currency);
    };

    const searchProducts = useCallback(async (query: string) => {
        if (!storeId || query.length < 2) {
            setOptions([]);
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/products', {
                params: { search: query, storeId, limit: 15 }
            });
            const products = response.data.products || response.data.data || [];

            // Filter out excluded products
            const filtered = products.filter((p: ProductOption) => !excludeIds.includes(p._id));
            setOptions(filtered);
        } catch (error) {
            console.error('Failed to search products:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [storeId, excludeIds]);

    // Fetch product by ID if value is just an ID or missing details
    useEffect(() => {
        if (!storeId || !value) return;

        // ── Single mode ──────────────────────────────────────────────
        if (!multiple) {
            const currentVal = value as ProductOption;
            if (currentVal._id && !currentVal.name) {
                const fetchProduct = async () => {
                    try {
                        setLoading(true);
                        const response = await api.get(`/products/${currentVal._id}`);
                        const product = response.data.product || response.data.data || response.data;
                        if (product && product._id && product.name) {
                            setOptions([product]);
                            onChange(product);
                        }
                    } catch (error) {
                        console.error('Failed to fetch initial product:', error);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchProduct();
            }
            return;
        }

        // ── Multiple mode — bulk hydration ───────────────────────────
        // When values are stub objects (have _id but no name), fetch full data
        const items = value as ProductOption[];
        if (!Array.isArray(items) || items.length === 0) return;

        const stubs = items.filter((p: any) => p && p._id && !p.name);
        if (stubs.length === 0) return; // All items already have full data

        const fetchMissingProducts = async () => {
            try {
                setLoading(true);
                const ids = stubs.map((p: any) => p._id).join(',');
                const response = await api.get(`/products`, {
                    params: { ids, sort: 'false', limit: stubs.length },
                });
                const fetched: ProductOption[] = response.data.products || response.data.data || [];

                if (fetched.length === 0) return;

                // Build a map for fast lookup
                const fetchedMap = new Map(fetched.map((p) => [p._id, p]));

                // Merge: preserve original order, replace stubs with full data
                const merged = items.map((item: any) => {
                    if (item._id && !item.name && fetchedMap.has(item._id)) {
                        return fetchedMap.get(item._id)!;
                    }
                    return item;
                });

                setOptions(fetched);
                onChange(merged);
            } catch (error) {
                console.error('Failed to fetch initial products (multiple):', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMissingProducts();
        // Depend on a stable key built from stub IDs so we re-run whenever
        // react-hook-form's reset() delivers stub objects (but not on every render)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        storeId,
        multiple,
        // derive a stable key from the stub IDs — only changes when stubs arrive
        // eslint-disable-next-line react-hooks/exhaustive-deps
        multiple
            ? Array.isArray(value)
                ? (value as any[]).filter((p: any) => p?._id && !p?.name).map((p: any) => p._id).join(',')
                : ''
            : '',
    ]);

    useEffect(() => {
        const timer = setTimeout(() => {
            // Don't search if it's the loading state, empty, or derived from a stub
            const trimmedInput = inputValue?.trim();
            if (!trimmedInput || trimmedInput.length < 2 || trimmedInput === 'Loading...' || trimmedInput.includes('undefined')) {
                return;
            }
            searchProducts(trimmedInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [inputValue]);

    const getSelectedProducts = (): ProductOption[] => {
        if (!multiple) return [];
        if (!value || !Array.isArray(value)) return [];

        return value
            .map((item: any) => {
                if (item && typeof item === 'object' && item._id) {
                    return item as ProductOption;
                }
                if (typeof item === 'string') {
                    return options.find((opt) => opt._id === item) || null;
                }
                return null;
            })
            .filter((p): p is ProductOption => !!p);
    };

    const handleSortEnd = (event: DragEndEvent) => {
        if (!multiple) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const selected = getSelectedProducts();
        const oldIndex = selected.findIndex((p) => p._id === String(active.id));
        const newIndex = selected.findIndex((p) => p._id === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;

        const reordered = arrayMove(selected, oldIndex, newIndex);
        onChange(reordered);
    };

    const handleRemoveSelected = (id: string) => {
        if (!multiple) return;
        const selected = getSelectedProducts().filter((p) => p._id !== id);
        onChange(selected);
    };

    const selectedProducts = getSelectedProducts();

    return (
        <Box>
            <Autocomplete
                multiple={multiple}
                disableCloseOnSelect={multiple}
                filterSelectedOptions={multiple}
                value={value}
                onChange={(_, newValue) => onChange(newValue)}
                inputValue={inputValue}
                onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
                options={options}
                loading={loading}
                disabled={disabled || !storeId}
                getOptionLabel={(option) => {
                    const opt = option as ProductOption;
                    if (!opt.name) return 'Loading...';
                    return `${opt.name} (${opt.sku || 'N/A'})`;
                }}
                isOptionEqualToValue={(option, val) => {
                    const optId = (option as ProductOption)._id;
                    const valId = typeof val === 'string' ? val : (val as any)?._id;
                    return optId === valId;
                }}
                filterOptions={(x) => x} // Disable client-side filtering, rely on server
                renderTags={(tagValue, getTagProps) =>
                    multiple
                        ? []
                        : tagValue.map((option, index) => {
                            const tagProps = getTagProps({ index });
                            const { key, ...chipProps } = tagProps;
                            return <Chip key={key} {...chipProps} label={(option as ProductOption).name || 'Loading...'} />;
                        })
                }
                renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    const opt = option as ProductOption;
                    return (
                        <Box component="li" key={key} {...otherProps}>
                            <Box display="flex" alignItems="center" gap={2} width="100%">
                                <Avatar
                                    src={opt.images?.[0]}
                                    variant="rounded"
                                    sx={{ width: 40, height: 40 }}
                                >
                                    {opt.name?.charAt(0) || 'P'}
                                </Avatar>
                                <Box flex={1} minWidth={0}>
                                    <Typography variant="body2" fontWeight={500} noWrap>
                                        {opt.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        SKU: {opt.sku} | {formatConvertedPrice(opt.salePrice || opt.price)}
                                        {opt.stock !== undefined && ` | Stock: ${opt.stock}`}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    );
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        error={error}
                        helperText={helperText || (!storeId ? 'Please select a store first' : '')}
                        required={required}
                        placeholder={placeholder}
                        size={size}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                )}
            />

            {multiple && selectedProducts.length > 0 && (
                <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, borderRadius: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Selected Products ({selectedProducts.length}) - drag handle to reorder
                    </Typography>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSortEnd}>
                        <SortableContext items={selectedProducts.map((p) => p._id)} strategy={verticalListSortingStrategy}>
                            {selectedProducts.map((product, index) => (
                                <SortableSelectedProduct
                                    key={product._id}
                                    id={product._id}
                                    index={index}
                                    product={product}
                                    onRemove={() => handleRemoveSelected(product._id)}
                                    formatConvertedPrice={formatConvertedPrice}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </Paper>
            )}
        </Box>
    );
}
