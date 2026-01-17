'use client';

import React from 'react';
import {
    Box,
    TextField,
    Typography,
    Divider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import { ColorPicker } from '@/components/atoms';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export interface NumberBoxItem {
    number: string;
    title: string;
    description: string;
    icon?: string;
}

export interface NumberBoxConfig {
    items: NumberBoxItem[];
    layout?: {
        direction?: 'row' | 'column';
        gap?: number;
        itemsPerRow?: number;
    };
    typography?: {
        numberFontSize?: number;
        numberFontWeight?: string;
        numberColor?: string;
        titleFontSize?: number;
        titleFontWeight?: string;
        titleColor?: string;
        descriptionFontSize?: number;
        descriptionColor?: string;
    };
    color?: 'primary' | 'secondary' | 'success' | 'custom';
    customColor?: string;
}

export const defaultNumberBoxConfig: NumberBoxConfig = {
    items: [
        {
            number: '01',
            title: 'New Feature',
            description: 'Describe your amazing feature here.',
        },
    ],
    layout: {
        direction: 'row',
        gap: 24,
        itemsPerRow: 3,
    },
    typography: {
        numberFontSize: 48,
        numberFontWeight: 'bold',
        titleFontSize: 20,
        titleFontWeight: '600',
        descriptionFontSize: 14,
    },
    color: 'primary',
};

interface NumberBoxConfigPanelProps {
    config: NumberBoxConfig;
    onChange: (config: NumberBoxConfig) => void;
}

export default function NumberBoxConfigPanel({ config, onChange }: NumberBoxConfigPanelProps) {
    const items = config.items || defaultNumberBoxConfig.items;
    const layout = config.layout || defaultNumberBoxConfig.layout;
    const typography = config.typography || defaultNumberBoxConfig.typography;

    const handleAddItem = () => {
        onChange({
            ...config,
            items: [
                ...items,
                {
                    number: `0${items.length + 1}`,
                    title: 'New Feature',
                    description: 'Describe your feature here.',
                },
            ],
        });
    };

    const handleRemoveItem = (index: number) => {
        onChange({
            ...config,
            items: items.filter((_, i) => i !== index),
        });
    };

    const handleItemChange = (index: number, key: keyof NumberBoxItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [key]: value };
        onChange({ ...config, items: newItems });
    };

    const handleLayoutChange = (key: string, value: any) => {
        onChange({
            ...config,
            layout: { ...layout, [key]: value },
        });
    };

    const handleTypographyChange = (key: string, value: any) => {
        onChange({
            ...config,
            typography: { ...typography, [key]: value },
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Items Section */}
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        Number Boxes ({items.length})
                    </Typography>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddItem}
                        variant="outlined"
                    >
                        Add Item
                    </Button>
                </Box>

                {items.map((item, index) => (
                    <Accordion key={index} defaultExpanded={index === 0}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                    {item.number} - {item.title || 'Untitled'}
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Number / Prefix"
                                    value={item.number || ''}
                                    onChange={(e) => handleItemChange(index, 'number', e.target.value)}
                                    placeholder="e.g. 01, Step 1"
                                    fullWidth
                                    size="small"
                                />

                                <TextField
                                    label="Title"
                                    value={item.title || ''}
                                    onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                <TextField
                                    label="Description"
                                    value={item.description || ''}
                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                    multiline
                                    rows={2}
                                    fullWidth
                                    size="small"
                                />

                                {items.length > 1 && (
                                    <Button
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleRemoveItem(index)}
                                    >
                                        Remove Item
                                    </Button>
                                )}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>

            <Divider />

            {/* Layout Settings */}
            <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Layout Settings
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Direction</InputLabel>
                        <Select
                            value={layout?.direction || 'row'}
                            onChange={(e) => handleLayoutChange('direction', e.target.value)}
                            label="Direction"
                        >
                            <MenuItem value="row">Row (Horizontal)</MenuItem>
                            <MenuItem value="column">Column (Vertical)</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Gap Between Items (px)"
                        type="number"
                        value={layout?.gap || 24}
                        onChange={(e) => handleLayoutChange('gap', parseInt(e.target.value) || 0)}
                        fullWidth
                        size="small"
                    />

                    {layout?.direction === 'row' && (
                        <FormControl fullWidth size="small">
                            <InputLabel>Items Per Row</InputLabel>
                            <Select
                                value={layout?.itemsPerRow || 3}
                                onChange={(e) => handleLayoutChange('itemsPerRow', e.target.value)}
                                label="Items Per Row"
                            >
                                <MenuItem value={1}>1</MenuItem>
                                <MenuItem value={2}>2</MenuItem>
                                <MenuItem value={3}>3</MenuItem>
                                <MenuItem value={4}>4</MenuItem>
                            </Select>
                        </FormControl>
                    )}

                    <Typography variant="caption" color="text.secondary">
                        💡 Items automatically stack on mobile devices
                    </Typography>
                </Box>
            </Box>

            <Divider />

            {/* Typography Settings */}
            <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Typography
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Number Typography */}
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Number Style
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Font Size (px)"
                            type="number"
                            value={typography?.numberFontSize || 48}
                            onChange={(e) => handleTypographyChange('numberFontSize', parseInt(e.target.value))}
                            size="small"
                        />
                        <FormControl size="small">
                            <InputLabel>Font Weight</InputLabel>
                            <Select
                                value={typography?.numberFontWeight || 'bold'}
                                onChange={(e) => handleTypographyChange('numberFontWeight', e.target.value)}
                                label="Font Weight"
                            >
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="600">Semi Bold</MenuItem>
                                <MenuItem value="bold">Bold</MenuItem>
                                <MenuItem value="900">Extra Bold</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <ColorPicker
                        label="Number Color"
                        value={typography?.numberColor || '#1976d2'}
                        onChange={(color) => handleTypographyChange('numberColor', color)}
                    />

                    <Divider sx={{ my: 1 }} />

                    {/* Title Typography */}
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Title Style
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Font Size (px)"
                            type="number"
                            value={typography?.titleFontSize || 20}
                            onChange={(e) => handleTypographyChange('titleFontSize', parseInt(e.target.value))}
                            size="small"
                        />
                        <FormControl size="small">
                            <InputLabel>Font Weight</InputLabel>
                            <Select
                                value={typography?.titleFontWeight || '600'}
                                onChange={(e) => handleTypographyChange('titleFontWeight', e.target.value)}
                                label="Font Weight"
                            >
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="600">Semi Bold</MenuItem>
                                <MenuItem value="bold">Bold</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <ColorPicker
                        label="Title Color"
                        value={typography?.titleColor || '#000000'}
                        onChange={(color) => handleTypographyChange('titleColor', color)}
                    />

                    <Divider sx={{ my: 1 }} />

                    {/* Description Typography */}
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Description Style
                    </Typography>
                    <TextField
                        label="Font Size (px)"
                        type="number"
                        value={typography?.descriptionFontSize || 14}
                        onChange={(e) => handleTypographyChange('descriptionFontSize', parseInt(e.target.value))}
                        size="small"
                        fullWidth
                    />
                    <ColorPicker
                        label="Description Color"
                        value={typography?.descriptionColor || '#666666'}
                        onChange={(color) => handleTypographyChange('descriptionColor', color)}
                    />
                </Box>
            </Box>
        </Box>
    );
}
