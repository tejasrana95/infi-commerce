/**
 * Module Config Panel Registry
 *
 * Maps module types to their configuration panel components.
 * To add a new module's config panel, import it and add it to the `configPanelRegistry` map below.
 *
 * Each config panel receives:
 *   config    – Record<string, any> (standard panels)
 *   module    – LayoutModule (pass-through panels like IconConfigPanel)
 *   onChange  – (config | module) => void
 *   storeId   – string | undefined (optional)
 */

import React from 'react';

// ── Import all config panels from the barrel export ────────────────────
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
    CategoryHeaderConfigPanel,
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
    BlogGridConfigPanel,
    BlogCategoriesSidebarConfigPanel,
    RecentPostsConfigPanel,
    PopularPostsConfigPanel,
    TagsCloudConfigPanel,
    NewsletterSignupConfigPanel,
    AuthorCardConfigPanel,
    PageContentConfigPanel,
    PageHeroConfigPanel,
    CheckoutContentConfigPanel,
    SectionLayoutConfigPanel,
} from './index';
import FormModuleEditor from '../LayoutDesigner/ModuleEditors/FormModuleEditor';

// ── Config panel component interface ──────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConfigPanelComponent = React.ComponentType<any>;

// ── Registry ───────────────────────────────────────────────────────────
export const configPanelRegistry: Record<string, ConfigPanelComponent> = {
    'text-block': TextBlockConfigPanel,
    'image': ImageConfigPanel,
    'image-gallery': ImageGalleryConfigPanel,
    'video': VideoConfigPanel,
    'spacer': SpacerConfigPanel,
    'divider': DividerConfigPanel,
    'html': HTMLConfigPanel,
    'banner': BannerConfigPanel,
    'banner-slider': BannerSliderConfigPanel,
    'hero-slider': HeroSliderConfigPanel,
    'hero-banner': HeroBannerConfigPanel,
    'testimonials': TestimonialsConfigPanel,
    'brand-logos': BrandLogosConfigPanel,
    'product-carousel': ProductCollectionConfigPanel,
    'product-grid': ProductCollectionConfigPanel,
    'category-showcase': CategoryShowcaseConfigPanel,
    'category-header': CategoryHeaderConfigPanel,
    'related-products': RelatedProductsConfigPanel,
    'recently-viewed': RecentlyViewedConfigPanel,
    'personalized-products': PersonalizedProductsConfigPanel,
    'cta-button': CTAConfigPanel,
    'strip-banner': StripBannerConfigPanel,
    'card-group': CardGroupConfigPanel,
    'icon-box': IconBoxConfigPanel,
    'icon-group': IconGroupConfigPanel,
    'pricing-table': PricingTableConfigPanel,
    'accordion': AccordionConfigPanel,
    'heading': HeadingConfigPanel,
    'number-box': NumberBoxConfigPanel,
    'flip-box': FlipBoxConfigPanel,
    'progress-bar': ProgressBarConfigPanel,
    'marquee': MarqueeConfigPanel,
    'icon': IconConfigPanel,
    'table': TableConfigPanel,
    'content-card-grid': ContentCardGridConfigPanel,
    'icon-list': IconListConfigPanel,
    'blog-grid': BlogGridConfigPanel,
    'blog-listing': BlogGridConfigPanel,
    'blog-categories-sidebar': BlogCategoriesSidebarConfigPanel,
    'recent-posts': RecentPostsConfigPanel,
    'popular-posts': PopularPostsConfigPanel,
    'tags-cloud': TagsCloudConfigPanel,
    'newsletter-signup': NewsletterSignupConfigPanel,
    'author-card': AuthorCardConfigPanel,
    'page-content': PageContentConfigPanel,
    'page-hero': PageHeroConfigPanel,
    'checkout-content': CheckoutContentConfigPanel,
    'section-layout': SectionLayoutConfigPanel,
    'form': FormModuleEditor as ConfigPanelComponent,
};

/**
 * Register a new config panel for a module type
 */
export function registerConfigPanel(type: string, component: ConfigPanelComponent) {
    configPanelRegistry[type] = component;
}
