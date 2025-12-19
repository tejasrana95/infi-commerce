// Module Registry - Central registration of all layout modules

import { ModuleType } from '@/types/layout';
import dynamic from 'next/dynamic';

// Dynamically import modules for code splitting
const Banner = dynamic(() => import('./standard/Banner'));
const TextBlock = dynamic(() => import('./standard/TextBlock'));
const Image = dynamic(() => import('./standard/Image'));
const Spacer = dynamic(() => import('./standard/Spacer'));
const Divider = dynamic(() => import('./standard/Divider'));

// Module Registry - maps module types to components
export const MODULE_REGISTRY: Partial<Record<ModuleType, React.ComponentType<any>>> = {
    // Standard modules
    'banner': Banner,
    'text-block': TextBlock,
    'image': Image,
    'spacer': Spacer,
    'divider': Divider,

    // More modules will be added as we implement them
    // 'banner-slider': BannerSlider,
    // 'image-gallery': ImageGallery,
    // 'video': Video,
    // 'html': Html,
    // 'testimonials': Testimonials,
    // 'brand-logos': BrandLogos,
    // 'product-carousel': ProductCarousel,
    // 'product-grid': ProductGrid,
    // 'category-showcase': CategoryShowcase,
    // etc...
};

// Helper to check if a module type is registered
export const isModuleRegistered = (type: ModuleType): boolean => {
    return type in MODULE_REGISTRY;
};

// Helper to get all registered module types
export const getRegisteredModules = (): ModuleType[] => {
    return Object.keys(MODULE_REGISTRY) as ModuleType[];
};
