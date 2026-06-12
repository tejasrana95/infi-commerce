'use client';

import { Box, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import TestimonialAutocomplete from '@/components/molecules/TestimonialAutocomplete';
import { ColorPicker } from '@/components/atoms';

interface TestimonialsConfigPanelProps {
    config: {
        testimonialIds?: string[];
        layout?: 'single' | 'multi-carousel';
        visibleCards?: number;
        borderColor?: string;
        backgroundColor?: string;
        themeColor?: string;
        customerNameColor?: string;
        customerTitleColor?: string;
        productPurchasedColor?: string;
        [key: string]: any;
    };
    onChange: (config: any) => void;
    storeId?: string;
}

export default function TestimonialsConfigPanel({ config, onChange, storeId }: TestimonialsConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const currentLayout = config.layout || 'single';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

            <FormControl fullWidth size="small">
                <InputLabel>Theme Layout</InputLabel>
                <Select
                    value={currentLayout}
                    label="Theme Layout"
                    onChange={(e) => handleChange('layout', e.target.value)}
                >
                    <MenuItem value="single">Full Width Single</MenuItem>
                    <MenuItem value="multi-carousel">Multi-card Grid / Carousel</MenuItem>
                </Select>
            </FormControl>

            {currentLayout === 'multi-carousel' && (
                <>
                    <FormControl fullWidth size="small">
                        <InputLabel>Visible Cards</InputLabel>
                        <Select
                            value={config.visibleCards || 3}
                            label="Visible Cards"
                            onChange={(e) => handleChange('visibleCards', Number(e.target.value))}
                        >
                            {[2, 3, 4, 5, 6].map((num) => (
                                <MenuItem key={num} value={num}>
                                    {num} Cards
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>
                        Design & Colors
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <ColorPicker
                            label="Background Color"
                            value={config.backgroundColor || '#fffaf2'}
                            onChange={(color) => handleChange('backgroundColor', color)}
                            size="small"
                        />
                        <ColorPicker
                            label="Border Color"
                            value={config.borderColor || '#e8d8bd'}
                            onChange={(color) => handleChange('borderColor', color)}
                            size="small"
                        />
                        <ColorPicker
                            label="Theme Accent Color"
                            value={config.themeColor || '#6f5330'}
                            onChange={(color) => handleChange('themeColor', color)}
                            size="small"
                        />
                        <ColorPicker
                            label="Customer Name Color"
                            value={config.customerNameColor || '#1f2937'}
                            onChange={(color) => handleChange('customerNameColor', color)}
                            size="small"
                        />
                        <ColorPicker
                            label="Title/Role Color"
                            value={config.customerTitleColor || '#6b7280'}
                            onChange={(color) => handleChange('customerTitleColor', color)}
                            size="small"
                        />
                        <ColorPicker
                            label="Purchased Product Color"
                            value={config.productPurchasedColor || '#b45309'}
                            onChange={(color) => handleChange('productPurchasedColor', color)}
                            size="small"
                        />
                    </Box>
                </>
            )}
        </Box>
    );
}
