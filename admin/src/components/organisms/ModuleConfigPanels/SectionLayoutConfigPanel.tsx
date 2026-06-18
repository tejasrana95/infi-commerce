'use client';

import {
    Box,
    TextField,
    Typography,
    Slider,
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
    Stack,
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
import { LayoutModule } from '@/types';
import { AVAILABLE_MODULES, createModule, getModuleDefinition } from '../LayoutDesigner/types';

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
    IconListConfigPanel
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
    const [selectedNewType, setSelectedNewType] = useState<string>('');

    const handleChange = (key: keyof SectionLayoutConfig, value: any) => {
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
        const newMod = createModule(selectedNewType as any);
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

    const handleUpdateNestedConfig = (nestedConfig: Record<string, any>) => {
        if (!editingModule) return;
        setEditingModule({
            ...editingModule,
            config: nestedConfig
        });
    };

    const handleUpdateNestedStyling = (key: string, value: any) => {
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
            case 'related-products':
                return <RelatedProductsConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'recently-viewed':
                return <RecentlyViewedConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
            case 'personalized-products':
                return <PersonalizedProductsConfigPanel config={editingModule.config as any} onChange={handleUpdateNestedConfig} storeId={storeId} />;
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
            default:
                return (
                    <Typography variant="body2" color="text.secondary">
                        Editing not supported for this module type here.
                    </Typography>
                );
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Background Color */}
            <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Background Color
                </Typography>
                <ColorPicker
                    value={config.backgroundColor || 'transparent'}
                    onChange={(color) => handleChange('backgroundColor', color)}
                />
            </Box>

            <Divider />

            {/* Border Settings */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                    Border Settings
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        select
                        label="Border Style"
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
                        label="Border Width (px)"
                        type="number"
                        value={config.borderWidth || 0}
                        onChange={(e) => handleChange('borderWidth', parseInt(e.target.value) || 0)}
                        fullWidth
                        size="small"
                        inputProps={{ min: 0, max: 20 }}
                        disabled={config.borderStyle === 'none'}
                    />
                </Box>

                {config.borderStyle !== 'none' && (
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Border Color
                        </Typography>
                        <ColorPicker
                            value={config.borderColor || '#e5e7eb'}
                            onChange={(color) => handleChange('borderColor', color)}
                        />
                    </Box>
                )}

                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Border Radius: {config.borderRadius ?? 8}px
                    </Typography>
                    <Slider
                        value={config.borderRadius ?? 8}
                        onChange={(_, val) => handleChange('borderRadius', val)}
                        min={0}
                        max={40}
                        step={2}
                    />
                </Box>
            </Box>

            <Box>
                <Typography variant="caption" color="text.secondary">
                    Gap between modules: {config.gap ?? 24}px
                </Typography>
                <Slider
                    value={config.gap ?? 24}
                    onChange={(_, val) => handleChange('gap', val)}
                    min={0}
                    max={80}
                    step={4}
                />
            </Box>

            <Divider />

            {/* Inner Paddings */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                    Inner Paddings (px)
                </Typography>

                <Stack spacing={1}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Padding Top: {config.paddingTop ?? 16}px
                        </Typography>
                        <Slider
                            value={config.paddingTop ?? 16}
                            onChange={(_, val) => handleChange('paddingTop', val)}
                            min={0}
                            max={100}
                            step={4}
                            size="small"
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Padding Bottom: {config.paddingBottom ?? 16}px
                        </Typography>
                        <Slider
                            value={config.paddingBottom ?? 16}
                            onChange={(_, val) => handleChange('paddingBottom', val)}
                            min={0}
                            max={100}
                            step={4}
                            size="small"
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Padding Left: {config.paddingLeft ?? 16}px
                        </Typography>
                        <Slider
                            value={config.paddingLeft ?? 16}
                            onChange={(_, val) => handleChange('paddingLeft', val)}
                            min={0}
                            max={100}
                            step={4}
                            size="small"
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Padding Right: {config.paddingRight ?? 16}px
                        </Typography>
                        <Slider
                            value={config.paddingRight ?? 16}
                            onChange={(_, val) => handleChange('paddingRight', val)}
                            min={0}
                            max={100}
                            step={4}
                            size="small"
                        />
                    </Box>
                </Stack>
            </Box>

            <Divider />

            {/* Nested Modules Management */}
            <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Nested Modules
                </Typography>

                {/* Add Module Inline Row */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
                    <TextField
                        select
                        label="Select Module to Add"
                        value={selectedNewType}
                        onChange={(e) => setSelectedNewType(e.target.value)}
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

                {/* List of Nested Modules */}
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
            </Box>

            {/* Nested Module Config Editor Dialog */}
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
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Margin (px)
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Box flex={1}>
                                            <Typography variant="caption">Top</Typography>
                                            <input
                                                type="number"
                                                value={editingModule.styling?.marginTop || 0}
                                                onChange={(e) => handleUpdateNestedStyling('marginTop', parseInt(e.target.value) || 0)}
                                                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                                            />
                                        </Box>
                                        <Box flex={1}>
                                            <Typography variant="caption">Bottom</Typography>
                                            <input
                                                type="number"
                                                value={editingModule.styling?.marginBottom || 0}
                                                onChange={(e) => handleUpdateNestedStyling('marginBottom', parseInt(e.target.value) || 0)}
                                                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                                            />
                                        </Box>
                                    </Box>

                                    <Typography variant="caption" color="text.secondary">
                                        Padding (px)
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Box flex={1}>
                                            <Typography variant="caption">Top</Typography>
                                            <input
                                                type="number"
                                                value={editingModule.styling?.paddingTop || 0}
                                                onChange={(e) => handleUpdateNestedStyling('paddingTop', parseInt(e.target.value) || 0)}
                                                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                                            />
                                        </Box>
                                        <Box flex={1}>
                                            <Typography variant="caption">Bottom</Typography>
                                            <input
                                                type="number"
                                                value={editingModule.styling?.paddingBottom || 0}
                                                onChange={(e) => handleUpdateNestedStyling('paddingBottom', parseInt(e.target.value) || 0)}
                                                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                                            />
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            CSS Class
                                        </Typography>
                                        <input
                                            type="text"
                                            value={editingModule.styling?.className || ''}
                                            onChange={(e) => handleUpdateNestedStyling('className', e.target.value)}
                                            placeholder="custom-module-class"
                                            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                                        />
                                    </Box>
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
