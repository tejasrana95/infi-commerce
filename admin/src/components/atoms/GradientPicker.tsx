import React, { useState, useEffect } from 'react';
import { Box, TextField, Grid, Typography, Select, MenuItem, Slider, FormControl, InputLabel } from '@mui/material';
import ColorPicker from './ColorPicker';

interface GradientPickerProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
}

export const GradientPicker = ({
    value = 'linear-gradient(135deg, #fefaf4 0%, #f7ebd9 100%)',
    onChange,
    label = 'Background CSS (color/gradient)'
}: GradientPickerProps) => {
    const [type, setType] = useState<'linear' | 'radial'>('linear');
    const [angle, setAngle] = useState<number>(135);
    const [color1, setColor1] = useState<string>('#fefaf4');
    const [pos1, setPos1] = useState<number>(0);
    const [color2, setColor2] = useState<string>('#f7ebd9');
    const [pos2, setPos2] = useState<number>(100);

    // Parse the gradient string to sync the UI controls
    useEffect(() => {
        if (!value) return;

        // Try to parse linear-gradient
        const linearRegex = /linear-gradient\((\d+)deg,\s*([^ ]+)\s+(\d+)%,\s*([^ ]+)\s+(\d+)%\)/i;
        const linearMatch = value.match(linearRegex);
        if (linearMatch) {
            setType('linear');
            setAngle(parseInt(linearMatch[1], 10));
            setColor1(linearMatch[2]);
            setPos1(parseInt(linearMatch[3], 10));
            setColor2(linearMatch[4]);
            setPos2(parseInt(linearMatch[5], 10));
            return;
        }

        // Try to parse radial-gradient
        const radialRegex = /radial-gradient\(circle,\s*([^ ]+)\s+(\d+)%,\s*([^ ]+)\s+(\d+)%\)/i;
        const radialMatch = value.match(radialRegex);
        if (radialMatch) {
            setType('radial');
            setColor1(radialMatch[1]);
            setPos1(parseInt(radialMatch[2], 10));
            setColor2(radialMatch[3]);
            setPos2(parseInt(radialMatch[4], 10));
            return;
        }
    }, [value]);

    // Handle change of UI controls
    const updateGradient = (
        newType: 'linear' | 'radial',
        newAngle: number,
        c1: string,
        p1: number,
        c2: string,
        p2: number
    ) => {
        let newValue = '';
        if (newType === 'linear') {
            newValue = `linear-gradient(${newAngle}deg, ${c1} ${p1}%, ${c2} ${p2}%)`;
        } else {
            newValue = `radial-gradient(circle, ${c1} ${p1}%, ${c2} ${p2}%)`;
        }
        onChange(newValue);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    label={label}
                    fullWidth
                    size="small"
                    helperText="Edit CSS code directly or use controls below to design"
                />
                <Box
                    sx={{
                        width: 70,
                        height: 40,
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        background: value,
                        flexShrink: 0
                    }}
                />
            </Box>

            <Box sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', p: 2, backgroundColor: '#f9fafb' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                    Design Gradient
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={type}
                                label="Type"
                                onChange={(e) => {
                                    const val = e.target.value as 'linear' | 'radial';
                                    setType(val);
                                    updateGradient(val, angle, color1, pos1, color2, pos2);
                                }}
                            >
                                <MenuItem value="linear">Linear</MenuItem>
                                <MenuItem value="radial">Radial</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {type === 'linear' && (
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <Box sx={{ px: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Angle: {angle}°
                                </Typography>
                                <Slider
                                    value={angle}
                                    min={0}
                                    max={360}
                                    size="small"
                                    onChange={(_, val) => {
                                        const valNum = val as number;
                                        setAngle(valNum);
                                        updateGradient(type, valNum, color1, pos1, color2, pos2);
                                    }}
                                />
                            </Box>
                        </Grid>
                    )}
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Stop 1 */}
                    <Box sx={{ p: 1.5, border: '1px dashed #d1d5db', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                        <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1 }}>
                            Color Stop 1
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <ColorPicker
                                    value={color1}
                                    onChange={(val) => {
                                        setColor1(val);
                                        updateGradient(type, angle, val, pos1, color2, pos2);
                                    }}
                                    label="Color"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <Box sx={{ px: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Position: {pos1}%
                                    </Typography>
                                    <Slider
                                        value={pos1}
                                        min={0}
                                        max={100}
                                        size="small"
                                        onChange={(_, val) => {
                                            const valNum = val as number;
                                            setPos1(valNum);
                                            updateGradient(type, angle, color1, valNum, color2, pos2);
                                        }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Stop 2 */}
                    <Box sx={{ p: 1.5, border: '1px dashed #d1d5db', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                        <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1 }}>
                            Color Stop 2
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <ColorPicker
                                    value={color2}
                                    onChange={(val) => {
                                        setColor2(val);
                                        updateGradient(type, angle, color1, pos1, val, pos2);
                                    }}
                                    label="Color"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <Box sx={{ px: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Position: {pos2}%
                                    </Typography>
                                    <Slider
                                        value={pos2}
                                        min={0}
                                        max={100}
                                        size="small"
                                        onChange={(_, val) => {
                                            const valNum = val as number;
                                            setPos2(valNum);
                                            updateGradient(type, angle, color1, pos1, color2, valNum);
                                        }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default GradientPicker;
