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
    HeroSliderConfigPanel,
    HeroBannerConfigPanel,
    TestimonialsConfigPanel,
    BrandLogosConfigPanel,
    ProductCollectionConfigPanel,
    CategoryHeaderConfigPanel,
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
    // Blog Config Panels
    BlogGridConfigPanel,
    BlogCategoriesSidebarConfigPanel,
    RecentPostsConfigPanel,
    PopularPostsConfigPanel,
    TagsCloudConfigPanel,
    NewsletterSignupConfigPanel,
    AuthorCardConfigPanel,
    PageContentConfigPanel,
    PageHeroConfigPanel,
    // Checkout Config Panel
    CheckoutContentConfigPanel,
    // New Modules
    NumberBoxConfigPanel,
    FlipBoxConfigPanel,
    ProgressBarConfigPanel,
    MarqueeConfigPanel,
    IconConfigPanel,
    TableConfigPanel,
    ContentCardGridConfigPanel,
    IconListConfigPanel,
    SectionLayoutConfigPanel,
    ModuleStylingTab,
} from '@/components/organisms/ModuleConfigPanels';
import FormModuleEditor from './ModuleEditors/FormModuleEditor';

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

            case 'hero-slider':
                return (
                    <HeroSliderConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                        storeId={effectiveStoreId}
                    />
                );

            case 'hero-banner':
                return (
                    <HeroBannerConfigPanel
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

            case 'category-header':
                return (
                    <CategoryHeaderConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
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

            case 'personalized-products':
                return (
                    <PersonalizedProductsConfigPanel
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

            case 'icon-box':
                return (
                    <IconBoxConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'icon-group':
                return (
                    <IconGroupConfigPanel
                        config={module.config}
                        onChange={updateConfig}
                    />
                );

            case 'pricing-table':
                return (
                    <PricingTableConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'accordion':
                return (
                    <AccordionConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'heading':
                return (
                    <HeadingConfigPanel
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

            // Blog modules
            case 'blog-grid':
            case 'blog-listing':
                return (
                    <BlogGridConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'blog-categories-sidebar':
                return (
                    <BlogCategoriesSidebarConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'recent-posts':
                return (
                    <RecentPostsConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'popular-posts':
                return (
                    <PopularPostsConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'tags-cloud':
                return (
                    <TagsCloudConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'newsletter-signup':
                return (
                    <NewsletterSignupConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'author-card':
                return (
                    <AuthorCardConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'page-content':
                return (
                    <PageContentConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'page-hero':
                return (
                    <PageHeroConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            // Checkout module - single unified config
            case 'checkout-content':
                return (
                    <CheckoutContentConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            // Form module
            case 'form':
                return (
                    <FormModuleEditor
                        module={module}
                        onChange={onChange}
                    />
                );

            // New modules
            case 'number-box':
                return (
                    <NumberBoxConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'flip-box':
                return (
                    <FlipBoxConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'progress-bar':
                return (
                    <ProgressBarConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'marquee':
                return (
                    <MarqueeConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'icon':
                return (
                    <IconConfigPanel
                        module={module}
                        onChange={onChange}
                    />
                );

            case 'table':
                return (
                    <TableConfigPanel
                        module={module}
                        onChange={onChange}
                    />
                );

            case 'content-card-grid':
                return (
                    <ContentCardGridConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'icon-list':
                return (
                    <IconListConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                    />
                );

            case 'section-layout':
                return (
                    <SectionLayoutConfigPanel
                        config={module.config as any}
                        onChange={updateConfig}
                        storeId={effectiveStoreId}
                    />
                );

            // Placeholder modules - minimal config
            case 'category-products':
            case 'product-details':
            case 'cart-details':
            case 'account-sidebar':
            case 'account-dashboard':
            case 'search-results':
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



            {tab === 0 && (
                <Box>
                    {renderConfigPanel()}
                </Box>
            )}

            {tab === 1 && (
                <ModuleStylingTab styling={module.styling} onChange={updateStyling} />
            )}
        </Box>
    );
}
