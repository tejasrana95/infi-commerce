'use client';

import { Box, Typography, Divider, IconButton, Tabs, Tab } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import { LayoutModule, ModuleType } from '@/types';
import { getModuleDefinition } from './types';

// Import existing module config panels
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
    TestimonialsConfigPanel,
    BrandLogosConfigPanel,
    ProductCollectionConfigPanel,
    CategoryShowcaseConfigPanel,
    RelatedProductsConfigPanel,
    RecentlyViewedConfigPanel,
    CTAConfigPanel,
    StripBannerConfigPanel,
    CardGroupConfigPanel,
} from '@/components/organisms/ModuleConfigPanels';

interface ModuleEditorProps {
    module: LayoutModule;
    onChange: (module: LayoutModule) => void;
    onDelete: () => void;
    storeId?: string | any;
}

export default function ModuleEditor({ module, onChange, onDelete, storeId }: ModuleEditorProps) {
    const [tab, setTab] = useState(0);
    const definition = getModuleDefinition(module.type);

    // Check if module is removable - defaults to true unless explicitly false or is a placeholder
    const isRemovable = module.isRemovable !== false && definition?.category !== 'placeholder';

    // Ensure storeId is a string if it's populated
    const effectiveStoreId = typeof storeId === 'object' && storeId !== null ? storeId._id : storeId;

    const updateConfig = (config: Record<string, any>) => {
        onChange({ ...module, config });
    };

    const updateStyling = (key: string, value: any) => {
        onChange({
            ...module,
            styling: { ...module.styling, [key]: value },
        });
    };

    const renderConfigPanel = () => {
        switch (module.type) {
            case 'text-block':
                return (
                    <TextBlockConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'image':
                return (
                    <ImageConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'image-gallery':
                return (
                    <ImageGalleryConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'video':
                return (
                    <VideoConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'spacer':
                return (
                    <SpacerConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'divider':
                return (
                    <DividerConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'html':
                return (
                    <HTMLConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'banner':
                return (
                    <BannerConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                        storeId={effectiveStoreId}
                    />
                );

            case 'banner-slider':
                return (
                    <BannerSliderConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                        storeId={effectiveStoreId}
                    />
                );

            case 'testimonials':
                return (
                    <TestimonialsConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                        storeId={effectiveStoreId}
                    />
                );

            case 'brand-logos':
                return (
                    <BrandLogosConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                        storeId={effectiveStoreId}
                    />
                );

            case 'product-carousel':
            case 'product-grid':
                return (
                    <ProductCollectionConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                        storeId={effectiveStoreId}
                    />
                );

            case 'category-showcase':
                return (
                    <CategoryShowcaseConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                        storeId={effectiveStoreId}
                    />
                );

            case 'related-products':
                return (
                    <RelatedProductsConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                        storeId={effectiveStoreId}
                    />
                );

            case 'recently-viewed':
                return (
                    <RecentlyViewedConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                        storeId={effectiveStoreId}
                    />
                );

            case 'cta-button':
                return (
                    <CTAConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'strip-banner':
                return (
                    <StripBannerConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'card-group':
                return (
                    <CardGroupConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            // Placeholder modules - minimal config
            case 'category-products':
            case 'product-details':
            case 'search-results':
            case 'blog-listing':
            case 'blog-content':
                return (
                    <Box>
                        <Typography variant="body2" color="primary" gutterBottom>
                            This is a required page content module.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {definition?.description}
                        </Typography>
                    </Box>
                );

            default:
                return (
                    <Typography variant="body2" color="text.secondary">
                        Configuration coming soon for {module.type}
                    </Typography>
                );
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                    {definition?.label || module.type}
                </Typography>
                {isRemovable && (
                    <IconButton size="small" color="error" onClick={onDelete}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                <Tab label="Content" />
                <Tab label="Styling" />
            </Tabs>

            <Divider />

            {tab === 0 && (
                <Box>
                    {renderConfigPanel()}
                </Box>
            )}

            {tab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Margin (px)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box flex={1}>
                            <Typography variant="caption">Top</Typography>
                            <input
                                type="number"
                                value={module.styling?.marginTop || 0}
                                onChange={(e) => updateStyling('marginTop', parseInt(e.target.value) || 0)}
                                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                            />
                        </Box>
                        <Box flex={1}>
                            <Typography variant="caption">Bottom</Typography>
                            <input
                                type="number"
                                value={module.styling?.marginBottom || 0}
                                onChange={(e) => updateStyling('marginBottom', parseInt(e.target.value) || 0)}
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
                                value={module.styling?.paddingTop || 0}
                                onChange={(e) => updateStyling('paddingTop', parseInt(e.target.value) || 0)}
                                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                            />
                        </Box>
                        <Box flex={1}>
                            <Typography variant="caption">Bottom</Typography>
                            <input
                                type="number"
                                value={module.styling?.paddingBottom || 0}
                                onChange={(e) => updateStyling('paddingBottom', parseInt(e.target.value) || 0)}
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
                            value={module.styling?.className || ''}
                            onChange={(e) => updateStyling('className', e.target.value)}
                            placeholder="custom-module-class"
                            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
}
