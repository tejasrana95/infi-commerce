'use client';

import React from 'react';
import {
    Box,
    TextField,
    Typography,
    Divider,
    Slider,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export interface ProgressBarItem {
    label: string;
    percentage: number;
    barColor: string;
}

export interface ProgressBarConfig {
    items: ProgressBarItem[];
    layout?: {
        direction?: 'row' | 'column';
        gap?: number;
    };
    typography?: {
        labelFontSize?: number;
        labelFontWeight?: string;
        labelColor?: string;
        percentageFontSize?: number;
        percentageColor?: string;
    };
    barHeight?: number;
}

export const defaultProgressBarConfig: ProgressBarConfig = {
    items: [
        {
            label: 'Progress Item',
            percentage: 80,
            barColor: '#2563eb',
        },
    ],
    layout: {
        direction: 'column',
        gap: 20,
    },
    typography: {
        labelFontSize: 16,
        labelFontWeight: '600',
        labelColor: '#000000',
        percentageFontSize: 14,
        percentageColor: '#666666',
    },
    barHeight: 8,
};

interface ProgressBarConfigPanelProps {
    config: ProgressBarConfig;
    onChange: (config: ProgressBarConfig) => void;
}

export default function ProgressBarConfigPanel({ config, onChange }: ProgressBarConfigPanelProps) {
    const items = config.items || defaultProgressBarConfig.items;
    const layout = config.layout || defaultProgressBarConfig.layout;
    const typography = config.typography || defaultProgressBarConfig.typography;

    const handleAddItem = () => {
        onChange({
            ...config,
            items: [
                ...items,
                {
                    label: 'New Progress',
                    percentage: 75,
                    barColor: '#2563eb',
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

    const handleItemChange = (index: number, key: keyof ProgressBarItem, value: any) => {
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
                        Progress Bars ({items.length})
                    </Typography>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddItem}
                        variant="outlined"
                    >
                        Add Bar
                    </Button>
                </Box>

                {items.map((item, index) => (
                    <Accordion key={index} defaultExpanded={index === 0}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" fontWeight={600}>
                                {item.label || 'Untitled'} - {item.percentage}%
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Label"
                                    value={item.label || ''}
                                    onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                        Percentage ({item.percentage}%)
                                    </Typography>
                                    <Slider
                                        value={item.percentage || 0}
                                        onChange={(_, val) => handleItemChange(index, 'percentage', val)}
                                        min={0}
                                        max={100}
                                        step={1}
                                        size="small"
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                                        Bar Color
                                    </Typography>
                                    <input
                                        type="color"
                                        value={item.barColor || '#2563eb'}
                                        onChange={(e) => handleItemChange(index, 'barColor', e.target.value)}
                                        style={{ width: '100%', height: 32, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                                    />
                                </Box>

                                {items.length > 1 && (
                                    <Button
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleRemoveItem(index)}
                                    >
                                        Remove Bar
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
                            value={layout?.direction || 'column'}
                            onChange={(e) => handleLayoutChange('direction', e.target.value)}
                            label="Direction"
                        >
                            <MenuItem value="row">Row (Horizontal)</MenuItem>
                            <MenuItem value="column">Column (Vertical)</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Gap Between Bars (px)"
                        type="number"
                        value={layout?.gap || 20}
                        onChange={(e) => handleLayoutChange('gap', parseInt(e.target.value) || 0)}
                        fullWidth
                        size="small"
                    />

                    <TextField
                        label="Bar Height (px)"
                        type="number"
                        value={config.barHeight || 8}
                        onChange={(e) => onChange({ ...config, barHeight: parseInt(e.target.value) || 8 })}
                        fullWidth
                        size="small"
                    />

                    <Typography variant="caption" color="text.secondary">
                        💡 Bars automatically stack on mobile devices
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
                    {/* Label Typography */}
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Label Style
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Font Size (px)"
                            type="number"
                            value={typography?.labelFontSize || 16}
                            onChange={(e) => handleTypographyChange('labelFontSize', parseInt(e.target.value))}
                            size="small"
                        />
                        <FormControl size="small">
                            <InputLabel>Font Weight</InputLabel>
                            <Select
                                value={typography?.labelFontWeight || '600'}
                                onChange={(e) => handleTypographyChange('labelFontWeight', e.target.value)}
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
                            Label Color
                        </Typography>
                        <input
                            type="color"
                            value={typography?.labelColor || '#000000'}
                            onChange={(e) => handleTypographyChange('labelColor', e.target.value)}
                            style={{ width: '100%', height: 32, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                        />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Percentage Typography */}
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Percentage Style
                    </Typography>
                    <TextField
                        label="Font Size (px)"
                        type="number"
                        value={typography?.percentageFontSize || 14}
                        onChange={(e) => handleTypographyChange('percentageFontSize', parseInt(e.target.value))}
                        size="small"
                        fullWidth
                    />
                    <Box>
                        <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            Percentage Color
                        </Typography>
                        <input
                            type="color"
                            value={typography?.percentageColor || '#666666'}
                            onChange={(e) => handleTypographyChange('percentageColor', e.target.value)}
                            style={{ width: '100%', height: 32, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
