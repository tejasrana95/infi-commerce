'use client';

import { Box, Typography } from '@mui/material';
import TestimonialAutocomplete from '@/components/molecules/TestimonialAutocomplete';

interface TestimonialsConfigPanelProps {
    config: {
        testimonialIds?: string[];
        [key: string]: any;
    };
    onChange: (config: any) => void;
    storeId?: string;
}

export default function TestimonialsConfigPanel({ config, onChange, storeId }: TestimonialsConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
                Select specific testimonials to display.
            </Typography>

            <TestimonialAutocomplete
                value={config.testimonialIds || []}
                onChange={(value) => handleChange('testimonialIds', value)}
                storeId={storeId}
                label="Select Testimonials"
                placeholder="Choose testimonials..."
            />
        </Box>
    );
}
