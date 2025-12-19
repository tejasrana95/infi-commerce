/**
 * Module Registry
 * Maps module types to their React components
 * Add new modules here as they are created
 */

import BannerModule from './standard/Banner';
import BannerSliderModule from './standard/BannerSlider';
import TestimonialsModule from './standard/Testimonials';
import BrandLogosModule from './standard/BrandLogos';
import ProductCarouselModule from './standard/ProductCarousel';
import ProductGridModule from './standard/ProductGrid';
import CategoryShowcaseModule from './standard/CategoryShowcase';
import TextBlockModule from './standard/TextBlock';
import ImageModule from './standard/Image';
import ImageGalleryModule from './standard/ImageGallery';
import VideoModule from './standard/Video';
import DividerModule from './standard/Divider';
import SpacerModule from './standard/Spacer';
import HtmlModule from './standard/Html';

export interface ModuleProps {
    config: Record<string, any>;
    sectionType?: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
}

type ModuleComponent = React.ComponentType<ModuleProps>;

export const moduleRegistry: Record<string, ModuleComponent> = {
    // Core/Standard Modules
    'banner': BannerModule,
    'banner-slider': BannerSliderModule,
    'testimonials': TestimonialsModule,
    'brand-logos': BrandLogosModule,
    'product-carousel': ProductCarouselModule,
    'product-grid': ProductGridModule,
    'category-showcase': CategoryShowcaseModule,
    'text-block': TextBlockModule,
    'image': ImageModule,
    'image-gallery': ImageGalleryModule,
    'video': VideoModule,
    'divider': DividerModule,
    'spacer': SpacerModule,
    'html': HtmlModule,
};

/**
 * Register a new module type
 */
export function registerModule(type: string, component: ModuleComponent) {
    moduleRegistry[type] = component;
}
