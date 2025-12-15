'use client';

import { Box, Typography } from '@mui/material';
import CategoryAutocomplete, { CategoryOption } from '@/components/molecules/CategoryAutocomplete';

interface CategoryShowcaseConfigPanelProps {
    config: {
        categoryIds?: string[];
        [key: string]: any;
    };
    onChange: (config: any) => void;
    storeId?: string;
}

export default function CategoryShowcaseConfigPanel({ config, onChange, storeId }: CategoryShowcaseConfigPanelProps) {
    const handleChange = (ids: string[] | string | null) => {
        const categoryIds = Array.isArray(ids) ? ids : (ids ? [ids] : []);
        onChange({ ...config, categoryIds });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
                Select specific categories to showcase.
            </Typography>

            <CategoryAutocomplete
                value={config.categoryIds || []}
                onChange={handleChange}
                storeId={storeId}
                label="Select Categories"
                multiple
            />
        </Box>
    );
}
