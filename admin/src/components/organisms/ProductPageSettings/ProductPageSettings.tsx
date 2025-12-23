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
import { ThemeConfig, ProductPageConfig, DEFAULT_PRODUCT_PAGE_CONFIG } from '@/types';

interface ProductPageSettingsProps {
    config: ThemeConfig;
    onChange: (config: ThemeConfig) => void;
}

export default function ProductPageSettings({ config, onChange }: ProductPageSettingsProps) {
    const product = { ...DEFAULT_PRODUCT_PAGE_CONFIG, ...config.product };

    // Helper to handle nested updates
    const handleChange = <K extends keyof ProductPageConfig>(
        section: K,
        key: keyof NonNullable<ProductPageConfig[K]>,
        value: any
    ) => {
        onChange({
            ...config,
            product: {
                ...product,
                [section]: {
                    ...(product[section] as object),
                    [key]: value,
                },
            },
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>
                Product Page Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure how product pages appear throughout your store, including pricing display, gallery, specifications, and more.
            </Typography>

            {/* Pricing Settings */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Pricing Display</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.pricing?.showTaxIncluded ?? false}
                                    onChange={(e) => handleChange('pricing', 'showTaxIncluded', e.target.checked)}
                                />
                            }
                            label="Show 'Tax Included' Label"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, ml: 4 }}>
                            Display &quot;Incl. Tax&quot; next to prices when tax is included
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.pricing?.showPriceWithoutTax ?? false}
                                    onChange={(e) => handleChange('pricing', 'showPriceWithoutTax', e.target.checked)}
                                />
                            }
                            label="Show Price Without Tax"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, ml: 4 }}>
                            Display both tax-inclusive and tax-exclusive prices
                        </Typography>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Product Info Settings */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Product Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.info?.showSku ?? true}
                                    onChange={(e) => handleChange('info', 'showSku', e.target.checked)}
                                />
                            }
                            label="Show SKU"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.info?.showBrand ?? true}
                                    onChange={(e) => handleChange('info', 'showBrand', e.target.checked)}
                                />
                            }
                            label="Show Brand"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.info?.showStock ?? true}
                                    onChange={(e) => handleChange('info', 'showStock', e.target.checked)}
                                />
                            }
                            label="Show Stock Status"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.info?.showShortDescription ?? true}
                                    onChange={(e) => handleChange('info', 'showShortDescription', e.target.checked)}
                                />
                            }
                            label="Show Short Description"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.info?.showSocialShare ?? false}
                                    onChange={(e) => handleChange('info', 'showSocialShare', e.target.checked)}
                                />
                            }
                            label="Show Social Share Buttons"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.info?.showReviews ?? true}
                                    onChange={(e) => handleChange('info', 'showReviews', e.target.checked)}
                                />
                            }
                            label="Show Reviews Section"
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Gallery Settings */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Image Gallery</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label="Gallery Layout"
                            value={product.gallery?.layout ?? 'thumbnails-left'}
                            onChange={(e) => handleChange('gallery', 'layout', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="thumbnails-left">Thumbnails Left</MenuItem>
                            <MenuItem value="thumbnails-bottom">Thumbnails Bottom</MenuItem>
                            <MenuItem value="carousel">Carousel</MenuItem>
                            <MenuItem value="grid">Grid</MenuItem>
                        </TextField>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.gallery?.enableZoom ?? true}
                                    onChange={(e) => handleChange('gallery', 'enableZoom', e.target.checked)}
                                />
                            }
                            label="Enable Image Zoom"
                        />

                        {product.gallery?.enableZoom && (
                            <TextField
                                select
                                label="Zoom Type"
                                value={product.gallery?.zoomType ?? 'hover'}
                                onChange={(e) => handleChange('gallery', 'zoomType', e.target.value)}
                                fullWidth
                                size="small"
                                sx={{ ml: 4 }}
                            >
                                <MenuItem value="hover">Hover Zoom</MenuItem>
                                <MenuItem value="magnify">Magnifying Glass</MenuItem>
                                <MenuItem value="lightbox-only">Lightbox Only</MenuItem>
                            </TextField>
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.gallery?.enableLightbox ?? true}
                                    onChange={(e) => handleChange('gallery', 'enableLightbox', e.target.checked)}
                                />
                            }
                            label="Enable Lightbox"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.gallery?.showVideoGallery ?? true}
                                    onChange={(e) => handleChange('gallery', 'showVideoGallery', e.target.checked)}
                                />
                            }
                            label="Show Video Gallery"
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Specifications Settings */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Specifications</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.specifications?.show ?? true}
                                    onChange={(e) => handleChange('specifications', 'show', e.target.checked)}
                                />
                            }
                            label="Show Specifications"
                        />

                        {product.specifications?.show && (
                            <TextField
                                select
                                label="Specifications Layout"
                                value={product.specifications?.layout ?? 'tab'}
                                onChange={(e) => handleChange('specifications', 'layout', e.target.value)}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="tab">In Tabs Section</MenuItem>
                                <MenuItem value="list">As List Below Description</MenuItem>
                            </TextField>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Variant Display Settings */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Variant Display</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label="Variant Selector Style"
                            value={product.variants?.style ?? 'buttons'}
                            onChange={(e) => handleChange('variants', 'style', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="buttons">Buttons</MenuItem>
                            <MenuItem value="dropdown">Dropdown</MenuItem>
                            <MenuItem value="swatches">Color Swatches</MenuItem>
                        </TextField>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.variants?.showUnavailable ?? true}
                                    onChange={(e) => handleChange('variants', 'showUnavailable', e.target.checked)}
                                />
                            }
                            label="Show Unavailable Options (Crossed Out)"
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Tabs Settings */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Content Tabs</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label="Tabs Layout"
                            value={product.tabs?.layout ?? 'tabs'}
                            onChange={(e) => handleChange('tabs', 'layout', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="tabs">Horizontal Tabs</MenuItem>
                            <MenuItem value="accordion">Accordion</MenuItem>
                            <MenuItem value="sections">Stacked Sections</MenuItem>
                        </TextField>

                        <Divider />

                        <Typography variant="subtitle2" color="text.secondary">
                            Visible Tabs
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.tabs?.showDescription ?? true}
                                    onChange={(e) => handleChange('tabs', 'showDescription', e.target.checked)}
                                />
                            }
                            label="Description Tab"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.tabs?.showSpecifications ?? true}
                                    onChange={(e) => handleChange('tabs', 'showSpecifications', e.target.checked)}
                                />
                            }
                            label="Specifications Tab"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.tabs?.showReviews ?? true}
                                    onChange={(e) => handleChange('tabs', 'showReviews', e.target.checked)}
                                />
                            }
                            label="Reviews Tab"
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Shipping Calculator Settings */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Shipping Calculator</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={product.shipping?.showCalculator ?? false}
                                    onChange={(e) => handleChange('shipping', 'showCalculator', e.target.checked)}
                                />
                            }
                            label="Show Shipping Calculator"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, ml: 4 }}>
                            Allow customers to estimate shipping costs before adding to cart
                        </Typography>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
}
