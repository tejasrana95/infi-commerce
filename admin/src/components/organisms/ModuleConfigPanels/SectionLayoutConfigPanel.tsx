'use client';

import {
    Box,
    TextField,
    Typography,
    MenuItem,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { ColorPicker } from '@/components/atoms';
import { LayoutModule, ModuleType } from '@/types';
import { AVAILABLE_MODULES, createModule, getModuleDefinition } from '../LayoutDesigner/types';
import FormModuleEditor from '../LayoutDesigner/ModuleEditors/FormModuleEditor';
import ModuleStylingTab from '../LayoutDesigner/ModuleStylingTab';

// Import config panels
import {
    TextBlockConfigPanel,
    ImageConfigPanel,
    ImageGalleryConfigPanel,
    VideoConfigPanel,
    SpacerConfigPanel,
    DividerConfigPanel,
    HTMLConfigPanel,
    BannerConfigPanel,
    BannerSliderConfigPanel,
    HeroSliderConfigPanel,
    HeroBannerConfigPanel,
    TestimonialsConfigPanel,
    BrandLogosConfigPanel,
    ProductCollectionConfigPanel,
    CategoryShowcaseConfigPanel,
    RelatedProductsConfigPanel,
    RecentlyViewedConfigPanel,
    PersonalizedProductsConfigPanel,
    CTAConfigPanel,
    StripBannerConfigPanel,
    CardGroupConfigPanel,
    IconBoxConfigPanel,
    IconGroupConfigPanel,
    PricingTableConfigPanel,
    AccordionConfigPanel,
    HeadingConfigPanel,
    NumberBoxConfigPanel,
    FlipBoxConfigPanel,
    ProgressBarConfigPanel,
    MarqueeConfigPanel,
    IconConfigPanel,
    TableConfigPanel,
    ContentCardGridConfigPanel,
    IconListConfigPanel,
    CategoryHeaderConfigPanel,
    BlogGridConfigPanel,
    BlogCategoriesSidebarConfigPanel,
    RecentPostsConfigPanel,
    PopularPostsConfigPanel,
    TagsCloudConfigPanel,
    NewsletterSignupConfigPanel,
    AuthorCardConfigPanel,
    PageContentConfigPanel,
    PageHeroConfigPanel,
    CheckoutContentConfigPanel
} from './index';

export interface SectionLayoutConfig {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderStyle: 'none' | 'solid' | 'dashed' | 'dotted';
    borderRadius: number;
    paddingTop: number;
    paddingBottom: number;
    paddingLeft: number;
    paddingRight: number;
    gap?: number;
    modules: LayoutModule[];
}

interface SectionLayoutConfigPanelProps {
    config: SectionLayoutConfig;
    onChange: (config: SectionLayoutConfig) => void;
    storeId?: string;
}

export const defaultSectionLayoutConfig: SectionLayoutConfig = {
    backgroundColor: 'transparent',
    borderColor: '#e5e7eb',
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: 8,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    gap: 24,
    modules: []
};

export default function SectionLayoutConfigPanel({ config, onChange, storeId }: SectionLayoutConfigPanelProps) {
    const [editingModule, setEditingModule] = useState<LayoutModule | null>(null);
    const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null);
    const [dialogTab, setDialogTab] = useState(0);
    const [selectedNewType, setSelectedNewType] = useState<ModuleType | ''>('');

    type SectionConfigValue = string | number | boolean | LayoutModule[] | undefined;

    const handleChange = (key: keyof SectionLayoutConfig, value: SectionConfigValue) => {
        onChange({ ...config, [key]: value });
    };

    // Filter eligible modules for nesting (no section-layouts to avoid recursion, and no page placeholder modules)
    const nestableModules = AVAILABLE_MODULES.filter(
        m => m.type !== 'section-layout' && 
             m.category !== 'placeholder' && 
             m.category !== 'account'
    );

    const handleAddModule = () => {
        if (!selectedNewType) return;
        const newMod = createModule(selectedNewType);
        const updatedModules = [...(config.modules || []), newMod];
        handleChange('modules', updatedModules);
        setSelectedNewType('');
    };

    const handleMoveModule = (index: number, direction: 'up' | 'down') => {
        const modules = [...(config.modules || [])];
        if (direction === 'up' && index > 0) {
            const temp = modules[index];
            modules[index] = modules[index - 1];
            modules[index - 1] = temp;
        } else if (direction === 'down' && index < modules.length - 1) {
            const temp = modules[index];
            modules[index] = modules[index + 1];
            modules[index + 1] = temp;
        }
        // Update order field in modules
        const reordered = modules.map((m, idx) => ({ ...m, order: idx }));
        handleChange('modules', reordered);
    };

    const handleDeleteModule = (index: number) => {
        const updated = (config.modules || []).filter((_, idx) => idx !== index);
        handleChange('modules', updated);
    };

    const handleOpenEditDialog = (module: LayoutModule, index: number) => {
        setEditingModule(JSON.parse(JSON.stringify(module))); // Deep copy
        setEditingModuleIndex(index);
        setDialogTab(0);
    };

    const handleSaveNestedModule = () => {
        if (editingModuleIndex === null || !editingModule) return;
        const updatedModules = [...(config.modules || [])];
        updatedModules[editingModuleIndex] = editingModule;
        handleChange('modules', updatedModules);
        setEditingModule(null);
        setEditingModuleIndex(null);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- config shapes vary per module type
    const handleUpdateNestedConfig = (nestedConfig: Record<string, any>) => {
        if (!editingModule) return;
        setEditingModule({
            ...editingModule,
            config: nestedConfig
        });
    };

    const handleUpdateNestedStyling = (key: string, value: string | number | undefined) => {
        if (!editingModule) return;
        setEditingModule({
            ...editingModule,
            styling: {
                ...editingModule.styling,
                [key]: value
            }
        });
    };

    // Render nested module content editing panel (matches the parent ModuleEditor switch)
    /* eslint-disable @typescript-eslint/no-explicit-any -- config subtypes vary per module; LayoutModule.config is Record<string, any> */
    const renderNestedConfigPanel = () => {
        if (!editingModule) return null;
        
        switch (editingModule.type) {
            case 'text-block':
                return <TextBlockConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'image':
                return <ImageConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'image-gallery':
                return <ImageGalleryConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'video':
                return <VideoConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'spacer':
                return <SpacerConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'divider':
                return <DividerConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'html':
                return <HTMLConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'banner':
                return <BannerConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'banner-slider':
                return <BannerSliderConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'hero-slider':
                return <HeroSliderConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'hero-banner':
                return <HeroBannerConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'testimonials':
                return <TestimonialsConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'brand-logos':
                return <BrandLogosConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'product-carousel':
            case 'product-grid':
                return <ProductCollectionConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'category-showcase':
                return <CategoryShowcaseConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'category-header':
                return <CategoryHeaderConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'related-products':
                return <RelatedProductsConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'recently-viewed':
                return <RecentlyViewedConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'personalized-products':
                return <PersonalizedProductsConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'blog-grid':
            case 'blog-listing':
                return <BlogGridConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'blog-categories-sidebar':
                return <BlogCategoriesSidebarConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'recent-posts':
                return <RecentPostsConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'popular-posts':
                return <PopularPostsConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'tags-cloud':
                return <TagsCloudConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'newsletter-signup':
                return <NewsletterSignupConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'author-card':
                return <AuthorCardConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'page-content':
                return <PageContentConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'page-hero':
                return <PageHeroConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'checkout-content':
                return <CheckoutContentConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'cta-button':
                return <CTAConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'strip-banner':
                return <StripBannerConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'icon-box':
                return <IconBoxConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'icon-group':
                return <IconGroupConfigPanel config={editingModule.config} onChange={handleUpdateNestedConfig} />;
            case 'pricing-table':
                return <PricingTableConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'accordion':
                return <AccordionConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'heading':
                return <HeadingConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'card-group':
                return <CardGroupConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'number-box':
                return <NumberBoxConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'flip-box':
                return <FlipBoxConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'progress-bar':
                return <ProgressBarConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'marquee':
                return <MarqueeConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'icon':
                return <IconConfigPanel module={editingModule} onChange={setEditingModule} />;
            case 'table':
                return <TableConfigPanel module={editingModule} onChange={setEditingModule} />;
            case 'content-card-grid':
                return <ContentCardGridConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'icon-list':
                return <IconListConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} />;
            case 'form':
                return <FormModuleEditor module={editingModule} onChange={setEditingModule} />;
            default:
                return (
                    <Typography variant="body2" color="text.secondary">
                        Editing not supported for this module type here.
                    </Typography>
                );
        }
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* ── Colors ──────────────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                    Colors
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <ColorPicker
                        label="Background"
                        value={config.backgroundColor || 'transparent'}
                        onChange={(color) => handleChange('backgroundColor', color)}
                    />
                    <ColorPicker
                        label="Border"
                        value={config.borderColor || '#e5e7eb'}
                        onChange={(color) => handleChange('borderColor', color)}
                    />
                </Box>
            </Paper>

            {/* ── Border & Radius ─────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                    Border & Radius
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField
                        select
                        label="Style"
                        value={config.borderStyle || 'none'}
                        onChange={(e) => handleChange('borderStyle', e.target.value)}
                        fullWidth
                        size="small"
                    >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="solid">Solid</MenuItem>
                        <MenuItem value="dashed">Dashed</MenuItem>
                        <MenuItem value="dotted">Dotted</MenuItem>
                    </TextField>

                    <TextField
                        label="Width (px)"
                        type="number"
                        value={config.borderWidth ?? ''}
                        onChange={(e) => {
                            const raw = e.target.value;
                            handleChange('borderWidth', raw === '' ? 0 : Number.parseInt(raw, 10) || 0);
                        }}
                        fullWidth
                        size="small"
                        slotProps={{ htmlInput: { min: 0, max: 20 } }}
                        disabled={config.borderStyle === 'none'}
                    />

                    <TextField
                        label="Radius (px)"
                        type="number"
                        value={config.borderRadius ?? ''}
                        onChange={(e) => {
                            const raw = e.target.value;
                            handleChange('borderRadius', raw === '' ? 0 : Number.parseInt(raw, 10) || 0);
                        }}
                        fullWidth
                        size="small"
                        slotProps={{ htmlInput: { min: 0, max: 40 } }}
                    />
                </Box>
            </Paper>

            {/* ── Spacing ─────────────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                    Spacing
                </Typography>

                {/* Padding */}
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Padding
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2.5 }}>
                    <TextField
                        label="Top"
                        type="number"
                        value={config.paddingTop ?? ''}
                        onChange={(e) => {
                            const raw = e.target.value;
                            handleChange('paddingTop', raw === '' ? 0 : Number.parseInt(raw, 10) || 0);
                        }}
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { min: 0, max: 100 } }}
                    />
                    <TextField
                        label="Right"
                        type="number"
                        value={config.paddingRight ?? ''}
                        onChange={(e) => {
                            const raw = e.target.value;
                            handleChange('paddingRight', raw === '' ? 0 : Number.parseInt(raw, 10) || 0);
                        }}
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { min: 0, max: 100 } }}
                    />
                    <TextField
                        label="Bottom"
                        type="number"
                        value={config.paddingBottom ?? ''}
                        onChange={(e) => {
                            const raw = e.target.value;
                            handleChange('paddingBottom', raw === '' ? 0 : Number.parseInt(raw, 10) || 0);
                        }}
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { min: 0, max: 100 } }}
                    />
                    <TextField
                        label="Left"
                        type="number"
                        value={config.paddingLeft ?? ''}
                        onChange={(e) => {
                            const raw = e.target.value;
                            handleChange('paddingLeft', raw === '' ? 0 : Number.parseInt(raw, 10) || 0);
                        }}
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { min: 0, max: 100 } }}
                    />
                </Box>

                <Divider sx={{ mb: 2.5 }} />

                {/* Gap */}
                <Box sx={{ maxWidth: '25%' }}>
                    <TextField
                        label="Gap (px)"
                        type="number"
                        value={config.gap ?? ''}
                        onChange={(e) => {
                            const raw = e.target.value;
                            handleChange('gap', raw === '' ? 0 : Number.parseInt(raw, 10) || 0);
                        }}
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { min: 0, max: 80 } }}
                    />
                </Box>
            </Paper>

            {/* ── Nested Modules ──────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                    Nested Modules
                </Typography>

                {/* Add Module Row */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                        select
                        label="Select Module to Add"
                        value={selectedNewType}
                        onChange={(e) => setSelectedNewType(e.target.value as ModuleType)}
                        fullWidth
                        size="small"
                    >
                        {nestableModules.map((m) => (
                            <MenuItem key={m.type} value={m.type}>
                                {m.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button
                        variant="contained"
                        onClick={handleAddModule}
                        disabled={!selectedNewType}
                        sx={{ minWidth: 48, p: 0 }}
                    >
                        <AddIcon />
                    </Button>
                </Box>

                {/* Module List */}
                <Paper variant="outlined">
                    {(config.modules || []).length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                No nested modules yet
                            </Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {(config.modules || []).map((module, index) => {
                                const definition = getModuleDefinition(module.type);
                                return (
                                    <ListItem
                                        key={module.id}
                                        divider={index < (config.modules || []).length - 1}
                                        sx={{ py: 1 }}
                                    >
                                        <ListItemText
                                            primary={definition?.label || module.type}
                                            secondary={module.type}
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleMoveModule(index, 'up')}
                                                disabled={index === 0}
                                            >
                                                <ArrowUpwardIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleMoveModule(index, 'down')}
                                                disabled={index === (config.modules || []).length - 1}
                                            >
                                                <ArrowDownwardIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenEditDialog(module, index)}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteModule(index)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </Paper>
            </Paper>

            {/* ── Edit Dialog ─────────────────────────────────────────── */}
            <Dialog
                open={editingModule !== null}
                onClose={() => setEditingModule(null)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ pb: 1 }}>
                    Edit Nested Module: {editingModule && (getModuleDefinition(editingModule.type)?.label || editingModule.type)}
                </DialogTitle>
                <DialogContent dividers sx={{ p: 2 }}>
                    {editingModule && (
                        <Box>
                            <Tabs
                                value={dialogTab}
                                onChange={(_, v) => setDialogTab(v)}
                                variant="fullWidth"
                                sx={{ mb: 2 }}
                            >
                                <Tab label="Content" />
                                <Tab label="Styling" />
                            </Tabs>

                            {dialogTab === 0 && (
                                <Box sx={{ pt: 1 }}>
                                    {renderNestedConfigPanel()}
                                </Box>
                            )}

                            {dialogTab === 1 && (
                                <Box sx={{ pt: 1 }}>
                                    <ModuleStylingTab styling={editingModule.styling} onChange={handleUpdateNestedStyling} />
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingModule(null)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveNestedModule} color="primary">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
