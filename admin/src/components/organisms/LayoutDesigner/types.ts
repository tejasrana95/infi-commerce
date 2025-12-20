// Layout Designer local types for drag-and-drop context

import { LayoutModule, LayoutSection, ModuleType, SectionType, LayoutColumn } from '@/types';

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
    {
        type: 'category-header',
        label: 'Category Header',
        icon: 'ViewAgenda',
        category: 'placeholder',
        description: 'Category title, image, breadcrumbs',
        defaultConfig: { showImage: true, showDescription: true, showBreadcrumbs: true },
        allowedLayoutTypes: ['category'],
    },
    {
        type: 'category-filters',
        label: 'Filter Sidebar',
        icon: 'FilterList',
        category: 'placeholder',
        description: 'Product filters (auto-generated)',
        defaultConfig: {},
        allowedLayoutTypes: ['category'],
    },
    {
        type: 'category-pagination',
        label: 'Pagination',
        icon: 'LastPage',
        category: 'placeholder',
        description: 'Page navigation / load more',
        defaultConfig: {},
        allowedLayoutTypes: ['category'],
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

export const createColumn = (width: number): LayoutColumn => ({
    id: crypto.randomUUID(),
    width,
    modules: [],
});

// Filter position type for category pages
export type CategoryFilterPosition = 'left' | 'right' | 'top' | 'off-canvas';

// Create default category page layout based on filter position
export const createCategoryDefaultLayout = (
    filterPosition: CategoryFilterPosition = 'left',
    sidebarWidth: number = 280
): LayoutSection[] => {
    const sections: LayoutSection[] = [];

    // 1. Header section (full width) - category header
    const headerSection: LayoutSection = {
        id: crypto.randomUUID(),
        name: 'Category Header',
        type: 'full-width',
        settings: { paddingTop: 20, paddingBottom: 20 },
        modules: [createModule('category-header')],
        visibility: { desktop: true, tablet: true, mobile: true },
        order: 0,
    };
    sections.push(headerSection);

    // 2. Content section - varies based on filter position
    if (filterPosition === 'left' || filterPosition === 'right') {
        // Split layout with sidebar
        const sidebarWidthPercent = Math.round((sidebarWidth / 1200) * 12); // Convert to 12-column grid
        const mainWidthPercent = 12 - sidebarWidthPercent;

        const filterColumn: LayoutColumn = {
            id: crypto.randomUUID(),
            width: sidebarWidthPercent,
            modules: [createModule('category-filters')],
        };

        const mainColumn: LayoutColumn = {
            id: crypto.randomUUID(),
            width: mainWidthPercent,
            modules: [
                createModule('category-products'),
                createModule('category-pagination'),
            ],
        };

        const contentSection: LayoutSection = {
            id: crypto.randomUUID(),
            name: 'Category Content',
            type: 'split-2',
            settings: { paddingTop: 20, paddingBottom: 40 },
            // Order columns based on filter position
            columns: filterPosition === 'left'
                ? [filterColumn, mainColumn]
                : [mainColumn, filterColumn],
            modules: [],
            visibility: { desktop: true, tablet: true, mobile: true },
            order: 1,
        };
        sections.push(contentSection);
    } else {
        // Full width layout (top filters or off-canvas)
        const contentSection: LayoutSection = {
            id: crypto.randomUUID(),
            name: 'Category Content',
            type: 'container',
            settings: { paddingTop: 20, paddingBottom: 40 },
            modules: [
                ...(filterPosition === 'top' ? [createModule('category-filters')] : []),
                createModule('category-products'),
                createModule('category-pagination'),
            ],
            visibility: { desktop: true, tablet: true, mobile: true },
            order: 1,
        };
        sections.push(contentSection);
    }

    return sections;
};

// Check if a layout needs default category sections
export const isCategoryLayoutEmpty = (sections: LayoutSection[]): boolean => {
    // Check if layout has no sections, or has only empty sections
    if (sections.length === 0) return true;

    // Check if any section has category-products module
    const hasCategoryProducts = sections.some(s =>
        s.modules.some(m => m.type === 'category-products') ||
        s.columns?.some(c => c.modules.some(m => m.type === 'category-products'))
    );

    return !hasCategoryProducts;
};
