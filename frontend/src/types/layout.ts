// Layout & Module Types for Frontend

// ============================================
// Module Types
// ============================================

export type ModuleType =
    // Standard modules
    | 'banner' | 'banner-slider' | 'text-block' | 'image' | 'image-gallery'
    | 'video' | 'spacer' | 'divider' | 'html' | 'newsletter' | 'testimonials'
    | 'countdown' | 'brand-logos'
    // Product modules
    | 'product-carousel' | 'product-grid' | 'category-showcase' | 'featured-product'
    // Placeholder modules (required, page-specific)
    | 'category-header' | 'category-products' | 'product-details'
    | 'search-results' | 'blog-listing' | 'blog-content';

export type SectionType = 'container' | 'full-width' | 'split';

// ============================================
// Visibility Controls
// ============================================

export interface Visibility {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
}

// ============================================
// Module Configuration
// ============================================

export interface LayoutModule {
    id: string;
    type: ModuleType;
    config: Record<string, any>;
    styling?: {
        className?: string;
        customCSS?: string;
        marginTop?: number;
        marginBottom?: number;
        paddingTop?: number;
        paddingBottom?: number;
    };
    visibility: Visibility;
    isPlaceholder?: boolean;
    isRemovable?: boolean;
    order: number;
}

// ============================================
// Section Configuration
// ============================================

export interface SectionSettings {
    name?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: 'cover' | 'contain' | 'auto';
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

export interface LayoutColumn {
    id: string;
    width: number; // Grid units (1-12)
    modules: LayoutModule[];
}

export interface LayoutSection {
    id: string;
    name?: string;
    type: SectionType;
    settings: SectionSettings;
    modules: LayoutModule[]; // For container/full-width sections
    columns?: LayoutColumn[]; // For split sections
    visibility: Visibility;
    order: number;
}

// ============================================
// Layout Configuration
// ============================================

export type LayoutType = 'homepage' | 'category' | 'product' | 'search' | 'blog-list' | 'blog-post' | 'custom';

export interface Layout {
    _id: string;
    storeId: string;
    name: string;
    type: LayoutType;
    sections: LayoutSection[];
    status: 'draft' | 'published';
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}
