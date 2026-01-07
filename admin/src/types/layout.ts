export type LayoutType = 'homepage' | 'category' | 'product' | 'search' | 'blog-list' | 'blog-post' | 'page' | 'cart' | 'checkout' | 'account';

export type ModuleType =
    | 'banner' | 'banner-slider' | 'text-block' | 'image' | 'image-gallery'
    | 'video' | 'spacer' | 'divider' | 'html' | 'newsletter' | 'testimonials'
    | 'countdown' | 'brand-logos' | 'cta-button' | 'strip-banner' | 'card-group'
    | 'icon-box' | 'pricing-table'
    | 'product-carousel' | 'product-grid' | 'category-showcase' | 'featured-product'
    | 'related-products' | 'recently-viewed' | 'personalized-products'
    | 'category-header' | 'category-products' | 'category-filters' | 'category-pagination' | 'product-details'
    | 'search-header' | 'search-results' | 'search-filters' | 'search-pagination'
    | 'blog-listing' | 'blog-content' | 'page-content' | 'page-hero'
    | 'blog-grid' | 'blog-categories-sidebar' | 'recent-posts' | 'popular-posts'
    | 'tags-cloud' | 'newsletter-signup' | 'author-card' | 'blog-hero' | 'related-blogs'
    | 'checkout-content'
    | 'cart-details'
    | 'account-sidebar' | 'account-dashboard' | 'account-orders' | 'account-profile' | 'account-addresses'
    | 'form'
    | 'accordion'
    | 'heading'
    | 'number-box'
    | 'flip-box'
    | 'progress-bar'
    | 'marquee'
    | 'content-card-grid';

export type SectionType = 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';

export interface LayoutModule {
    id: string;
    type: ModuleType;
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

export interface LayoutColumn {
    id: string;
    width: number;
    modules: LayoutModule[];
}

export interface LayoutSection {
    id: string;
    name?: string;
    type: SectionType;
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
        backgroundParallax?: boolean;
        backgroundParallaxRatio?: number;
    };
    columns?: LayoutColumn[];
    modules: LayoutModule[];
    visibility: {
        desktop: boolean;
        tablet: boolean;
        mobile: boolean;
    };
    order: number;
}

export interface Layout {
    _id: string;
    storeId: string | { _id: string; name: string };
    themeId?: string;
    name: string;
    description?: string;
    type: LayoutType;
    slug?: string;
    sections: LayoutSection[];
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

export interface MenuItem {
    id: string;
    label: string;
    type: 'link' | 'category' | 'product' | 'page' | 'blog-category' | 'mega-menu' | 'divider' | 'dropdown';
    url?: string;
    categoryId?: string;
    categorySlug?: string;
    productId?: string;
    productSlug?: string;
    pageId?: string;
    pageSlug?: string;
    blogCategoryId?: string;
    blogCategorySlug?: string;
    megaMenu?: {
        sections: Array<{
            id: string;
            type: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
            columns: Array<{
                id: string;
                width: number;
                items: Array<{
                    id: string;
                    type: 'category' | 'product' | 'image' | 'custom-link' | 'page' | 'divider';
                    label?: string;
                    categoryId?: string;
                    productLimit?: number;
                    autoAddProducts?: boolean;
                    productIds?: string[];
                    imageUrl?: string;
                    imageLink?: string;
                    imageAlt?: string;
                    linkLabel?: string;
                    linkTitle?: string;
                    linkUrl?: string;
                    linkOpenInNewTab?: boolean;
                    pageId?: string;
                }>;
            }>;
            settings: {
                backgroundColor?: string;
                padding?: number;
            };
        }>;
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
    storeId: string | { _id: string; name: string };
    createdAt: string;
    updatedAt: string;
}

export interface Page {
    _id: string;
    title: string;
    slug: string;
    useLayout: boolean;
    layoutId?: string;
    content?: string;
    featuredImage?: string;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
        canonicalUrl?: string;
        score?: number;
    };
    status: 'published' | 'draft';
    showInFooter: boolean;
    footerGroup?: string;
    showInHeader: boolean;
    template: 'default' | 'full-width' | 'sidebar' | 'landing';
    sortOrder: number;
    storeId: string | { _id: string; name: string };
    createdAt: string;
    updatedAt: string;
}

export interface BlogCategory {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    parentCategory?: string | BlogCategory;
    level: number;
    path: string;
    postCount: number;
    isActive: boolean;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
        score?: number;
    };
    storeId: string;
    createdAt: string;
    updatedAt: string;
}

export interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    categoryIds: (string | BlogCategory)[];
    tags?: string[];
    author?: {
        name: string;
        avatar?: string;
        bio?: string;
        userId?: string;
    };
    status: 'draft' | 'published' | 'archived' | 'scheduled';
    publishedAt?: string;
    scheduledAt?: string;
    allowComments: boolean;
    isFeatured: boolean;
    isPinned: boolean;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
        ogImage?: string;
        ogTitle?: string;
        ogDescription?: string;
        score?: number;
    };
    stats: {
        views: number;
        likes: number;
        comments: number;
    };
    storeId: string;
    createdAt: string;
    updatedAt: string;
}
