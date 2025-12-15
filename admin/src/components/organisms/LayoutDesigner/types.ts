// Layout Designer local types for drag-and-drop context

import { LayoutModule, LayoutSection, ModuleType, SectionType } from '@/types';

// Module definition for the palette
export interface ModuleDefinition {
    type: ModuleType;
    label: string;
    icon: string; // MUI icon name
    category: 'standard' | 'product' | 'placeholder';
    description: string;
    defaultConfig: Record<string, any>;
    allowedLayoutTypes?: string[]; // Restrict to certain layout types
}

// Drag item types
export type DragItemType = 'module' | 'section' | 'palette-module';

export interface DragItem {
    id: string;
    type: DragItemType;
    data: {
        moduleType?: ModuleType;
        sectionId?: string;
        moduleId?: string;
    };
}

// Section settings form
export interface SectionSettings {
    name?: string;
    type: SectionType;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    marginTop?: number;
    marginBottom?: number;
    maxWidth?: number;
    customClass?: string;
}

// Module styling form
export interface ModuleStyling {
    className?: string;
    customCSS?: string;
    marginTop?: number;
    marginBottom?: number;
    paddingTop?: number;
    paddingBottom?: number;
}

// Editor context state
export interface EditorState {
    selectedSectionId: string | null;
    selectedModuleId: string | null;
    isDragging: boolean;
    previewMode: boolean;
    previewDevice: 'desktop' | 'tablet' | 'mobile';
}

// Module palette categories
export const MODULE_CATEGORIES = {
    standard: 'Standard',
    product: 'Products',
    placeholder: 'Page Content',
} as const;

// Available modules catalog
export const AVAILABLE_MODULES: ModuleDefinition[] = [
    // Standard modules
    {
        type: 'banner',
        label: 'Banner',
        icon: 'ViewCarousel',
        category: 'standard',
        description: 'Hero image with text overlay',
        defaultConfig: { bannerId: '' },
    },
    {
        type: 'banner-slider',
        label: 'Banner Slider',
        icon: 'ViewCarousel',
        category: 'standard',
        description: 'Rotating banner carousel',
        defaultConfig: { sliderId: '' },
    },
    {
        type: 'text-block',
        label: 'Text Block',
        icon: 'TextFields',
        category: 'standard',
        description: 'Rich text content',
        defaultConfig: { content: '', alignment: 'left', fontSize: 'medium', fontWeight: 'normal', padding: 16 },
    },
    {
        type: 'image',
        label: 'Image',
        icon: 'Image',
        category: 'standard',
        description: 'Single image with optional link',
        defaultConfig: { src: '', alt: '', link: '', width: 'full', objectFit: 'cover', alignment: 'center', borderRadius: 0, shadow: 'none' },
    },
    {
        type: 'image-gallery',
        label: 'Image Gallery',
        icon: 'Collections',
        category: 'standard',
        description: 'Grid or carousel of images',
        defaultConfig: { images: [], layout: 'grid', columns: 3, gap: 16, aspectRatio: 'square', lightbox: true },
    },
    {
        type: 'video',
        label: 'Video',
        icon: 'PlayCircle',
        category: 'standard',
        description: 'YouTube, Vimeo or custom video',
        defaultConfig: { source: 'youtube', url: '', autoplay: false, muted: true, loop: false, controls: true, aspectRatio: '16:9' },
    },
    {
        type: 'spacer',
        label: 'Spacer',
        icon: 'SpaceBar',
        category: 'standard',
        description: 'Vertical whitespace',
        defaultConfig: { height: 40 },
    },
    {
        type: 'divider',
        label: 'Divider',
        icon: 'HorizontalRule',
        category: 'standard',
        description: 'Horizontal line separator',
        defaultConfig: { style: 'solid', thickness: 1, color: '#e0e0e0', width: 'full', alignment: 'center', marginTop: 16, marginBottom: 16 },
    },
    {
        type: 'html',
        label: 'Custom HTML',
        icon: 'Code',
        category: 'standard',
        description: 'Custom HTML code',
        defaultConfig: { content: '' },
    },
    {
        type: 'testimonials',
        label: 'Testimonials',
        icon: 'FormatQuote',
        category: 'standard',
        description: 'Customer testimonials',
        defaultConfig: { testimonialIds: [], layout: 'carousel', autoplay: true },
    },
    {
        type: 'brand-logos',
        label: 'Brand Logos',
        icon: 'BusinessCenter',
        category: 'standard',
        description: 'Brand logo showcase',
        defaultConfig: { showcaseId: '' },
    },

    // Product modules
    {
        type: 'product-carousel',
        label: 'Product Carousel',
        icon: 'ViewCarousel',
        category: 'product',
        description: 'Horizontal product slider',
        defaultConfig: { source: 'new-arrivals', limit: 10, columns: 4, showPrice: true, showRating: true, autoplay: false },
    },
    {
        type: 'product-grid',
        label: 'Product Grid',
        icon: 'GridView',
        category: 'product',
        description: 'Product grid display',
        defaultConfig: { source: 'bestselling', limit: 8, columns: 4, showPrice: true, showRating: true },
    },
    {
        type: 'category-showcase',
        label: 'Category Showcase',
        icon: 'Category',
        category: 'product',
        description: 'Featured category cards',
        defaultConfig: { categoryIds: [], style: 'card', columns: 4 },
    },

    // Placeholder modules
    {
        type: 'category-products',
        label: 'Category Products',
        icon: 'Inventory2',
        category: 'placeholder',
        description: 'Product listing with filters',
        defaultConfig: { columns: 4, showFilters: true, showSort: true, perPage: 24 },
        allowedLayoutTypes: ['category'],
    },
    {
        type: 'product-details',
        label: 'Product Details',
        icon: 'ShoppingBag',
        category: 'placeholder',
        description: 'Product page content',
        defaultConfig: { showTabs: true, showReviews: true, showRelated: true },
        allowedLayoutTypes: ['product'],
    },
    {
        type: 'search-results',
        label: 'Search Results',
        icon: 'Search',
        category: 'placeholder',
        description: 'Search results grid',
        defaultConfig: { columns: 4, showFilters: true },
        allowedLayoutTypes: ['search'],
    },
    {
        type: 'blog-listing',
        label: 'Blog Listing',
        icon: 'Article',
        category: 'placeholder',
        description: 'Blog post grid',
        defaultConfig: { columns: 3, perPage: 12, showExcerpt: true },
        allowedLayoutTypes: ['blog-list'],
    },
    {
        type: 'blog-content',
        label: 'Blog Content',
        icon: 'Article',
        category: 'placeholder',
        description: 'Blog post content',
        defaultConfig: { showAuthor: true, showDate: true, showTags: true },
        allowedLayoutTypes: ['blog-post'],
    },
];

// Get modules by category
export const getModulesByCategory = (category: 'standard' | 'product' | 'placeholder') =>
    AVAILABLE_MODULES.filter(m => m.category === category);

// Get module definition by type
export const getModuleDefinition = (type: ModuleType): ModuleDefinition | undefined =>
    AVAILABLE_MODULES.find(m => m.type === type);

// Create a new module with default values
export const createModule = (type: ModuleType): LayoutModule => {
    const definition = getModuleDefinition(type);
    return {
        id: crypto.randomUUID(),
        type,
        config: definition?.defaultConfig || {},
        styling: {},
        visibility: { desktop: true, tablet: true, mobile: true },
        isPlaceholder: definition?.category === 'placeholder',
        isRemovable: definition?.category !== 'placeholder',
        order: 0,
    };
};

// Create a new section with default values
export const createSection = (type: SectionType = 'container', name?: string): LayoutSection => ({
    id: crypto.randomUUID(),
    name: name || 'New Section',
    type,
    settings: {
        paddingTop: 40,
        paddingBottom: 40,
    },
    modules: [],
    visibility: { desktop: true, tablet: true, mobile: true },
    order: 0,
});
