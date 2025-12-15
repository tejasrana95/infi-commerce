'use client';

import {
    Box,
    TextField,
    MenuItem,
    Typography,
    Slider,
} from '@mui/material';

export interface DividerConfig {
    style: 'solid' | 'dashed' | 'dotted' | 'double';
    thickness: number;
    color: string;
    width: 'full' | '75%' | '50%' | '25%';
    alignment: 'left' | 'center' | 'right';
    marginTop: number;
    marginBottom: number;
}

interface DividerConfigPanelProps {
    config: DividerConfig;
    onChange: (config: DividerConfig) => void;
}

export const defaultDividerConfig: DividerConfig = {
    style: 'solid',
    thickness: 1,
    color: '#e0e0e0',
    width: 'full',
    alignment: 'center',
    marginTop: 16,
    marginBottom: 16,
};

export default function DividerConfigPanel({ config, onChange }: DividerConfigPanelProps) {
    const handleChange = (key: keyof DividerConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
                Divider Settings
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    select
                    label="Style"
                    value={config.style}
                    onChange={(e) => handleChange('style', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="solid">Solid</MenuItem>
                    <MenuItem value="dashed">Dashed</MenuItem>
                    <MenuItem value="dotted">Dotted</MenuItem>
                    <MenuItem value="double">Double</MenuItem>
                </TextField>

                <TextField
                    label="Thickness (px)"
                    type="number"
                    value={config.thickness}
                    onChange={(e) => handleChange('thickness', parseInt(e.target.value) || 1)}
                    fullWidth
                    size="small"
                    inputProps={{ min: 1, max: 10 }}
                />
            </Box>

            <Box>
                <Typography variant="caption" color="text.secondary">
                    Color
                </Typography>
                <input
                    type="color"
                    value={config.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    style={{
                        width: '100%',
                        height: 36,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        cursor: 'pointer',
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    select
                    label="Width"
                    value={config.width}
                    onChange={(e) => handleChange('width', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="full">Full Width</MenuItem>
                    <MenuItem value="75%">75%</MenuItem>
                    <MenuItem value="50%">50%</MenuItem>
                    <MenuItem value="25%">25%</MenuItem>
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

            <Box>
                <Typography variant="caption" color="text.secondary">
                    Margin Top: {config.marginTop}px
                </Typography>
                <Slider
                    value={config.marginTop}
                    onChange={(_, val) => handleChange('marginTop', val)}
                    min={0}
                    max={80}
                    step={4}
                />
            </Box>

            <Box>
                <Typography variant="caption" color="text.secondary">
                    Margin Bottom: {config.marginBottom}px
                </Typography>
                <Slider
                    value={config.marginBottom}
                    onChange={(_, val) => handleChange('marginBottom', val)}
                    min={0}
                    max={80}
                    step={4}
                />
            </Box>

            {/* Preview */}
            <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    Preview
                </Typography>
                <Box
                    sx={{
                        py: 2,
                        display: 'flex',
                        justifyContent: config.alignment === 'left' ? 'flex-start' : config.alignment === 'right' ? 'flex-end' : 'center',
                    }}
                >
                    <Box
                        sx={{
                            width: config.width,
                            borderTop: `${config.thickness}px ${config.style} ${config.color}`,
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
}
