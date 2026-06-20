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
        backgroundColor?: string;
        textColor?: string;
        borderColor?: string;
        borderWidth?: number;
        borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
        borderRadius?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        maxWidth?: number;
        boxShadow?: 'none' | 'small' | 'medium' | 'large';
        gap?: number;
        inputBackgroundColor?: string;
        inputTextColor?: string;
        buttonBackgroundColor?: string;
        buttonTextColor?: string;
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
    settings?: {
        backgroundColor?: string;
        backgroundImage?: string;
        backgroundSize?: string;
        backgroundPosition?: string;
        textColor?: string;
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        marginTop?: number;
        marginBottom?: number;
        borderTopWidth?: number;
        borderRightWidth?: number;
        borderBottomWidth?: number;
        borderLeftWidth?: number;
        borderColor?: string;
        borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
        borderRadius?: number;
        hoverEffect?: boolean;
    };
}

/**
 * Section - Container for modules
 */
export interface Section {
    id: string;
    sectionId?: string; // Custom ID for scroll anchors
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
        minHeight?: number;
        maxHeight?: number;
        customClass?: string;
        backgroundParallax?: boolean;
        backgroundParallaxRatio?: number;
        // Border controls - individual sides
        borderTopWidth?: number;
        borderRightWidth?: number;
        borderBottomWidth?: number;
        borderLeftWidth?: number;
        borderColor?: string;
        borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
        borderRadius?: number;
        // Box shadow
        boxShadow?: 'none' | 'small' | 'medium' | 'large';
        styleInnerContainer?: boolean;
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
    slug?: string;                      // Optional slug for page-specific layouts
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
