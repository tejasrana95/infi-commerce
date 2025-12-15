'use client';

import {
    Box,
    TextField,
    MenuItem,
    FormControlLabel,
    Switch,
    Typography,
} from '@mui/material';

export interface VideoConfig {
    source: 'youtube' | 'vimeo' | 'custom';
    url: string;
    autoplay: boolean;
    muted: boolean;
    loop: boolean;
    controls: boolean;
    aspectRatio: '16:9' | '4:3' | '1:1' | '9:16';
    maxWidth?: number;
    alignment: 'left' | 'center' | 'right';
    poster?: string;
}

interface VideoConfigPanelProps {
    config: VideoConfig;
    onChange: (config: VideoConfig) => void;
}

export const defaultVideoConfig: VideoConfig = {
    source: 'youtube',
    url: '',
    autoplay: false,
    muted: true,
    loop: false,
    controls: true,
    aspectRatio: '16:9',
    maxWidth: undefined,
    alignment: 'center',
    poster: '',
};

export default function VideoConfigPanel({ config, onChange }: VideoConfigPanelProps) {
    const handleChange = (key: keyof VideoConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const getPlaceholder = () => {
        switch (config.source) {
            case 'youtube': return 'https://www.youtube.com/watch?v=...';
            case 'vimeo': return 'https://vimeo.com/...';
            default: return 'https://example.com/video.mp4';
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
                Video Settings
            </Typography>

            <TextField
                select
                label="Video Source"
                value={config.source}
                onChange={(e) => handleChange('source', e.target.value)}
                fullWidth
                size="small"
            >
                <MenuItem value="youtube">YouTube</MenuItem>
                <MenuItem value="vimeo">Vimeo</MenuItem>
                <MenuItem value="custom">Custom URL</MenuItem>
            </TextField>

            <TextField
                label="Video URL"
                value={config.url}
                onChange={(e) => handleChange('url', e.target.value)}
                fullWidth
                size="small"
                placeholder={getPlaceholder()}
            />

            {config.source === 'custom' && (
                <TextField
                    label="Poster Image URL"
                    value={config.poster || ''}
                    onChange={(e) => handleChange('poster', e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="URL to poster/thumbnail image"
                />
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    select
                    label="Aspect Ratio"
                    value={config.aspectRatio}
                    onChange={(e) => handleChange('aspectRatio', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="16:9">16:9 (Landscape)</MenuItem>
                    <MenuItem value="4:3">4:3</MenuItem>
                    <MenuItem value="1:1">1:1 (Square)</MenuItem>
                    <MenuItem value="9:16">9:16 (Portrait)</MenuItem>
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

            <TextField
                label="Max Width (px)"
                type="number"
                value={config.maxWidth || ''}
                onChange={(e) => handleChange('maxWidth', parseInt(e.target.value) || undefined)}
                fullWidth
                size="small"
                placeholder="Leave empty for full width"
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.autoplay}
                            onChange={(e) => handleChange('autoplay', e.target.checked)}
                            size="small"
                        />
                    }
                    label="Autoplay"
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={config.muted}
                            onChange={(e) => handleChange('muted', e.target.checked)}
                            size="small"
                        />
                    }
                    label="Muted"
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={config.loop}
                            onChange={(e) => handleChange('loop', e.target.checked)}
                            size="small"
                        />
                    }
                    label="Loop"
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={config.controls}
                            onChange={(e) => handleChange('controls', e.target.checked)}
                            size="small"
                        />
                    }
                    label="Controls"
                />
            </Box>
        </Box>
    );
}
