import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Divider, Tabs, Tab, Grid, Switch, FormControlLabel } from '@mui/material';
import { ColorPicker } from '@/components/atoms';

interface CTAConfigPanelProps {
    config: {
        text?: string;
        link?: string;
        variant?: 'contained' | 'outlined' | 'text' | 'ghost' | 'glass' | 'glow' | '3d' | 'underline';
        color?: 'primary' | 'secondary' | 'custom';
        alignment?: 'left' | 'center' | 'right';
        alignmentTablet?: 'left' | 'center' | 'right';
        alignmentMobile?: 'left' | 'center' | 'right';
        size?: 'small' | 'medium' | 'large';
        backgroundColor?: string;
        borderColor?: string;
        textColor?: string;
        showArrow?: boolean;
    };
    onChange: (config: any) => void;
}

export const CTAConfigPanel: React.FC<CTAConfigPanelProps> = ({ config, onChange }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...config, [field]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Button Text"
                value={config.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                fullWidth
            />
            <TextField
                label="Link URL"
                value={config.link || ''}
                onChange={(e) => handleChange('link', e.target.value)}
                fullWidth
            />

            <Divider />
            <Typography variant="subtitle2">Appearance</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth>
                    <InputLabel>Variant</InputLabel>
                    <Select
                        value={config.variant || 'contained'}
                        label="Variant"
                        onChange={(e) => handleChange('variant', e.target.value)}
                    >
                        <MenuItem value="contained">Contained</MenuItem>
                        <MenuItem value="outlined">Outlined</MenuItem>
                        <MenuItem value="ghost">Ghost</MenuItem>
                        <MenuItem value="glass">Glassmorphism</MenuItem>
                        <MenuItem value="glow">Glow</MenuItem>
                        <MenuItem value="3d">3D Perspective</MenuItem>
                        <MenuItem value="underline">Animated Underline</MenuItem>
                        <MenuItem value="text">Plain Text</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel>Color Preset</InputLabel>
                    <Select
                        value={config.color || 'primary'}
                        label="Color Preset"
                        onChange={(e) => handleChange('color', e.target.value)}
                    >
                        <MenuItem value="primary">Primary</MenuItem>
                        <MenuItem value="secondary">Secondary</MenuItem>
                        <MenuItem value="custom">Custom (Specify Below)</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <ColorPicker
                    label="Button Color"
                    value={config.backgroundColor || '#000000'}
                    onChange={(color) => handleChange('backgroundColor', color)}
                    helperText="BG / Glow Color"
                />
                <ColorPicker
                    label="Border Color"
                    value={config.borderColor || 'transparent'}
                    onChange={(color) => handleChange('borderColor', color)}
                    helperText="Outline Color"
                />
                <ColorPicker
                    label="Text Color"
                    value={config.textColor || '#ffffff'}
                    onChange={(color) => handleChange('textColor', color)}
                    helperText="Label Color"
                />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth>
                    <InputLabel>Size</InputLabel>
                    <Select
                        value={config.size || 'medium'}
                        label="Size"
                        onChange={(e) => handleChange('size', e.target.value)}
                    >
                        <MenuItem value="small">Small</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="large">Large</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <FormControl fullWidth size="small">
                    <InputLabel>Align (Desktop)</InputLabel>
                    <Select
                        value={config.alignment || 'center'}
                        label="Align (Desktop)"
                        onChange={(e) => handleChange('alignment', e.target.value)}
                    >
                        <MenuItem value="left">Left</MenuItem>
                        <MenuItem value="center">Center</MenuItem>
                        <MenuItem value="right">Right</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>Align (Tablet)</InputLabel>
                    <Select
                        value={config.alignmentTablet || config.alignment || 'center'}
                        label="Align (Tablet)"
                        onChange={(e) => handleChange('alignmentTablet', e.target.value)}
                    >
                        <MenuItem value="left">Left</MenuItem>
                        <MenuItem value="center">Center</MenuItem>
                        <MenuItem value="right">Right</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>Align (Mobile)</InputLabel>
                    <Select
                        value={config.alignmentMobile || config.alignment || 'center'}
                        label="Align (Mobile)"
                        onChange={(e) => handleChange('alignmentMobile', e.target.value)}
                    >
                        <MenuItem value="left">Left</MenuItem>
                        <MenuItem value="center">Center</MenuItem>
                        <MenuItem value="right">Right</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Box>
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.showArrow ?? false}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('showArrow', e.target.checked)}
                        />
                    }
                    label="Show Animated Arrow (→)"
                />
                <Typography variant="caption" display="block" color="textSecondary" sx={{ ml: 4 }}>
                    Adds a directional arrow that slides on hover.
                </Typography>
            </Box>
        </Box>
    );
};
