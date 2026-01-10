'use client';

import React from 'react';
import {
    Box,
    TextField,
    Typography,
    Slider,
    FormControlLabel,
    Checkbox,
    RadioGroup,
    Radio,
    FormControl,
    FormLabel,
    Divider,
} from '@mui/material';
import { LayoutModule } from '@/types';
import IconPicker from '@/components/atoms/IconPicker';

interface IconConfigPanelProps {
    module: LayoutModule;
    onChange: (module: LayoutModule) => void;
}

export default function IconConfigPanel({ module, onChange }: IconConfigPanelProps) {
    const config = module.config || {};

    const updateConfig = (key: string, value: any) => {
        onChange({
            ...module,
            config: { ...module.config, [key]: value },
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Icon Selection */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Icon
                </Typography>
                <IconPicker
                    value={config.icon || ''}
                    onChange={(icon: string) => updateConfig('icon', icon)}
                />
            </Box>

            <Divider />

            {/* Icon Size */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Size
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Slider
                        value={config.size || 48}
                        onChange={(_, value) => updateConfig('size', value)}
                        min={16}
                        max={200}
                        sx={{ flex: 1 }}
                    />
                    <TextField
                        type="number"
                        value={config.size || 48}
                        onChange={(e) => updateConfig('size', parseInt(e.target.value))}
                        sx={{ width: 80 }}
                        size="small"
                        InputProps={{ endAdornment: 'px' }}
                    />
                </Box>
            </Box>

            {/* Icon Color */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Icon Color
                </Typography>
                <input
                    type="color"
                    value={config.iconColor || '#000000'}
                    onChange={(e) => updateConfig('iconColor', e.target.value)}
                    style={{ width: '100%', height: 40, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                />
            </Box>

            <Divider />

            {/* Position */}
            <Box>
                <FormControl>
                    <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Position</FormLabel>
                    <RadioGroup
                        row
                        value={config.position || 'center'}
                        onChange={(e) => updateConfig('position', e.target.value)}
                    >
                        <FormControlLabel value="left" control={<Radio />} label="Left" />
                        <FormControlLabel value="center" control={<Radio />} label="Center" />
                        <FormControlLabel value="right" control={<Radio />} label="Right" />
                    </RadioGroup>
                </FormControl>
            </Box>

            <Divider />

            {/* Border Settings */}
            <Box>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={config.showBorder || false}
                            onChange={(e) => updateConfig('showBorder', e.target.checked)}
                        />
                    }
                    label={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Show Border</Typography>}
                />

                {config.showBorder && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {/* Border Color */}
                        <Box>
                            <Typography variant="caption" gutterBottom>Border Color</Typography>
                            <input
                                type="color"
                                value={config.borderColor || '#000000'}
                                onChange={(e) => updateConfig('borderColor', e.target.value)}
                                style={{ width: '100%', height: 40, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                            />
                        </Box>

                        {/* Border Size */}
                        <TextField
                            label="Border Size"
                            type="number"
                            value={config.borderSize || 2}
                            onChange={(e) => updateConfig('borderSize', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{ endAdornment: 'px' }}
                        />

                        {/* Border Radius */}
                        <TextField
                            label="Border Radius"
                            type="number"
                            value={config.borderRadius || 0}
                            onChange={(e) => updateConfig('borderRadius', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{ endAdornment: 'px' }}
                        />
                    </Box>
                )}
            </Box>

            <Divider />

            {/* Padding */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Padding
                </Typography>
                <TextField
                    type="number"
                    value={config.padding || 16}
                    onChange={(e) => updateConfig('padding', parseInt(e.target.value))}
                    fullWidth
                    size="small"
                    InputProps={{ endAdornment: 'px' }}
                />
            </Box>

            <Divider />

            {/* Hover Effect */}
            <Box>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={config.hoverEffect || false}
                            onChange={(e) => updateConfig('hoverEffect', e.target.checked)}
                        />
                    }
                    label={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Enable Hover Effect</Typography>}
                />
            </Box>
        </Box>
    );
}
