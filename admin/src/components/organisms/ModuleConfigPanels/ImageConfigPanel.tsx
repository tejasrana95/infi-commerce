'use client';

import {
    Box,
    TextField,
    MenuItem,
    FormControlLabel,
    Switch,
    Typography,
} from '@mui/material';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';

export interface ImageConfig {
    src: string;
    alt: string;
    link?: string;
    openInNewTab: boolean;
    width: 'auto' | 'full' | 'custom';
    customWidth?: number;
    height?: number;
    fullHeight?: boolean;
    objectFit: 'cover' | 'contain' | 'fill' | 'none';
    alignment: 'left' | 'center' | 'right';
    borderRadius: number;
    shadow: 'none' | 'small' | 'medium' | 'large';

    // Text Overlay
    overlayTitle?: string;
    overlaySubtitle?: string;
    titleColor?: string;
    subtitleColor?: string;
    textPosition?: 'top' | 'center' | 'bottom';

    // CTA Button
    ctaText?: string;
    ctaLink?: string;
    ctaNewTab?: boolean;
    ctaStyle?: 'solid' | 'outline' | 'text';

    // Overlay Settings
    overlayEnabled?: boolean;
    overlayColor?: string;
    overlayOpacity?: number; // 0-100
    hoverEffect?: boolean;
    hoverOpacity?: number; // 0-100
}

interface ImageConfigPanelProps {
    config: ImageConfig;
    onChange: (config: ImageConfig) => void;
}

export const defaultImageConfig: ImageConfig = {
    src: '',
    alt: '',
    link: '',
    openInNewTab: false,
    width: 'full',
    customWidth: undefined,
    height: undefined,
    fullHeight: false,
    objectFit: 'cover',
    alignment: 'center',
    borderRadius: 0,
    shadow: 'none',

    // Text Overlay defaults
    overlayTitle: '',
    overlaySubtitle: '',
    titleColor: '#ffffff',
    subtitleColor: '#ffffff',
    textPosition: 'center',

    // CTA Button defaults
    ctaText: '',
    ctaLink: '',
    ctaNewTab: false,
    ctaStyle: 'solid',

    // Overlay Settings defaults
    overlayEnabled: false,
    overlayColor: '#000000',
    overlayOpacity: 50,
    hoverEffect: false,
    hoverOpacity: 70,
};

export default function ImageConfigPanel({ config, onChange }: ImageConfigPanelProps) {
    const handleChange = (key: keyof ImageConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const handleImageSelect = (files: FileItem[]) => {
        if (files.length > 0) {
            handleChange('src', files[0].url);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
                Image Settings
            </Typography>

            <Box>
                <FileManagerButton
                    onSelect={handleImageSelect}
                    accept="image/*"
                    label="Choose Image"
                    fullWidth
                />
                {config.src && (
                    <Box mt={1}>
                        <img
                            src={config.src}
                            alt={config.alt}
                            style={{
                                width: '100%',
                                height: 120,
                                objectFit: 'cover',
                                borderRadius: 4,
                            }}
                        />
                    </Box>
                )}
            </Box>

            <TextField
                label="Alt Text"
                value={config.alt}
                onChange={(e) => handleChange('alt', e.target.value)}
                fullWidth
                size="small"
                placeholder="Describe the image"
            />

            <TextField
                label="Link URL"
                value={config.link || ''}
                onChange={(e) => handleChange('link', e.target.value)}
                fullWidth
                size="small"
                placeholder="/products/example"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={config.openInNewTab}
                        onChange={(e) => handleChange('openInNewTab', e.target.checked)}
                        size="small"
                    />
                }
                label="Open link in new tab"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    select
                    label="Width"
                    value={config.width}
                    onChange={(e) => handleChange('width', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="auto">Auto</MenuItem>
                    <MenuItem value="full">Full Width</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                </TextField>

                {config.width === 'custom' && (
                    <TextField
                        label="Width (px)"
                        type="number"
                        value={config.customWidth || ''}
                        onChange={(e) => handleChange('customWidth', parseInt(e.target.value))}
                        fullWidth
                        size="small"
                    />
                )}
            </Box>

            <TextField
                label="Height (px)"
                type="number"
                value={config.height || ''}
                onChange={(e) => handleChange('height', parseInt(e.target.value) || undefined)}
                fullWidth
                size="small"
                placeholder="Leave empty for auto"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={config.fullHeight || false}
                        onChange={(e) => handleChange('fullHeight', e.target.checked)}
                        size="small"
                    />
                }
                label="Full Section Height"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1, display: 'block' }}>
                Make image take full height of the section (uses cover mode)
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    select
                    label="Object Fit"
                    value={config.objectFit}
                    onChange={(e) => handleChange('objectFit', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="cover">Cover</MenuItem>
                    <MenuItem value="contain">Contain</MenuItem>
                    <MenuItem value="fill">Fill</MenuItem>
                    <MenuItem value="none">None</MenuItem>
                </TextField>

                <TextField
                    select
                    label="Alignment"
                    value={config.alignment}
                    onChange={(e) => handleChange('alignment', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    label="Border Radius (px)"
                    type="number"
                    value={config.borderRadius}
                    onChange={(e) => handleChange('borderRadius', parseInt(e.target.value) || 0)}
                    fullWidth
                    size="small"
                />

                <TextField
                    select
                    label="Shadow"
                    value={config.shadow}
                    onChange={(e) => handleChange('shadow', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                </TextField>
            </Box>

            {/* Overlay Settings */}
            <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Overlay Settings
                </Typography>

                <FormControlLabel
                    control={
                        <Switch
                            checked={config.overlayEnabled || false}
                            onChange={(e) => handleChange('overlayEnabled', e.target.checked)}
                            size="small"
                        />
                    }
                    label="Enable Overlay"
                />

                {config.overlayEnabled && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Overlay Color"
                            type="color"
                            value={config.overlayColor || '#000000'}
                            onChange={(e) => handleChange('overlayColor', e.target.value)}
                            fullWidth
                            size="small"
                        />

                        <Box>
                            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                                Overlay Opacity: {config.overlayOpacity || 50}%
                            </Typography>
                            <TextField
                                type="range"
                                value={config.overlayOpacity || 50}
                                onChange={(e) => handleChange('overlayOpacity', parseInt(e.target.value))}
                                inputProps={{ min: 0, max: 100, step: 5 }}
                                fullWidth
                                size="small"
                            />
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.hoverEffect || false}
                                    onChange={(e) => handleChange('hoverEffect', e.target.checked)}
                                    size="small"
                                />
                            }
                            label="Enable Hover Effect"
                        />

                        {config.hoverEffect && (
                            <Box>
                                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                                    Hover Opacity: {config.hoverOpacity || 70}%
                                </Typography>
                                <TextField
                                    type="range"
                                    value={config.hoverOpacity || 70}
                                    onChange={(e) => handleChange('hoverOpacity', parseInt(e.target.value))}
                                    inputProps={{ min: 0, max: 100, step: 5 }}
                                    fullWidth
                                    size="small"
                                />
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* Text Overlay */}
            <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Text Overlay
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Title"
                        value={config.overlayTitle || ''}
                        onChange={(e) => handleChange('overlayTitle', e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="e.g., Have more questions?"
                    />

                    <TextField
                        label="Subtitle"
                        value={config.overlaySubtitle || ''}
                        onChange={(e) => handleChange('overlaySubtitle', e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="Optional subtitle text"
                    />

                    {(config.overlayTitle || config.overlaySubtitle) && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Title Color"
                                type="color"
                                value={config.titleColor || '#ffffff'}
                                onChange={(e) => handleChange('titleColor', e.target.value)}
                                fullWidth
                                size="small"
                            />

                            <TextField
                                label="Subtitle Color"
                                type="color"
                                value={config.subtitleColor || '#ffffff'}
                                onChange={(e) => handleChange('subtitleColor', e.target.value)}
                                fullWidth
                                size="small"
                            />
                        </Box>
                    )}

                    {(config.overlayTitle || config.overlaySubtitle) && (
                        <TextField
                            select
                            label="Text Position"
                            value={config.textPosition || 'center'}
                            onChange={(e) => handleChange('textPosition', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="top">Top</MenuItem>
                            <MenuItem value="center">Center</MenuItem>
                            <MenuItem value="bottom">Bottom</MenuItem>
                        </TextField>
                    )}
                </Box>
            </Box>

            {/* CTA Button */}
            <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    CTA Button
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Button Text"
                        value={config.ctaText || ''}
                        onChange={(e) => handleChange('ctaText', e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="e.g., Contact Us"
                    />

                    {config.ctaText && (
                        <>
                            <TextField
                                label="Button Link"
                                value={config.ctaLink || ''}
                                onChange={(e) => handleChange('ctaLink', e.target.value)}
                                fullWidth
                                size="small"
                                placeholder="/contact"
                            />

                            <TextField
                                select
                                label="Button Style"
                                value={config.ctaStyle || 'solid'}
                                onChange={(e) => handleChange('ctaStyle', e.target.value)}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="solid">Solid</MenuItem>
                                <MenuItem value="outline">Outline</MenuItem>
                                <MenuItem value="text">Text</MenuItem>
                            </TextField>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.ctaNewTab || false}
                                        onChange={(e) => handleChange('ctaNewTab', e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Open in new tab"
                            />
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
