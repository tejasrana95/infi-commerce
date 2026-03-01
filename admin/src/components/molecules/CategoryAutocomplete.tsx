'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Chip, Box, Paper, IconButton, Typography } from '@mui/material';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import api from '@/lib/api';

export interface CategoryOption {
    label: string;
    value: string;
    _id: string;
    title: string;
    slug: string;
    path: string;
    level: number;
}

interface CategoryAutocompleteProps {
    value?: string | string[] | null;
    onChange: (value: any, category?: CategoryOption | CategoryOption[] | null) => void;
    storeId?: string;
    excludeId?: string; // Exclude specific category (e.g., current category when editing)
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    minimal?: boolean; // For compact filter display
    multiple?: boolean;
}

interface SortableTagChipProps {
    id: string;
    index: number;
    label: string;
    onRemove: () => void;
}

function SortableTagChip({ id, index, label, onRemove }: SortableTagChipProps) {
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
                <Typography
                    variant="body2"
                    sx={{
                        minWidth: 0,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={label}
                >
                    {index + 1}. {label}
                </Typography>
                <IconButton size="small" onClick={onRemove} sx={{ color: 'text.secondary' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
        </Paper>
    );
}

export default function CategoryAutocomplete({
    value,
    onChange,
    storeId,
    excludeId,
    label = 'Parent Category',
    error = false,
    helperText,
    disabled = false,
    required = false,
    placeholder,
    minimal = false,
    multiple = false,
}: CategoryAutocompleteProps) {
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [loading, setLoading] = useState(false);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 6,
            },
        })
    );

    useEffect(() => {
        if (storeId) {
            fetchCategories();
        } else {
            setCategories([]);
        }
    }, [storeId, excludeId]);

    const fetchCategories = async () => {
        if (!storeId) return;

        try {
            setLoading(true);
            const response = await api.get(`/categories?storeId=${storeId}`);
            const categoryData = response.data.categories || response.data.data || [];

            const formattedCategories: CategoryOption[] = categoryData
                .filter((cat: any) => cat._id !== excludeId) // Exclude current category
                .map((cat: any) => ({
                    label: cat.path ? `${cat.path}` : cat.title,
                    value: cat._id,
                    _id: cat._id,
                    title: cat.title,
                    slug: cat.slug || '',
                    path: cat.path || cat.title,
                    level: cat.level || 0,
                }))
                .sort((a: CategoryOption, b: CategoryOption) => a.path.localeCompare(b.path));

            setCategories(formattedCategories);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedValue = () => {
        if (!value) return multiple ? [] : null;
        if (multiple && Array.isArray(value)) {
            return value
                .map((id) => categories.find((c) => c.value === id))
                .filter((c): c is CategoryOption => !!c);
        }
        return categories.find(c => c.value === value) || null;
    };

    const handleTagReorder = (activeId: string, overId: string) => {
        if (!multiple) return;
        if (activeId === overId) return;
        const selectedOptions = getSelectedValue() as CategoryOption[];
        const oldIndex = selectedOptions.findIndex((item) => item.value === activeId);
        const newIndex = selectedOptions.findIndex((item) => item.value === overId);
        if (oldIndex < 0 || newIndex < 0) return;

        const reordered = arrayMove(selectedOptions, oldIndex, newIndex);
        const values = reordered.map((item) => item.value);
        onChange(values, reordered);
    };

    const handleTagRemove = (id: string) => {
        if (!multiple) return;
        const selectedOptions = getSelectedValue() as CategoryOption[];
        const reordered = selectedOptions.filter((item) => item.value !== id);
        const values = reordered.map((item) => item.value);
        onChange(values, reordered);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        if (!multiple) return;
        const { active, over } = event;
        if (!over) return;
        handleTagReorder(String(active.id), String(over.id));
    };

    const handleChange = (_: any, newValue: any) => {
        if (multiple) {
            const values = (newValue as CategoryOption[]).map(v => v.value);
            onChange(values, newValue);
        } else {
            const val = (newValue as CategoryOption);
            onChange(val?.value || null, val);
        }
    };

    const selectedOptions = getSelectedValue();

    return (
        <Box>
            <Autocomplete
                multiple={multiple}
                disableCloseOnSelect={multiple}
                filterSelectedOptions={multiple}
                value={selectedOptions}
                onChange={handleChange}
                options={categories}
                loading={loading}
                disabled={disabled || loading || !storeId}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.value === value?.value}
                renderTags={(tagValue, getTagProps) =>
                    multiple
                        ? []
                        : tagValue.map((option, index) => {
                            const tagProps = getTagProps({ index });
                            const { key, ...chipProps } = tagProps;
                            return <Chip key={key} {...chipProps} label={option.label} />;
                        })
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        error={error}
                        helperText={minimal ? undefined : (helperText || (!storeId ? 'Please select a store first' : ''))}
                        required={required}
                        placeholder={placeholder}
                        size={minimal ? 'small' : 'medium'}
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

            {multiple && Array.isArray(selectedOptions) && selectedOptions.length > 0 && (
                <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, borderRadius: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Selected Categories ({selectedOptions.length}) - drag handle to reorder
                    </Typography>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={selectedOptions.map((option) => option.value)} strategy={verticalListSortingStrategy}>
                            {selectedOptions.map((option, index) => (
                                <SortableTagChip
                                    key={option.value}
                                    id={option.value}
                                    index={index}
                                    label={option.label}
                                    onRemove={() => handleTagRemove(option.value)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </Paper>
            )}
        </Box>
    );
}
