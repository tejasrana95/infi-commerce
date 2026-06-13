'use client';

import { Box, Typography } from '@mui/material';
import HeroBannerAutocomplete from '@/components/molecules/HeroBannerAutocomplete';

interface HeroBannerConfigPanelProps {
    config: {
        bannerId?: string;
        [key: string]: any;
    };
    onChange: (config: any) => void;
    storeId?: string;
}

export default function HeroBannerConfigPanel({ config, onChange, storeId }: HeroBannerConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
                Select the custom Hero Banner you wish to display.
            </Typography>

            <HeroBannerAutocomplete
                value={config.bannerId || ''}
                onChange={(value) => handleChange('bannerId', value)}
                storeId={storeId}
                label="Select Hero Banner"
                placeholder="Choose a hero banner..."
            />
        </Box>
    );
}
