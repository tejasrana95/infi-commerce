'use client';

import {
    Box,
    Typography,
    TextField,
    MenuItem,
    FormControlLabel,
    Switch,
    Alert,
} from '@mui/material';
import { ThemeConfig } from '@/types';

// Compare config type (matches Store model)
interface CompareConfig {
    enabled?: boolean;
    maxProducts?: 2 | 3 | 4;
    maxProductsMobile?: 2;
    requireSameCategory?: boolean;
    showInProductCard?: boolean;
    showInProductPage?: boolean;
    widgetStyle?: 'floating' | 'drawer' | 'none';
    widgetPosition?: 'bottom' | 'bottom-right' | 'bottom-left';
}

const DEFAULT_COMPARE_CONFIG: CompareConfig = {
    enabled: true,
    maxProducts: 4,
    maxProductsMobile: 2,
    requireSameCategory: true,
    showInProductCard: true,
    showInProductPage: true,
    widgetStyle: 'floating',
    widgetPosition: 'bottom-right',
};

interface CompareSettingsProps {
    config: ThemeConfig;
    onChange: (config: ThemeConfig) => void;
}

export default function CompareSettings({ config, onChange }: CompareSettingsProps) {
    const compare: CompareConfig = { ...DEFAULT_COMPARE_CONFIG, ...config.compare };

    const handleChange = <K extends keyof CompareConfig>(key: K, value: CompareConfig[K]) => {
        onChange({
            ...config,
            compare: {
                ...compare,
                [key]: value,
            },
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" gutterBottom>
                Compare Products Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Configure how the product comparison feature works in your store.
            </Typography>

            {/* Enable/Disable */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={compare.enabled ?? true}
                            onChange={(e) => handleChange('enabled', e.target.checked)}
                        />
                    }
                    label="Enable Product Comparison"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, ml: 4 }}>
                    Allow customers to compare products side by side
                </Typography>
            </Box>

            {compare.enabled && (
                <>
                    {/* Visibility Settings */}
                    <Box sx={{
                        p: 2,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            Visibility
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={compare.showInProductCard ?? true}
                                    onChange={(e) => handleChange('showInProductCard', e.target.checked)}
                                />
                            }
                            label="Show Compare Button on Product Cards"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={compare.showInProductPage ?? true}
                                    onChange={(e) => handleChange('showInProductPage', e.target.checked)}
                                />
                            }
                            label="Show Compare Button on Product Page"
                        />
                    </Box>

                    {/* Comparison Rules */}
                    <Box sx={{
                        p: 2,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            Comparison Rules
                        </Typography>

                        <TextField
                            select
                            label="Maximum Products (Desktop)"
                            value={compare.maxProducts ?? 4}
                            onChange={(e) => handleChange('maxProducts', parseInt(e.target.value) as 2 | 3 | 4)}
                            fullWidth
                            size="small"
                            helperText="Maximum number of products that can be compared at once"
                        >
                            <MenuItem value={2}>2 Products</MenuItem>
                            <MenuItem value={3}>3 Products</MenuItem>
                            <MenuItem value={4}>4 Products</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Maximum Products (Mobile)"
                            value={compare.maxProductsMobile ?? 2}
                            onChange={(e) => handleChange('maxProductsMobile', parseInt(e.target.value) as 2)}
                            fullWidth
                            size="small"
                            helperText="Mobile devices have limited screen space"
                        >
                            <MenuItem value={2}>2 Products</MenuItem>
                        </TextField>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={compare.requireSameCategory ?? true}
                                    onChange={(e) => handleChange('requireSameCategory', e.target.checked)}
                                />
                            }
                            label="Require Same Category"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, ml: 4 }}>
                            Only allow comparing products from the same category for more meaningful comparisons
                        </Typography>
                    </Box>

                    {/* Widget Settings */}
                    <Box sx={{
                        p: 2,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            Compare Widget
                        </Typography>

                        <TextField
                            select
                            label="Widget Style"
                            value={compare.widgetStyle ?? 'floating'}
                            onChange={(e) => handleChange('widgetStyle', e.target.value as 'floating' | 'drawer' | 'none')}
                            fullWidth
                            size="small"
                            helperText="How the compare widget appears on the page"
                        >
                            <MenuItem value="floating">Floating Bar</MenuItem>
                            <MenuItem value="drawer">Side Drawer</MenuItem>
                            <MenuItem value="none">No Widget (Header Link Only)</MenuItem>
                        </TextField>

                        {compare.widgetStyle !== 'none' && (
                            <TextField
                                select
                                label="Widget Position"
                                value={compare.widgetPosition ?? 'bottom-right'}
                                onChange={(e) => handleChange('widgetPosition', e.target.value as 'bottom' | 'bottom-right' | 'bottom-left')}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="bottom">Bottom Center</MenuItem>
                                <MenuItem value="bottom-right">Bottom Right</MenuItem>
                                <MenuItem value="bottom-left">Bottom Left</MenuItem>
                            </TextField>
                        )}
                    </Box>

                    <Alert severity="info">
                        The compare widget shows selected products and provides quick access to the comparison page.
                        Customers can add products to compare from product cards or product pages.
                    </Alert>
                </>
            )}
        </Box>
    );
}
