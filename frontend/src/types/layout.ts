/**
 * Module - Building block for layouts
 */
export interface Module {
    id: string;
    type: string;
    config: Record<string, any>;
    styling: {
        className?: string;
        customCSS?: string;
        marginTop?: number;
        marginBottom?: number;
        paddingTop?: number;
        paddingBottom?: number;
    };
    visibility: {
        desktop: boolean;
        tablet: boolean;
        mobile: boolean;
    };
    isPlaceholder: boolean;
    isRemovable: boolean;
    order: number;
}

/**
 * Column - For split-layout sections
 */
export interface Column {
    id: string;
    width: number;
    modules: Module[];
}

/**
 * Section - Container for modules
 */
export interface Section {
    id: string;
    name?: string;
    type: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
    settings: {
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
    };
    columns?: Column[];
    modules: Module[];
    visibility: {
        desktop: boolean;
        tablet: boolean;
        mobile: boolean;
    };
    order: number;
}

/**
 * Layout - Page layout configuration
 */
export interface Layout {
    _id: string;
    storeId: string;
    themeId?: string;
    name: string;
    description?: string;
    type: 'homepage' | 'category' | 'product' | 'search' | 'blog-list' | 'blog-post' | 'page' | 'cart' | 'checkout' | 'account';
    sections: Section[];
    settings: {
        backgroundColor?: string;
        customCSS?: string;
        customJS?: string;
        bodyClass?: string;
    };
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
    };
    isDefault: boolean;
    isTemplate: boolean;
    templateCategory?: string;
    status: 'draft' | 'published';
    createdAt: string;
    updatedAt: string;
}
