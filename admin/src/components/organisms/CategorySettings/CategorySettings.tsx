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
    Chip,
    FormGroup,
    Alert,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { ThemeConfig, CategoryConfig, DEFAULT_CATEGORY_CONFIG } from '@/types';

interface CategorySettingsProps {
    config: ThemeConfig;
    onChange: (config: ThemeConfig) => void;
}

export default function CategorySettings({ config, onChange }: CategorySettingsProps) {
    const category = { ...DEFAULT_CATEGORY_CONFIG, ...config.category };

    // Helper to handle nested updates
    const handleChange = <K extends keyof CategoryConfig>(
        section: K,
        key: keyof CategoryConfig[K],
        value: any
    ) => {
        onChange({
            ...config,
            category: {
                ...category,
                [section]: {
                    ...category[section],
                    [key]: value,
                },
            },
        });
    };

    // Helper for deeply nested updates (like grid.productsPerRow)
    const handleNestedChange = <K extends keyof CategoryConfig>(
        section: K,
        key: keyof CategoryConfig[K],
        nestedKey: string,
        value: any
    ) => {
        const sectionData = category[section] as any;
        onChange({
            ...config,
            category: {
                ...category,
                [section]: {
                    ...sectionData,
                    [key]: {
                        ...sectionData[key],
                        [nestedKey]: value,
                    },
                },
            },
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>
                Category Page Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure how category pages appear throughout your store, including filters, product grid, and pagination.
            </Typography>

            {/* Header Settings */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Category Header</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={category.header.showImage}
                                    onChange={(e) => handleChange('header', 'showImage', e.target.checked)}
                                />
                            }
                            label="Show Category Image"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={category.header.showDescription}
                                    onChange={(e) => handleChange('header', 'showDescription', e.target.checked)}
                                />
                            }
                            label="Show Category Description"
                        />

                        {category.header.showDescription && (
                            <>
                                <TextField
                                    select
                                    label="Description Position"
                                    value={category.header.descriptionPosition}
                                    onChange={(e) => handleChange('header', 'descriptionPosition', e.target.value)}
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="top">Above Image</MenuItem>
                                    <MenuItem value="below-image">Below Image</MenuItem>
                                    <MenuItem value="bottom">Bottom</MenuItem>
                                </TextField>

                                <TextField
                                    select
                                    label="Description Style"
                                    value={category.header.descriptionStyle}
                                    onChange={(e) => handleChange('header', 'descriptionStyle', e.target.value)}
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="expanded">Always Expanded</MenuItem>
                                    <MenuItem value="collapsed">Collapsible</MenuItem>
                                </TextField>

                                {category.header.descriptionStyle === 'collapsed' && (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            label="Expand Label"
                                            value={category.header.expandLabel}
                                            onChange={(e) => handleChange('header', 'expandLabel', e.target.value)}
                                            size="small"
                                            fullWidth
                                        />
                                        <TextField
                                            label="Collapse Label"
                                            value={category.header.collapseLabel}
                                            onChange={(e) => handleChange('header', 'collapseLabel', e.target.value)}
                                            size="small"
                                            fullWidth
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Product Grid Settings */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Product Grid</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Products Per Page: {category.grid.productsPerPage}
                            </Typography>
                            <Slider
                                value={category.grid.productsPerPage}
                                onChange={(_, value) => handleChange('grid', 'productsPerPage', value as number)}
                                min={8}
                                max={48}
                                step={4}
                                marks={[
                                    { value: 8, label: '8' },
                                    { value: 16, label: '16' },
                                    { value: 24, label: '24' },
                                    { value: 36, label: '36' },
                                    { value: 48, label: '48' },
                                ]}
                            />
                        </Box>

                        <Divider />

                        <Typography variant="subtitle2" color="text.secondary">
                            Products Per Row
                        </Typography>

                        <TextField
                            select
                            label="Desktop (1200px+)"
                            value={category.grid.productsPerRow.desktop}
                            onChange={(e) => handleNestedChange('grid', 'productsPerRow', 'desktop', Number(e.target.value))}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value={3}>3 Products</MenuItem>
                            <MenuItem value={4}>4 Products</MenuItem>
                            <MenuItem value={5}>5 Products</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Tablet (768px - 1199px)"
                            value={category.grid.productsPerRow.tablet}
                            onChange={(e) => handleNestedChange('grid', 'productsPerRow', 'tablet', Number(e.target.value))}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value={2}>2 Products</MenuItem>
                            <MenuItem value={3}>3 Products</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Mobile (<768px)"
                            value={category.grid.productsPerRow.mobile}
                            onChange={(e) => handleNestedChange('grid', 'productsPerRow', 'mobile', Number(e.target.value))}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value={1}>1 Product</MenuItem>
                            <MenuItem value={2}>2 Products</MenuItem>
                        </TextField>

                        <Divider />

                        <TextField
                            select
                            label="Card Style"
                            value={category.grid.cardStyle}
                            onChange={(e) => handleChange('grid', 'cardStyle', e.target.value)}
                            fullWidth
                            size="small"
                            helperText="Overrides global product card style on category pages"
                        >
                            <MenuItem value="default">Default (Use Global)</MenuItem>
                            <MenuItem value="compact">Compact</MenuItem>
                            <MenuItem value="detailed">Detailed</MenuItem>
                        </TextField>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Sorting Settings */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Sorting</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={category.sorting.showSortDropdown}
                                    onChange={(e) => handleChange('sorting', 'showSortDropdown', e.target.checked)}
                                />
                            }
                            label="Show Sort Dropdown"
                        />

                        <TextField
                            select
                            label="Default Sort Order"
                            value={category.sorting.defaultSort}
                            onChange={(e) => handleChange('sorting', 'defaultSort', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="featured">Featured</MenuItem>
                            <MenuItem value="newest">Newest</MenuItem>
                            <MenuItem value="oldest">Oldest</MenuItem>
                            <MenuItem value="price-low">Price: Low to High</MenuItem>
                            <MenuItem value="price-high">Price: High to Low</MenuItem>
                            <MenuItem value="alphabetical">Alphabetical (A-Z)</MenuItem>
                            <MenuItem value="bestselling">Best Selling</MenuItem>
                        </TextField>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Pagination Settings */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Pagination</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label="Pagination Type"
                            value={category.pagination.type}
                            onChange={(e) => handleChange('pagination', 'type', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="pagination">Standard Pagination</MenuItem>
                            <MenuItem value="load-more">Load More Button</MenuItem>
                            <MenuItem value="infinite-scroll">Infinite Scroll</MenuItem>
                        </TextField>

                        {category.pagination.type === 'pagination' && (
                            <TextField
                                select
                                label="Pagination Position"
                                value={category.pagination.position}
                                onChange={(e) => handleChange('pagination', 'position', e.target.value)}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="left">Left</MenuItem>
                                <MenuItem value="center">Center</MenuItem>
                                <MenuItem value="right">Right</MenuItem>
                            </TextField>
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={category.pagination.showProductCount}
                                    onChange={(e) => handleChange('pagination', 'showProductCount', e.target.checked)}
                                />
                            }
                            label="Show Product Count (e.g., 'Showing 1-24 of 120')"
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Filter Settings */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Filters</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={category.filters.enabled}
                                    onChange={(e) => handleChange('filters', 'enabled', e.target.checked)}
                                />
                            }
                            label="Enable Filters"
                        />

                        {category.filters.enabled && (
                            <>
                                <TextField
                                    select
                                    label="Filter Position"
                                    value={category.filters.position}
                                    onChange={(e) => handleChange('filters', 'position', e.target.value)}
                                    fullWidth
                                    size="small"
                                    helperText="Left/Right positions enable split-column layout in Layout Designer"
                                >
                                    <MenuItem value="left">Left Sidebar</MenuItem>
                                    <MenuItem value="right">Right Sidebar</MenuItem>
                                    <MenuItem value="top">Top (Horizontal)</MenuItem>
                                    <MenuItem value="off-canvas">Off-Canvas (Mobile Style)</MenuItem>
                                </TextField>

                                {/* Off-canvas warning and settings */}
                                {category.filters.position === 'off-canvas' && (
                                    <>
                                        <Alert severity="warning">
                                            Off-canvas filters cannot be customized in the Layout Designer. Configure the drawer settings below instead.
                                        </Alert>

                                        <TextField
                                            select
                                            label="Slide From"
                                            value={category.filters.offCanvas?.slideFrom || 'left'}
                                            onChange={(e) => handleNestedChange('filters', 'offCanvas', 'slideFrom', e.target.value)}
                                            fullWidth
                                            size="small"
                                        >
                                            <MenuItem value="left">Left</MenuItem>
                                            <MenuItem value="right">Right</MenuItem>
                                        </TextField>

                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Drawer Width: {category.filters.offCanvas?.drawerWidth || 320}px
                                            </Typography>
                                            <Slider
                                                value={category.filters.offCanvas?.drawerWidth || 320}
                                                onChange={(_, value) => handleNestedChange('filters', 'offCanvas', 'drawerWidth', value as number)}
                                                min={280}
                                                max={400}
                                                step={20}
                                                marks={[
                                                    { value: 280, label: '280' },
                                                    { value: 320, label: '320' },
                                                    { value: 360, label: '360' },
                                                    { value: 400, label: '400' },
                                                ]}
                                            />
                                        </Box>

                                        <TextField
                                            label="Filter Button Text"
                                            value={category.filters.offCanvas?.buttonText || 'Filters'}
                                            onChange={(e) => handleNestedChange('filters', 'offCanvas', 'buttonText', e.target.value)}
                                            fullWidth
                                            size="small"
                                            placeholder="Filters"
                                        />

                                        <TextField
                                            select
                                            label="Button Position"
                                            value={category.filters.offCanvas?.buttonPosition || 'left'}
                                            onChange={(e) => handleNestedChange('filters', 'offCanvas', 'buttonPosition', e.target.value)}
                                            fullWidth
                                            size="small"
                                        >
                                            <MenuItem value="left">Left</MenuItem>
                                            <MenuItem value="right">Right</MenuItem>
                                        </TextField>

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={category.filters.offCanvas?.showFilterCount ?? true}
                                                    onChange={(e) => handleNestedChange('filters', 'offCanvas', 'showFilterCount', e.target.checked)}
                                                />
                                            }
                                            label="Show Active Filter Count (e.g., 'Filters (3)')"
                                        />
                                    </>
                                )}

                                {(category.filters.position === 'left' || category.filters.position === 'right') && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Sidebar Width: {category.filters.sidebarWidth}px
                                        </Typography>
                                        <Slider
                                            value={category.filters.sidebarWidth}
                                            onChange={(_, value) => handleChange('filters', 'sidebarWidth', value as number)}
                                            min={200}
                                            max={400}
                                            step={20}
                                            marks={[
                                                { value: 200, label: '200' },
                                                { value: 280, label: '280' },
                                                { value: 350, label: '350' },
                                                { value: 400, label: '400' },
                                            ]}
                                        />
                                    </Box>
                                )}

                                <TextField
                                    select
                                    label="Filter Style"
                                    value={category.filters.style}
                                    onChange={(e) => handleChange('filters', 'style', e.target.value)}
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="sticky">Sticky (Stays on Scroll)</MenuItem>
                                    <MenuItem value="static">Static</MenuItem>
                                </TextField>

                                <TextField
                                    select
                                    label="Default State"
                                    value={category.filters.defaultState}
                                    onChange={(e) => handleChange('filters', 'defaultState', e.target.value)}
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="expanded">All Expanded</MenuItem>
                                    <MenuItem value="collapsed">All Collapsed</MenuItem>
                                </TextField>

                                <Divider />

                                <Typography variant="subtitle2" color="text.secondary">
                                    Enabled Filter Types
                                </Typography>

                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={category.filters.showPriceRange}
                                                onChange={(e) => handleChange('filters', 'showPriceRange', e.target.checked)}
                                            />
                                        }
                                        label="Price Range"
                                    />

                                    {category.filters.showPriceRange && (
                                        <Box sx={{ ml: 4, mt: 1, mb: 2 }}>
                                            <TextField
                                                select
                                                label="Price Range Style"
                                                value={category.filters.priceRangeStyle}
                                                onChange={(e) => handleChange('filters', 'priceRangeStyle', e.target.value)}
                                                fullWidth
                                                size="small"
                                            >
                                                <MenuItem value="slider">Slider</MenuItem>
                                                <MenuItem value="input">Min/Max Inputs</MenuItem>
                                                <MenuItem value="range-buttons">Range Buttons</MenuItem>
                                            </TextField>
                                        </Box>
                                    )}

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={category.filters.showCategoryFilter}
                                                onChange={(e) => handleChange('filters', 'showCategoryFilter', e.target.checked)}
                                            />
                                        }
                                        label="Subcategories"
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={category.filters.showAttributeFilters}
                                                onChange={(e) => handleChange('filters', 'showAttributeFilters', e.target.checked)}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                Attribute Filters
                                                <Chip label="Auto-generated" size="small" variant="outlined" />
                                            </Box>
                                        }
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={category.filters.showBrandFilter}
                                                onChange={(e) => handleChange('filters', 'showBrandFilter', e.target.checked)}
                                            />
                                        }
                                        label="Brand"
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={category.filters.showTagFilter}
                                                onChange={(e) => handleChange('filters', 'showTagFilter', e.target.checked)}
                                            />
                                        }
                                        label="Tags"
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={category.filters.showRatingFilter}
                                                onChange={(e) => handleChange('filters', 'showRatingFilter', e.target.checked)}
                                            />
                                        }
                                        label="Rating"
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={category.filters.showAvailabilityFilter}
                                                onChange={(e) => handleChange('filters', 'showAvailabilityFilter', e.target.checked)}
                                            />
                                        }
                                        label="Availability (In Stock / Out of Stock)"
                                    />
                                </FormGroup>

                                <Alert severity="info" sx={{ mt: 1 }}>
                                    Attribute filters are auto-generated from product attributes marked as &quot;Filterable&quot; in your Attributes settings.
                                </Alert>
                            </>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Subcategory Display */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Subcategory Display</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label="Display Mode"
                            value={category.subcategories.display}
                            onChange={(e) => handleChange('subcategories', 'display', e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="none">Don&apos;t Show</MenuItem>
                            <MenuItem value="filter">In Filter Sidebar Only</MenuItem>
                            <MenuItem value="cards">As Cards Above Products</MenuItem>
                            <MenuItem value="both">Both (Sidebar + Cards)</MenuItem>
                        </TextField>

                        {(category.subcategories.display === 'cards' || category.subcategories.display === 'both') && (
                            <>
                                <TextField
                                    select
                                    label="Card Style"
                                    value={category.subcategories.cardStyle}
                                    onChange={(e) => handleChange('subcategories', 'cardStyle', e.target.value)}
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="image">With Image</MenuItem>
                                    <MenuItem value="minimal">Minimal (Text Only)</MenuItem>
                                </TextField>

                                <TextField
                                    select
                                    label="Position"
                                    value={category.subcategories.position}
                                    onChange={(e) => handleChange('subcategories', 'position', e.target.value)}
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="above-products">Above Product Grid</MenuItem>
                                    <MenuItem value="sidebar">In Sidebar (Above Filters)</MenuItem>
                                </TextField>
                            </>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Empty State */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Empty State</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="No Products Message"
                            value={category.emptyState.message}
                            onChange={(e) => handleChange('emptyState', 'message', e.target.value)}
                            fullWidth
                            size="small"
                            placeholder="No products found"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={category.emptyState.showClearFilters}
                                    onChange={(e) => handleChange('emptyState', 'showClearFilters', e.target.checked)}
                                />
                            }
                            label="Show 'Clear Filters' Button"
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* SEO Settings */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>SEO</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={category.seo.indexFilteredPages}
                                    onChange={(e) => handleChange('seo', 'indexFilteredPages', e.target.checked)}
                                />
                            }
                            label="Index Filtered Pages"
                        />
                        <Typography variant="caption" color="text.secondary">
                            When enabled, filtered URLs (e.g., /category/shoes?color=red) will be indexable by search engines.
                            Disable to prevent duplicate content issues.
                        </Typography>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
}
