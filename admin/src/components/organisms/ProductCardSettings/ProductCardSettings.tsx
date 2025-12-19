'use client';

import {
    Box,
    Typography,
    TextField,
    MenuItem,
    FormControlLabel,
    Switch,
    Slider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { ThemeConfig, ProductCardConfig } from '@/types';

interface ProductCardSettingsProps {
    config: ThemeConfig;
    onChange: (config: ThemeConfig) => void;
}

const defaultProductCardConfig: ProductCardConfig = {
    // Card Design
    cardStyle: 'default',

    // Image Settings
    imageAspectRatio: '3:4',
    imageSize: 'medium',
    imageFit: 'cover',
    showImageHover: true,

    // Button Visibility
    showAddToCart: true,
    showBuyNow: false,
    showWishlist: true,
    showQuickView: true,
    showCompare: false,

    // Button Styles
    addToCartStyle: 'filled',
    buyNowStyle: 'outlined',
    wishlistPosition: 'top-right',
    quickViewPosition: 'overlay',

    // Typography
    titleLines: 2,
    titleFontSize: 'medium',
    titleFontWeight: 'medium',
    priceFontSize: 'medium',

    // Display Options
    showBrand: true,
    showRating: true,
    showSalePercent: true,
    showStock: false,
    showSku: false,

    // Hover Effects
    hoverEffect: 'lift',

    // Spacing
    cardGap: 16,
    cardPadding: 12,
    cardBorderRadius: 12,
};

export default function ProductCardSettings({ config, onChange }: ProductCardSettingsProps) {
    const productCard = { ...defaultProductCardConfig, ...config.productCard };

    const handleChange = (key: keyof ProductCardConfig, value: any) => {
        onChange({
            ...config,
            productCard: {
                ...productCard,
                [key]: value,
            },
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>
                Product Card Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure how product cards appear throughout your store.
            </Typography>

            {/* Card Design */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Card Design</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label="Card Style"
                            value={productCard.cardStyle}
                            onChange={(e) => handleChange('cardStyle', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="default">Default</MenuItem>
                            <MenuItem value="minimal">Minimal</MenuItem>
                            <MenuItem value="overlay">Overlay</MenuItem>
                            <MenuItem value="horizontal">Horizontal</MenuItem>
                            <MenuItem value="bordered">Bordered</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Hover Effect"
                            value={productCard.hoverEffect}
                            onChange={(e) => handleChange('hoverEffect', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="none">None</MenuItem>
                            <MenuItem value="zoom">Zoom</MenuItem>
                            <MenuItem value="lift">Lift</MenuItem>
                            <MenuItem value="shadow">Shadow</MenuItem>
                            <MenuItem value="overlay">Overlay</MenuItem>
                        </TextField>

                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Border Radius: {productCard.cardBorderRadius}px
                            </Typography>
                            <Slider
                                value={productCard.cardBorderRadius}
                                onChange={(_, value) => handleChange('cardBorderRadius', value)}
                                min={0}
                                max={24}
                                step={2}
                                marks
                            />
                        </Box>

                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Card Padding: {productCard.cardPadding}px
                            </Typography>
                            <Slider
                                value={productCard.cardPadding}
                                onChange={(_, value) => handleChange('cardPadding', value)}
                                min={0}
                                max={32}
                                step={4}
                                marks
                            />
                        </Box>

                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Card Gap: {productCard.cardGap}px
                            </Typography>
                            <Slider
                                value={productCard.cardGap}
                                onChange={(_, value) => handleChange('cardGap', value)}
                                min={8}
                                max={32}
                                step={4}
                                marks
                            />
                        </Box>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Image Settings */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Image Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label="Image Aspect Ratio"
                            value={productCard.imageAspectRatio}
                            onChange={(e) => handleChange('imageAspectRatio', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="1:1">Square (1:1)</MenuItem>
                            <MenuItem value="3:4">Portrait (3:4)</MenuItem>
                            <MenuItem value="4:3">Landscape (4:3)</MenuItem>
                            <MenuItem value="16:9">Wide (16:9)</MenuItem>
                            <MenuItem value="auto">Auto</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Image Size"
                            value={productCard.imageSize}
                            onChange={(e) => handleChange('imageSize', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="small">Small</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="large">Large</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Image Fit"
                            value={productCard.imageFit}
                            onChange={(e) => handleChange('imageFit', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="cover">Cover</MenuItem>
                            <MenuItem value="contain">Contain</MenuItem>
                        </TextField>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={productCard.showImageHover}
                                    onChange={(e) => handleChange('showImageHover', e.target.checked)}
                                />
                            }
                            label="Show Image on Hover"
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Buttons & Actions */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Buttons & Actions</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Button Visibility
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={productCard.showAddToCart}
                                    onChange={(e) => handleChange('showAddToCart', e.target.checked)}
                                />
                            }
                            label="Show Add to Cart"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={productCard.showBuyNow}
                                    onChange={(e) => handleChange('showBuyNow', e.target.checked)}
                                />
                            }
                            label="Show Buy Now"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={productCard.showWishlist}
                                    onChange={(e) => handleChange('showWishlist', e.target.checked)}
                                />
                            }
                            label="Show Wishlist"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={productCard.showQuickView}
                                    onChange={(e) => handleChange('showQuickView', e.target.checked)}
                                />
                            }
                            label="Show Quick View"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={productCard.showCompare}
                                    onChange={(e) => handleChange('showCompare', e.target.checked)}
                                />
                            }
                            label="Show Compare"
                        />

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="subtitle2" color="text.secondary">
                            Button Styles
                        </Typography>

                        {productCard.showAddToCart && (
                            <TextField
                                select
                                label="Add to Cart Style"
                                value={productCard.addToCartStyle}
                                onChange={(e) => handleChange('addToCartStyle', e.target.value)}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="filled">Filled</MenuItem>
                                <MenuItem value="outlined">Outlined</MenuItem>
                                <MenuItem value="text">Text</MenuItem>
                                <MenuItem value="icon-only">Icon Only</MenuItem>
                            </TextField>
                        )}

                        {productCard.showBuyNow && (
                            <TextField
                                select
                                label="Buy Now Style"
                                value={productCard.buyNowStyle}
                                onChange={(e) => handleChange('buyNowStyle', e.target.value)}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="filled">Filled</MenuItem>
                                <MenuItem value="outlined">Outlined</MenuItem>
                                <MenuItem value="text">Text</MenuItem>
                            </TextField>
                        )}

                        {productCard.showWishlist && (
                            <TextField
                                select
                                label="Wishlist Position"
                                value={productCard.wishlistPosition}
                                onChange={(e) => handleChange('wishlistPosition', e.target.value)}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="top-right">Top Right</MenuItem>
                                <MenuItem value="top-left">Top Left</MenuItem>
                                <MenuItem value="bottom">Bottom</MenuItem>
                            </TextField>
                        )}

                        {productCard.showQuickView && (
                            <TextField
                                select
                                label="Quick View Position"
                                value={productCard.quickViewPosition}
                                onChange={(e) => handleChange('quickViewPosition', e.target.value)}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="overlay">In Overlay (Bottom)</MenuItem>
                                <MenuItem value="top-right">Top Right (Icon)</MenuItem>
                            </TextField>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Typography */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Typography</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label="Title Lines"
                            value={productCard.titleLines}
                            onChange={(e) => handleChange('titleLines', Number(e.target.value))}
                            fullWidth
                            size="small"
                            helperText="Number of lines before text is truncated"
                        >
                            <MenuItem value={1}>1 Line</MenuItem>
                            <MenuItem value={2}>2 Lines</MenuItem>
                            <MenuItem value={3}>3 Lines</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Title Font Size"
                            value={productCard.titleFontSize}
                            onChange={(e) => handleChange('titleFontSize', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="small">Small</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="large">Large</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Title Font Weight"
                            value={productCard.titleFontWeight}
                            onChange={(e) => handleChange('titleFontWeight', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="normal">Normal</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="semibold">Semibold</MenuItem>
                            <MenuItem value="bold">Bold</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Price Font Size"
                            value={productCard.priceFontSize}
                            onChange={(e) => handleChange('priceFontSize', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="small">Small</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="large">Large</MenuItem>
                        </TextField>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Display Options */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Display Options</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={productCard.showBrand}
                                    onChange={(e) => handleChange('showBrand', e.target.checked)}
                                />
                            }
                            label="Show Brand"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={productCard.showRating}
                                    onChange={(e) => handleChange('showRating', e.target.checked)}
                                />
                            }
                            label="Show Rating"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={productCard.showSalePercent}
                                    onChange={(e) => handleChange('showSalePercent', e.target.checked)}
                                />
                            }
                            label="Show Sale Percentage"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={productCard.showStock}
                                    onChange={(e) => handleChange('showStock', e.target.checked)}
                                />
                            }
                            label="Show Stock Status"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={productCard.showSku}
                                    onChange={(e) => handleChange('showSku', e.target.checked)}
                                />
                            }
                            label="Show SKU"
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
}
