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
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';

export interface FlipBoxItem {
    frontImage: string;
    frontTitle: string;
    frontSubtitle: string;
    backDescription: string;
    ctaText: string;
    ctaUrl: string;
}

export interface FlipBoxConfig {
    items: FlipBoxItem[];
    layout?: {
        direction?: 'row' | 'column';
        gap?: number;
        itemsPerRow?: number;
    };
    typography?: {
        frontTitleFontSize?: number;
        frontTitleFontWeight?: string;
        frontTitleColor?: string;
        frontSubtitleFontSize?: number;
        frontSubtitleColor?: string;
        backDescriptionFontSize?: number;
        backDescriptionColor?: string;
    };
    flipDirection?: 'horizontal' | 'vertical';
}

export const defaultFlipBoxConfig: FlipBoxConfig = {
    items: [
        {
            frontImage: '',
            frontTitle: 'Front Title',
            frontSubtitle: 'Front Subtitle',
            backDescription: 'This is the back side of the flip box. Add your content here.',
            ctaText: 'Learn More',
            ctaUrl: '#',
        },
    ],
    layout: {
        direction: 'row',
        gap: 24,
        itemsPerRow: 3,
    },
    typography: {
        frontTitleFontSize: 24,
        frontTitleFontWeight: 'bold',
        frontTitleColor: '#ffffff',
        frontSubtitleFontSize: 14,
        frontSubtitleColor: '#e0e0e0',
        backDescriptionFontSize: 14,
        backDescriptionColor: '#333333',
    },
    flipDirection: 'horizontal',
};

interface FlipBoxConfigPanelProps {
    config: FlipBoxConfig;
    onChange: (config: FlipBoxConfig) => void;
}

export default function FlipBoxConfigPanel({ config, onChange }: FlipBoxConfigPanelProps) {
    const items = config.items || defaultFlipBoxConfig.items;
    const layout = config.layout || defaultFlipBoxConfig.layout;
    const typography = config.typography || defaultFlipBoxConfig.typography;

    const handleAddItem = () => {
        onChange({
            ...config,
            items: [
                ...items,
                {
                    frontImage: '',
                    frontTitle: 'New Flip Box',
                    frontSubtitle: 'Subtitle',
                    backDescription: 'Add your description here.',
                    ctaText: 'Learn More',
                    ctaUrl: '#',
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

    const handleItemChange = (index: number, key: keyof FlipBoxItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [key]: value };
        onChange({ ...config, items: newItems });
    };

    const handleImageSelect = (index: number, files: FileItem[]) => {
        if (files.length > 0) {
            handleItemChange(index, 'frontImage', files[0].url);
        }
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
                        Flip Boxes ({items.length})
                    </Typography>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddItem}
                        variant="outlined"
                    >
                        Add Flip Box
                    </Button>
                </Box>

                {items.map((item, index) => (
                    <Accordion key={index} defaultExpanded={index === 0}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" fontWeight={600}>
                                {item.frontTitle || 'Untitled'}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                        Front Image
                                    </Typography>
                                    <FileManagerButton
                                        onSelect={(files) => handleImageSelect(index, files)}
                                        label={item.frontImage ? 'Change Image' : 'Select Image'}
                                        size="small"
                                        fullWidth
                                        accept="image/*"
                                    />
                                    {item.frontImage && (
                                        <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                                            Image selected ✓
                                        </Typography>
                                    )}
                                </Box>

                                <TextField
                                    label="Front Title"
                                    value={item.frontTitle || ''}
                                    onChange={(e) => handleItemChange(index, 'frontTitle', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                <TextField
                                    label="Front Subtitle"
                                    value={item.frontSubtitle || ''}
                                    onChange={(e) => handleItemChange(index, 'frontSubtitle', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                <TextField
                                    label="Back Description"
                                    value={item.backDescription || ''}
                                    onChange={(e) => handleItemChange(index, 'backDescription', e.target.value)}
                                    multiline
                                    rows={2}
                                    fullWidth
                                    size="small"
                                />

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        label="CTA Text"
                                        value={item.ctaText || ''}
                                        onChange={(e) => handleItemChange(index, 'ctaText', e.target.value)}
                                        fullWidth
                                        size="small"
                                    />
                                    <TextField
                                        label="CTA URL"
                                        value={item.ctaUrl || ''}
                                        onChange={(e) => handleItemChange(index, 'ctaUrl', e.target.value)}
                                        fullWidth
                                        size="small"
                                    />
                                </Box>

                                {items.length > 1 && (
                                    <Button
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleRemoveItem(index)}
                                    >
                                        Remove Flip Box
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

                    <FormControl fullWidth size="small">
                        <InputLabel>Flip Direction</InputLabel>
                        <Select
                            value={config.flipDirection || 'horizontal'}
                            onChange={(e) => onChange({ ...config, flipDirection: e.target.value as any })}
                            label="Flip Direction"
                        >
                            <MenuItem value="horizontal">Horizontal</MenuItem>
                            <MenuItem value="vertical">Vertical</MenuItem>
                        </Select>
                    </FormControl>

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
                    {/* Front Title Typography */}
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Front Title Style
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Font Size (px)"
                            type="number"
                            value={typography?.frontTitleFontSize || 24}
                            onChange={(e) => handleTypographyChange('frontTitleFontSize', parseInt(e.target.value))}
                            size="small"
                        />
                        <FormControl size="small">
                            <InputLabel>Font Weight</InputLabel>
                            <Select
                                value={typography?.frontTitleFontWeight || 'bold'}
                                onChange={(e) => handleTypographyChange('frontTitleFontWeight', e.target.value)}
                                label="Font Weight"
                            >
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="600">Semi Bold</MenuItem>
                                <MenuItem value="bold">Bold</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box>
                        <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            Front Title Color
                        </Typography>
                        <input
                            type="color"
                            value={typography?.frontTitleColor || '#ffffff'}
                            onChange={(e) => handleTypographyChange('frontTitleColor', e.target.value)}
                            style={{ width: '100%', height: 32, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                        />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Front Subtitle Typography */}
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Front Subtitle Style
                    </Typography>
                    <TextField
                        label="Font Size (px)"
                        type="number"
                        value={typography?.frontSubtitleFontSize || 14}
                        onChange={(e) => handleTypographyChange('frontSubtitleFontSize', parseInt(e.target.value))}
                        size="small"
                        fullWidth
                    />
                    <Box>
                        <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            Front Subtitle Color
                        </Typography>
                        <input
                            type="color"
                            value={typography?.frontSubtitleColor || '#e0e0e0'}
                            onChange={(e) => handleTypographyChange('frontSubtitleColor', e.target.value)}
                            style={{ width: '100%', height: 32, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                        />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Back Description Typography */}
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Back Description Style
                    </Typography>
                    <TextField
                        label="Font Size (px)"
                        type="number"
                        value={typography?.backDescriptionFontSize || 14}
                        onChange={(e) => handleTypographyChange('backDescriptionFontSize', parseInt(e.target.value))}
                        size="small"
                        fullWidth
                    />
                    <Box>
                        <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            Back Description Color
                        </Typography>
                        <input
                            type="color"
                            value={typography?.backDescriptionColor || '#333333'}
                            onChange={(e) => handleTypographyChange('backDescriptionColor', e.target.value)}
                            style={{ width: '100%', height: 32, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
