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
    objectFit: 'cover' | 'contain' | 'fill' | 'none';
    alignment: 'left' | 'center' | 'right';
    borderRadius: number;
    shadow: 'none' | 'small' | 'medium' | 'large';
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
    objectFit: 'cover',
    alignment: 'center',
    borderRadius: 0,
    shadow: 'none',
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
        </Box>
    );
}
