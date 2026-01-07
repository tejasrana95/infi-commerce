'use client';

import React from 'react';
import {
    Box,
    TextField,
    Typography,
    Divider,
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
import IconPicker from '@/components/atoms/IconPicker';

export interface MarqueeItem {
    icon: string;
    text: string;
}

export interface MarqueeConfig {
    items: MarqueeItem[];
    speed?: number;
    direction?: 'left' | 'right';
    pauseOnHover?: boolean;
    typography?: {
        textFontSize?: number;
        textFontWeight?: string;
        textColor?: string;
    };
    iconSize?: number;
    iconColor?: string;
}

export const defaultMarqueeConfig: MarqueeConfig = {
    items: [
        { icon: 'FaShippingFast', text: 'Free Shipping' },
        { icon: 'FaLock', text: 'Secure Payment' },
        { icon: 'FaUndo', text: 'Easy Returns' },
    ],
    speed: 30,
    direction: 'left',
    pauseOnHover: true,
    typography: {
        textFontSize: 16,
        textFontWeight: '500',
        textColor: '#000000',
    },
    iconSize: 24,
    iconColor: '#1976d2',
};

interface MarqueeConfigPanelProps {
    config: MarqueeConfig;
    onChange: (config: MarqueeConfig) => void;
}

export default function MarqueeConfigPanel({ config, onChange }: MarqueeConfigPanelProps) {
    const items = config.items || defaultMarqueeConfig.items;
    const typography = config.typography || defaultMarqueeConfig.typography;

    const handleAddItem = () => {
        onChange({
            ...config,
            items: [
                ...items,
                {
                    icon: 'FaStar',
                    text: 'New Feature',
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

    const handleItemChange = (index: number, key: keyof MarqueeItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [key]: value };
        onChange({ ...config, items: newItems });
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
                        Marquee Items ({items.length})
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
                            <Typography variant="body2" fontWeight={600}>
                                {item.text || 'Untitled'}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <IconPicker
                                    label="Select Icon"
                                    value={item.icon || ''}
                                    onChange={(newIcon) => handleItemChange(index, 'icon', newIcon)}
                                    fullWidth
                                />

                                <TextField
                                    label="Text"
                                    value={item.text || ''}
                                    onChange={(e) => handleItemChange(index, 'text', e.target.value)}
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

            {/* Marquee Settings */}
            <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Marquee Settings
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Speed (seconds)"
                        type="number"
                        value={config.speed || 30}
                        onChange={(e) => onChange({ ...config, speed: parseInt(e.target.value) || 30 })}
                        fullWidth
                        size="small"
                        helperText="Time to complete one full scroll"
                    />

                    <FormControl fullWidth size="small">
                        <InputLabel>Direction</InputLabel>
                        <Select
                            value={config.direction || 'left'}
                            onChange={(e) => onChange({ ...config, direction: e.target.value as any })}
                            label="Direction"
                        >
                            <MenuItem value="left">Left</MenuItem>
                            <MenuItem value="right">Right</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>Pause on Hover</InputLabel>
                        <Select
                            value={config.pauseOnHover ? 'yes' : 'no'}
                            onChange={(e) => onChange({ ...config, pauseOnHover: e.target.value === 'yes' })}
                            label="Pause on Hover"
                        >
                            <MenuItem value="yes">Yes</MenuItem>
                            <MenuItem value="no">No</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <Divider />

            {/* Icon Settings */}
            <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Icon Style
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Icon Size (px)"
                        type="number"
                        value={config.iconSize || 24}
                        onChange={(e) => onChange({ ...config, iconSize: parseInt(e.target.value) || 24 })}
                        fullWidth
                        size="small"
                    />

                    <Box>
                        <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            Icon Color
                        </Typography>
                        <input
                            type="color"
                            value={config.iconColor || '#1976d2'}
                            onChange={(e) => onChange({ ...config, iconColor: e.target.value })}
                            style={{ width: '100%', height: 32, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                        />
                    </Box>
                </Box>
            </Box>

            <Divider />

            {/* Typography Settings */}
            <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Text Style
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Font Size (px)"
                            type="number"
                            value={typography?.textFontSize || 16}
                            onChange={(e) => handleTypographyChange('textFontSize', parseInt(e.target.value))}
                            size="small"
                        />
                        <FormControl size="small">
                            <InputLabel>Font Weight</InputLabel>
                            <Select
                                value={typography?.textFontWeight || '500'}
                                onChange={(e) => handleTypographyChange('textFontWeight', e.target.value)}
                                label="Font Weight"
                            >
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="500">Medium</MenuItem>
                                <MenuItem value="600">Semi Bold</MenuItem>
                                <MenuItem value="bold">Bold</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box>
                        <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            Text Color
                        </Typography>
                        <input
                            type="color"
                            value={typography?.textColor || '#000000'}
                            onChange={(e) => handleTypographyChange('textColor', e.target.value)}
                            style={{ width: '100%', height: 32, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
