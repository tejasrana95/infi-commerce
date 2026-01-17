import React, { useState } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Divider, Switch, FormControlLabel, Tabs, Tab } from '@mui/material';
import { ColorPicker } from '@/components/atoms';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import RichTextEditor from '@/components/molecules/RichTextEditor';

interface StripBannerConfigPanelProps {
    config: {
        title?: string;
        description?: string;
        content?: string; // Legacy
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
        titleStyles?: {
            fontFamily?: string;
            fontSize?: number;
            fontWeight?: number;
            color?: string;
        };
        descriptionStyles?: {
            fontFamily?: string;
            fontSize?: number;
            fontWeight?: number;
            color?: string;
        };
    };
    onChange: (config: any) => void;
}

const COMMON_FONTS = [
    { label: 'Default', value: '' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Open Sans', value: '"Open Sans", sans-serif' },
    { label: 'Lato', value: 'Lato, sans-serif' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif' },
    { label: 'Playfair Display', value: '"Playfair Display", serif' },
    { label: 'Merriweather', value: 'Merriweather, serif' },
];

export const StripBannerConfigPanel: React.FC<StripBannerConfigPanelProps> = ({ config, onChange }) => {
    const [tab, setTab] = useState(0);

    const handleChange = (field: string, value: any) => {
        onChange({ ...config, [field]: value });
    };

    const handleStyleChange = (type: 'titleStyles' | 'descriptionStyles', field: string, value: any) => {
        onChange({
            ...config,
            [type]: {
                ...(config[type] || {}),
                [field]: value
            }
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                <Tab label="Content" />
                <Tab label="Typography" />
                <Tab label="Settings" />
            </Tabs>

            {tab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Title"
                        value={config.title || ''}
                        onChange={(e) => handleChange('title', e.target.value)}
                        fullWidth
                    />

                    <RichTextEditor
                        label="Description"
                        value={config.description || config.content || ''}
                        onChange={(value) => {
                            handleChange('description', value);
                            if (config.content) handleChange('content', '');
                        }}
                        variant="minimal"
                        minHeight={100}
                    />
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2">Call to Action</Typography>
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
                    <FormControl fullWidth>
                        <InputLabel>CTA Position</InputLabel>
                        <Select
                            value={config.ctaPosition || 'right'}
                            label="CTA Position"
                            onChange={(e) => handleChange('ctaPosition', e.target.value)}
                        >
                            <MenuItem value="left">Left</MenuItem>
                            <MenuItem value="right">Right</MenuItem>
                            <MenuItem value="bottom">Bottom</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            )}

            {tab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Typography variant="subtitle2">Title Typography</Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Font Family</InputLabel>
                        <Select
                            value={config.titleStyles?.fontFamily || ''}
                            label="Font Family"
                            onChange={(e) => handleStyleChange('titleStyles', 'fontFamily', e.target.value)}
                        >
                            {COMMON_FONTS.map(font => (
                                <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                    {font.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Size (px)"
                            type="number"
                            value={config.titleStyles?.fontSize || 24}
                            onChange={(e) => handleStyleChange('titleStyles', 'fontSize', parseInt(e.target.value) || 0)}
                            size="small"
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Weight</InputLabel>
                            <Select
                                value={config.titleStyles?.fontWeight || 700}
                                label="Weight"
                                onChange={(e) => handleStyleChange('titleStyles', 'fontWeight', Number(e.target.value))}
                            >
                                <MenuItem value={400}>Regular</MenuItem>
                                <MenuItem value={500}>Medium</MenuItem>
                                <MenuItem value={600}>Semi Bold</MenuItem>
                                <MenuItem value={700}>Bold</MenuItem>
                                <MenuItem value={800}>Extra Bold</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <ColorPicker
                        label="Text Color"
                        value={config.textColor || '#333333'}
                        onChange={(color) => handleChange('textColor', color)}
                    />

                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2">Description Typography</Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Font Family</InputLabel>
                        <Select
                            value={config.descriptionStyles?.fontFamily || ''}
                            label="Font Family"
                            onChange={(e) => handleStyleChange('descriptionStyles', 'fontFamily', e.target.value)}
                        >
                            {COMMON_FONTS.map(font => (
                                <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                    {font.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Size (px)"
                            type="number"
                            value={config.descriptionStyles?.fontSize || 16}
                            onChange={(e) => handleStyleChange('descriptionStyles', 'fontSize', parseInt(e.target.value) || 0)}
                            size="small"
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Weight</InputLabel>
                            <Select
                                value={config.descriptionStyles?.fontWeight || 400}
                                label="Weight"
                                onChange={(e) => handleStyleChange('descriptionStyles', 'fontWeight', Number(e.target.value))}
                            >
                                <MenuItem value={400}>Regular</MenuItem>
                                <MenuItem value={500}>Medium</MenuItem>
                                <MenuItem value={600}>Semi Bold</MenuItem>
                                <MenuItem value={700}>Bold</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <ColorPicker
                        label="Description Color"
                        value={config.descriptionStyles?.color || config.textColor || '#000000'}
                        onChange={(color) => handleStyleChange('descriptionStyles', 'color', color)}
                    />
                </Box>
            )}

            {tab === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Background Image
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            {config.backgroundImage && (
                                <Box
                                    component="img"
                                    src={config.backgroundImage}
                                    sx={{ height: 50, width: 80, objectFit: 'cover', borderRadius: 1 }}
                                />
                            )}
                            <FileManagerButton
                                onSelect={(files) => {
                                    if (files.length > 0) handleChange('backgroundImage', files[0].url);
                                }}
                                label={config.backgroundImage ? "Change" : "Select Image"}
                                fullWidth={!config.backgroundImage}
                            />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <ColorPicker
                            label="Background Color"
                            value={config.backgroundColor || '#f5f5f5'}
                            onChange={(color) => handleChange('backgroundColor', color)}
                        />
                        <TextField
                            label="Height (px)"
                            type="number"
                            value={config.height || 120}
                            onChange={(e) => handleChange('height', parseInt(e.target.value))}
                            fullWidth
                        />
                    </Box>

                    <Divider />
                    <Typography variant="subtitle2">Overlay</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <ColorPicker
                            label="Overlay Color"
                            value={config.overlayColor || '#000000'}
                            onChange={(color) => handleChange('overlayColor', color)}
                        />
                        <TextField
                            label="Opacity (0-1)"
                            type="number"
                            inputProps={{ min: 0, max: 1, step: 0.1 }}
                            value={config.overlayOpacity !== undefined ? config.overlayOpacity : 0.5}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                handleChange('overlayOpacity', isNaN(val) ? 0.5 : val);
                            }}
                            fullWidth
                        />
                    </Box>

                    <Divider />
                    <Typography variant="subtitle2">CTA Buttons</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <ColorPicker
                            label="CTA Background"
                            value={config.ctaBackgroundColor || '#000000'}
                            onChange={(color) => handleChange('ctaBackgroundColor', color)}
                        />
                        <ColorPicker
                            label="CTA Text Color"
                            value={config.ctaTextColor || '#ffffff'}
                            onChange={(color) => handleChange('ctaTextColor', color)}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};
