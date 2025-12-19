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

export interface ModuleProps {
    config: Record<string, any>;
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
};

/**
 * Register a new module type
 */
export function registerModule(type: string, component: ModuleComponent) {
    moduleRegistry[type] = component;
}
