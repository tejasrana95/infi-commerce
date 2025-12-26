import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Divider } from '@mui/material';
import FileManagerButton from '@/components/molecules/FileManagerButton';

interface StripBannerConfigPanelProps {
    config: {
        content?: string;
        backgroundImage?: string;
        backgroundColor?: string;
        textColor?: string;
        ctaText?: string;
        ctaLink?: string;
        ctaPosition?: 'bottom' | 'left' | 'right';
        height?: number;
        overlayColor?: string;
        overlayOpacity?: number;
        ctaBackgroundColor?: string;
        ctaTextColor?: string;
    };
    onChange: (config: any) => void;
}

export const StripBannerConfigPanel: React.FC<StripBannerConfigPanelProps> = ({ config, onChange }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...config, [field]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Banner Text"
                value={config.content || ''}
                onChange={(e) => handleChange('content', e.target.value)}
                multiline
                rows={2}
                fullWidth
            />

            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Background Image
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1 }}>
                    {config.backgroundImage && (
                        <Box
                            component="img"
                            src={config.backgroundImage}
                            alt="Background Preview"
                            sx={{ height: 60, width: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                        />
                    )}
                    <FileManagerButton
                        onSelect={(files) => {
                            if (files.length > 0) handleChange('backgroundImage', files[0].url);
                        }}
                        label={config.backgroundImage ? "Change" : "Select"}
                        fullWidth={!config.backgroundImage}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    {config.backgroundImage && (
                        <TextField
                            value={config.backgroundImage}
                            onChange={(e) => handleChange('backgroundImage', e.target.value)}
                            size="small"
                            fullWidth
                            placeholder="Or enter URL"
                        />
                    )}
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    label="Background Color"
                    type="color"
                    value={config.backgroundColor || '#f5f5f5'}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    fullWidth
                    sx={{ '& input': { height: 40 } }}
                />
                <TextField
                    label="Text Color"
                    type="color"
                    value={config.textColor || '#000000'}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    fullWidth
                    sx={{ '& input': { height: 40 } }}
                />
            </Box>

            <Divider />
            <Typography variant="subtitle2">Overlay Settings</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                    label="Overlay Color"
                    type="color"
                    value={config.overlayColor || '#000000'}
                    onChange={(e) => handleChange('overlayColor', e.target.value)}
                    fullWidth
                    sx={{ '& input': { height: 40 } }}
                />
                <TextField
                    label="Opacity (0-1)"
                    type="number"
                    inputProps={{ min: 0, max: 1, step: 0.1 }}
                    value={config.overlayOpacity !== undefined ? config.overlayOpacity : 0.5}
                    onChange={(e) => handleChange('overlayOpacity', parseFloat(e.target.value))}
                    fullWidth
                />
            </Box>

            <Divider />
            <Typography variant="subtitle2">CTA Button</Typography>

            <TextField
                label="Button Text"
                value={config.ctaText || ''}
                onChange={(e) => handleChange('ctaText', e.target.value)}
                fullWidth
            />
            <TextField
                label="Button Link"
                value={config.ctaLink || ''}
                onChange={(e) => handleChange('ctaLink', e.target.value)}
                fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    label="CTA Background"
                    type="color"
                    value={config.ctaBackgroundColor || '#000000'}
                    onChange={(e) => handleChange('ctaBackgroundColor', e.target.value)}
                    fullWidth
                    sx={{ '& input': { height: 40 } }}
                />
                <TextField
                    label="CTA Text Color"
                    type="color"
                    value={config.ctaTextColor || '#ffffff'}
                    onChange={(e) => handleChange('ctaTextColor', e.target.value)}
                    fullWidth
                    sx={{ '& input': { height: 40 } }}
                />
            </Box>

            <FormControl fullWidth>
                <InputLabel>CTA Position</InputLabel>
                <Select
                    value={config.ctaPosition || 'right'}
                    label="CTA Position"
                    onChange={(e) => handleChange('ctaPosition', e.target.value)}
                >
                    <MenuItem value="left">Left (Before Content)</MenuItem>
                    <MenuItem value="right">Right (After Content)</MenuItem>
                    <MenuItem value="bottom">Bottom</MenuItem>
                </Select>
            </FormControl>

            <TextField
                label="Height (px)"
                type="number"
                value={config.height || 120}
                onChange={(e) => handleChange('height', parseInt(e.target.value))}
                fullWidth
            />
        </Box>
    );
};
