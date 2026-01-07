import React, { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, Alert, TextField } from '@mui/material';
import heroSliderService, { HeroSlider } from '@/services/heroSlider.service';

interface HeroSliderConfigPanelProps {
    config: {
        sliderId?: string;
        height?: number;
    };
    onChange: (config: { sliderId?: string; height?: number }) => void;
    storeId?: string;
}

export default function HeroSliderConfigPanel({ config, onChange, storeId }: HeroSliderConfigPanelProps) {
    const [sliders, setSliders] = useState<HeroSlider[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSliders = async () => {
            try {
                // If storeId is provided (it should be in layout designer), pass it to filter
                const response = await heroSliderService.getAll(storeId);
                setSliders(response.data);
            } catch (error) {
                console.error('Failed to fetch hero sliders', error);
            } finally {
                setLoading(false);
            }
        };

        if (storeId) {
            fetchSliders();
        } else {
            // Should we fetch all if no storeId? Ideally layout designer always has store context.
            // But let's try safely.
            fetchSliders();
        }
    }, [storeId]);

    if (loading) {
        return <Typography variant="caption">Loading sliders...</Typography>;
    }

    if (sliders.length === 0) {
        return (
            <Alert severity="info" sx={{ mt: 1 }}>
                No Hero Sliders found. Please create one in the Hero Sliders section first.
            </Alert>
        );
    }

    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth size="small">
                <InputLabel>Select Hero Slider</InputLabel>
                <Select
                    value={config.sliderId || ''}
                    label="Select Hero Slider"
                    onChange={(e) => onChange({ ...config, sliderId: e.target.value })}
                >
                    {sliders.map((slider) => (
                        <MenuItem key={slider._id} value={slider._id}>
                            {slider.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth size="small">
                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Override Default Height (Optional)</Typography>
                <TextField
                    label="Height (px)"
                    type="number"
                    size="small"
                    value={config.height || ''}
                    onChange={(e) => onChange({ ...config, height: e.target.value ? parseInt(e.target.value) : undefined })}
                    helperText="Leave empty to use the Slider's internal responsive height settings."
                />
            </FormControl>
            <Typography variant="caption" color="text.secondary">
                Select the Hero Slider module you created in the "Hero Sliders" section.
            </Typography>
        </Box>
    );
}
