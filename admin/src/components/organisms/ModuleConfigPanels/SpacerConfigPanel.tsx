'use client';

import {
    Box,
    TextField,
    Slider,
    Typography,
} from '@mui/material';

export interface SpacerConfig {
    height: number;
    mobileHeight?: number;
    backgroundColor?: string;
}

interface SpacerConfigPanelProps {
    config: SpacerConfig;
    onChange: (config: SpacerConfig) => void;
}

export const defaultSpacerConfig: SpacerConfig = {
    height: 40,
    mobileHeight: undefined,
    backgroundColor: 'transparent',
};

export default function SpacerConfigPanel({ config, onChange }: SpacerConfigPanelProps) {
    const handleChange = (key: keyof SpacerConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
                Spacer Settings
            </Typography>

            <Box>
                <Typography variant="caption" color="text.secondary">
                    Desktop Height: {config.height}px
                </Typography>
                <Slider
                    value={config.height}
                    onChange={(_, val) => handleChange('height', val)}
                    min={8}
                    max={200}
                    step={8}
                    valueLabelDisplay="auto"
                />
            </Box>

            <TextField
                label="Mobile Height (px)"
                type="number"
                value={config.mobileHeight || ''}
                onChange={(e) => handleChange('mobileHeight', parseInt(e.target.value) || undefined)}
                fullWidth
                size="small"
                placeholder="Same as desktop"
                helperText="Leave empty to use desktop height"
            />

            <Box>
                <Typography variant="caption" color="text.secondary">
                    Background Color
                </Typography>
                <input
                    type="color"
                    value={config.backgroundColor || '#ffffff'}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    style={{
                        width: '100%',
                        height: 36,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        cursor: 'pointer',
                    }}
                />
            </Box>

            {/* Preview */}
            <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    Preview
                </Typography>
                <Box
                    sx={{
                        height: Math.min(config.height, 100),
                        backgroundColor: config.backgroundColor || 'transparent',
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        {config.height}px
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
