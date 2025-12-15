'use client';

import {
    Box,
    TextField,
    MenuItem,
    FormControlLabel,
    Switch,
    Typography,
    IconButton,
    Button,
    Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';

interface GalleryImage {
    src: string;
    alt: string;
    link?: string;
}

export interface ImageGalleryConfig {
    images: GalleryImage[];
    layout: 'grid' | 'masonry' | 'carousel';
    columns: number;
    gap: number;
    aspectRatio: 'square' | '4:3' | '16:9' | 'auto';
    lightbox: boolean;
    showCaptions: boolean;
}

interface ImageGalleryConfigPanelProps {
    config: ImageGalleryConfig;
    onChange: (config: ImageGalleryConfig) => void;
}

export const defaultImageGalleryConfig: ImageGalleryConfig = {
    images: [],
    layout: 'grid',
    columns: 3,
    gap: 16,
    aspectRatio: 'square',
    lightbox: true,
    showCaptions: false,
};

export default function ImageGalleryConfigPanel({ config, onChange }: ImageGalleryConfigPanelProps) {
    const handleChange = (key: keyof ImageGalleryConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const handleImageSelect = (files: FileItem[]) => {
        const newImages = files.map(f => ({ src: f.url, alt: f.originalName, link: '' }));
        handleChange('images', [...config.images, ...newImages]);
    };

    const updateImage = (index: number, field: keyof GalleryImage, value: string) => {
        const updated = [...config.images];
        updated[index] = { ...updated[index], [field]: value };
        handleChange('images', updated);
    };

    const removeImage = (index: number) => {
        handleChange('images', config.images.filter((_, i) => i !== index));
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
                Image Gallery Settings
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    select
                    label="Layout"
                    value={config.layout}
                    onChange={(e) => handleChange('layout', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="grid">Grid</MenuItem>
                    <MenuItem value="masonry">Masonry</MenuItem>
                    <MenuItem value="carousel">Carousel</MenuItem>
                </TextField>

                <TextField
                    select
                    label="Columns"
                    value={config.columns}
                    onChange={(e) => handleChange('columns', parseInt(e.target.value))}
                    fullWidth
                    size="small"
                >
                    {[2, 3, 4, 5, 6].map(n => (
                        <MenuItem key={n} value={n}>{n}</MenuItem>
                    ))}
                </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    label="Gap (px)"
                    type="number"
                    value={config.gap}
                    onChange={(e) => handleChange('gap', parseInt(e.target.value) || 0)}
                    fullWidth
                    size="small"
                />

                <TextField
                    select
                    label="Aspect Ratio"
                    value={config.aspectRatio}
                    onChange={(e) => handleChange('aspectRatio', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="square">Square (1:1)</MenuItem>
                    <MenuItem value="4:3">4:3</MenuItem>
                    <MenuItem value="16:9">16:9</MenuItem>
                    <MenuItem value="auto">Auto</MenuItem>
                </TextField>
            </Box>

            <FormControlLabel
                control={
                    <Switch
                        checked={config.lightbox}
                        onChange={(e) => handleChange('lightbox', e.target.checked)}
                        size="small"
                    />
                }
                label="Enable lightbox"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={config.showCaptions}
                        onChange={(e) => handleChange('showCaptions', e.target.checked)}
                        size="small"
                    />
                }
                label="Show captions"
            />

            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                        Images ({config.images.length})
                    </Typography>
                    <FileManagerButton
                        onSelect={handleImageSelect}
                        accept="image/*"
                        label="Add Images"
                        multiple
                        size="small"
                    />
                </Box>

                {config.images.map((img, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 1, mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <img
                            src={img.src}
                            alt={img.alt}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <TextField
                            value={img.alt}
                            onChange={(e) => updateImage(index, 'alt', e.target.value)}
                            placeholder="Alt text"
                            size="small"
                            sx={{ flex: 1 }}
                        />
                        <IconButton size="small" color="error" onClick={() => removeImage(index)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Paper>
                ))}
            </Box>
        </Box>
    );
}
