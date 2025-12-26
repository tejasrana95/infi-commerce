import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Divider } from '@mui/material';

interface CTAConfigPanelProps {
    config: {
        text?: string;
        link?: string;
        variant?: 'contained' | 'outlined' | 'text';
        color?: 'primary' | 'secondary' | 'custom';
        alignment?: 'left' | 'center' | 'right';
        size?: 'small' | 'medium' | 'large';
        backgroundColor?: string;
        textColor?: string;
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
                        <MenuItem value="text">Text</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel>Color</InputLabel>
                    <Select
                        value={config.color || 'primary'}
                        label="Color"
                        onChange={(e) => handleChange('color', e.target.value)}
                    >
                        <MenuItem value="primary">Primary</MenuItem>
                        <MenuItem value="secondary">Secondary</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {config.color === 'custom' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField
                        label="Background Color"
                        type="color"
                        value={config.backgroundColor || '#000000'}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        fullWidth
                        sx={{ '& input': { height: 40 } }}
                    />
                    <TextField
                        label="Text Color"
                        type="color"
                        value={config.textColor || '#ffffff'}
                        onChange={(e) => handleChange('textColor', e.target.value)}
                        fullWidth
                        sx={{ '& input': { height: 40 } }}
                    />
                </Box>
            )}

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

                <FormControl fullWidth>
                    <InputLabel>Alignment</InputLabel>
                    <Select
                        value={config.alignment || 'center'}
                        label="Alignment"
                        onChange={(e) => handleChange('alignment', e.target.value)}
                    >
                        <MenuItem value="left">Left</MenuItem>
                        <MenuItem value="center">Center</MenuItem>
                        <MenuItem value="right">Right</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Box>
    );
};
