'use client';

import { Box, Typography } from '@mui/material';
import BrandShowcaseAutocomplete from '@/components/molecules/BrandShowcaseAutocomplete';

interface BrandLogosConfigPanelProps {
    config: {
        showcaseId?: string;
        [key: string]: any;
    };
    onChange: (config: any) => void;
    storeId?: string;
}

export default function BrandLogosConfigPanel({ config, onChange, storeId }: BrandLogosConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
                Select a brand showcase to display.
            </Typography>

            <BrandShowcaseAutocomplete
                value={config.showcaseId || null}
                onChange={(value) => handleChange('showcaseId', value)}
                storeId={storeId}
                label="Select Brand Showcase"
                required
            />
        </Box>
    );
}
