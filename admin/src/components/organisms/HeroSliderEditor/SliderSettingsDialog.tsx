import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Switch,
    FormControlLabel,
    Divider,
    Tabs,
    Tab
} from '@mui/material';
import { ColorPicker } from '@/components/atoms';
import { HeroSlider } from '@/services/heroSlider.service';

interface SliderSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    settings: HeroSlider['settings'];
    onSave: (settings: HeroSlider['settings']) => void;
}

export default function SliderSettingsDialog({ open, onClose, settings, onSave }: SliderSettingsDialogProps) {
    const [localSettings, setLocalSettings] = useState<HeroSlider['settings']>(settings);
    const [tab, setTab] = useState(0);

    // Sync when opening
    useEffect(() => {
        if (open) {
            setLocalSettings(settings);
        }
    }, [open, settings]);

    const handleChange = (key: keyof HeroSlider['settings'], value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleHeightChange = (key: 'desktop' | 'tablet' | 'mobile', value: string) => {
        const numValue = parseInt(value) || 0;
        setLocalSettings(prev => {
            const currentHeight = typeof prev.height === 'number'
                ? { desktop: prev.height, tablet: prev.height, mobile: prev.height }
                : prev.height;

            return {
                ...prev,
                height: {
                    ...currentHeight,
                    [key]: numValue
                }
            };
        });
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const getHeightValue = (key: 'desktop' | 'tablet' | 'mobile') => {
        if (typeof localSettings.height === 'number') return localSettings.height;
        return localSettings.height[key];
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Slider Settings</DialogTitle>
            <DialogContent dividers>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                    <Tab label="General" />
                    <Tab label="Responsive" />
                    <Tab label="Navigation" />
                </Tabs>

                {tab === 0 && (
                    <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Slider Base Width (px)"
                            type="number"
                            fullWidth
                            size="small"
                            value={localSettings.width}
                            onChange={(e) => handleChange('width', parseInt(e.target.value))}
                            helperText="Content container width for all devices"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localSettings.autoPlay}
                                    onChange={(e) => handleChange('autoPlay', e.target.checked)}
                                />
                            }
                            label="Auto Play"
                        />
                        {localSettings.autoPlay && (
                            <TextField
                                label="Delay (ms)"
                                type="number"
                                fullWidth
                                size="small"
                                value={localSettings.delay}
                                onChange={(e) => handleChange('delay', parseInt(e.target.value))}
                            />
                        )}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localSettings.responsive}
                                    onChange={(e) => handleChange('responsive', e.target.checked)}
                                />
                            }
                            label="Responsive Scaling"
                        />
                    </Box>
                )}

                {tab === 1 && (
                    <Box display="flex" flexDirection="column" gap={3}>
                        <Typography variant="subtitle2">Slider Height</Typography>
                        <Box display="flex" gap={2}>
                            <TextField
                                label="Desktop (px)"
                                type="number"
                                fullWidth
                                size="small"
                                value={getHeightValue('desktop')}
                                onChange={(e) => handleHeightChange('desktop', e.target.value)}
                            />
                            <TextField
                                label="Tablet (px)"
                                type="number"
                                fullWidth
                                size="small"
                                value={getHeightValue('tablet')}
                                onChange={(e) => handleHeightChange('tablet', e.target.value)}
                            />
                            <TextField
                                label="Mobile (px)"
                                type="number"
                                fullWidth
                                size="small"
                                value={getHeightValue('mobile')}
                                onChange={(e) => handleHeightChange('mobile', e.target.value)}
                            />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Define specific heights for different device break points.
                        </Typography>
                    </Box>
                )}

                {tab === 2 && (
                    <Box display="flex" flexDirection="column" gap={3}>
                        <Typography variant="subtitle2">Bullets (Pagination)</Typography>
                        <Box display="flex" alignItems="center" gap={4}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={localSettings.showBullets ?? true}
                                        onChange={(e) => handleChange('showBullets', e.target.checked)}
                                    />
                                }
                                label="Show Bullets"
                            />
                            <ColorPicker
                                label="Bullet Color"
                                value={localSettings.bulletColor || '#ffffff'}
                                onChange={(color) => handleChange('bulletColor', color)}
                                fullWidth={false}
                            // sx={{ width: 150 }}
                            />
                        </Box>

                        <Divider />

                        <Typography variant="subtitle2">Arrows (Navigation)</Typography>
                        <Box display="flex" alignItems="center" gap={4}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={localSettings.showArrows ?? true}
                                        onChange={(e) => handleChange('showArrows', e.target.checked)}
                                    />
                                }
                                label="Show Arrows"
                            />
                            <ColorPicker
                                label="Arrow Color"
                                value={localSettings.arrowColor || '#ffffff'}
                                onChange={(color) => handleChange('arrowColor', color)}
                                fullWidth={false}
                            // sx={{ width: 150 }}
                            />
                        </Box>

                        <Divider />

                        <Typography variant="subtitle2">Slide Progress Bar</Typography>
                        <Box display="flex" flexDirection="column" gap={2}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={localSettings.showProgress ?? false}
                                        onChange={(e) => handleChange('showProgress', e.target.checked)}
                                    />
                                }
                                label="Show Progress Bar"
                            />
                            {localSettings.showProgress && (
                                <TextField
                                    select
                                    label="Position"
                                    size="small"
                                    fullWidth
                                    value={localSettings.progressPosition || 'bottom'}
                                    onChange={(e) => handleChange('progressPosition', e.target.value)}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="top">Top</option>
                                    <option value="bottom">Bottom</option>
                                </TextField>
                            )}
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Save Settings
                </Button>
            </DialogActions>
        </Dialog>
    );
}
