'use client';

import { Box, Typography } from '@mui/material';
import BannerSliderAutocomplete from '@/components/molecules/BannerSliderAutocomplete';

interface BannerSliderConfigPanelProps {
    config: {
        sliderId?: string;
        [key: string]: any;
    };
    onChange: (config: any) => void;
    storeId?: string;
}

export default function BannerSliderConfigPanel({ config, onChange, storeId }: BannerSliderConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
                Select a slider to display in this module.
            </Typography>

            <BannerSliderAutocomplete
                value={config.sliderId || null}
                onChange={(value) => handleChange('sliderId', value)}
                storeId={storeId}
                label="Select Slider"
                required
            />
        </Box>
    );
}
