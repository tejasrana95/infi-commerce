// Menu Types for Frontend
// Maps to backend Menu model structure

export interface MenuItem {
    id: string;
    label: string;
    type: 'link' | 'category' | 'product' | 'page' | 'blog-category' | 'mega-menu' | 'divider' | 'image' | 'custom-link' | 'dropdown';

    // Target based on type
    url?: string;
    categoryId?: string;
    productId?: string;
    pageId?: string;
    blogCategoryId?: string;
    categorySlug?: string;
    productSlug?: string;
    pageSlug?: string;

    // Category display options (for top-level category items)
    autoAddProducts?: boolean;
    showProductImage?: boolean;
    showProductPrice?: boolean;
    imagePosition?: 'left' | 'top';
    productLimit?: number;
    showViewAll?: boolean;
    // Mega Menu specific fields (lifted from nested structure for easier access)
    categoryName?: string;
    pageName?: string;
    productIds?: string[];
    productNames?: string[];
    products?: Array<{
        _id: string;
        name: string;
        slug?: string;
        price?: number;
        salePrice?: number;
        featuredImage?: string;
        images?: string[];
        rating?: number;
        reviewCount?: number;
    }>;

    // Category display options
    showProductRating?: boolean;
    categoryDisplayMode?: 'list' | 'grid' | 'compact';
    categoryColumns?: number;
    productImageSize?: 'small' | 'medium' | 'large';

    imageUrl?: string;
    imageAlt?: string;
    imageLink?: string;
    linkLabel?: string;
    linkTitle?: string;
    linkUrl?: string; // or url
    linkOpenInNewTab?: boolean;

    // Mega menu content - Sections-based structure
    megaMenu?: {
        sections: Array<{
            id: string;
            type: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
            columns: Array<{
                id: string;
                width: number;
                items: MenuItem[]; // Recursively use MenuItem
            }>;
            settings?: {
                backgroundColor?: string;
                padding?: number;
            };
        }>;
        maxHeight?: number;
    };

    icon?: string;
    badge?: {
        text: string;
        color: string;
    };
    openInNewTab: boolean;

    children: MenuItem[];
    order: number;
}

export interface Menu {
    _id: string;
    storeId: string;
    name: string;
    slug: string;
    location: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom';
    description?: string;

    items: MenuItem[];

    settings: {
        style: 'horizontal' | 'vertical' | 'mega' | 'flyout' | 'accordion';
        showIcons: boolean;
        maxDepth: number;
        mobileBreakpoint: number;
    };

    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}

// Props for MenuBuilder component
export interface MenuBuilderProps {
    menu: Menu;
    className?: string;
    themeColors?: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    onItemClick?: (item: MenuItem) => void;
}

// Props for individual menu renderers
export interface MenuRendererProps {
    items: MenuItem[];
    className?: string;
    themeColors?: MenuBuilderProps['themeColors'];
    settings: Menu['settings'];
    depth?: number;
    onItemClick?: (item: MenuItem) => void;
}
