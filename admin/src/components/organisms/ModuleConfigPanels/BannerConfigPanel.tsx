'use client';

import { Box, TextField, Typography } from '@mui/material';
import BannerAutocomplete from '@/components/molecules/BannerAutocomplete';

interface BannerConfigPanelProps {
    config: {
        bannerId?: string;
        [key: string]: any;
    };
    onChange: (config: any) => void;
    storeId?: string;
}

export default function BannerConfigPanel({ config, onChange, storeId }: BannerConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
                Select a banner to display in this module.
            </Typography>

            <BannerAutocomplete
                value={config.bannerId || null}
                onChange={(value) => handleChange('bannerId', value)}
                storeId={storeId}
                label="Select Banner"
                required
            />
        </Box>
    );
}
