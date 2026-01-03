// Layout Designer local types for drag-and-drop context

import { LayoutModule, LayoutSection, ModuleType, SectionType, LayoutColumn } from '@/types';

// Module definition for the palette
export interface ModuleDefinition {
    type: ModuleType;
    label: string;
    icon: string; // MUI icon name
    category: 'standard' | 'product' | 'placeholder' | 'account';
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
    account: 'Account',
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
    {
        type: 'cta-button',
        label: 'CTA Button',
        icon: 'SmartButton',
        category: 'standard',
        description: 'Call to action button',
        defaultConfig: {
            text: 'Click Me',
            link: '#',
            variant: 'contained',
            color: 'primary',
            alignment: 'center',
            size: 'medium'
        },
    },
    {
        type: 'strip-banner',
        label: 'Strip Banner',
        icon: 'ViewStream',
        category: 'standard',
        description: 'Full-width banner with CTA',
        defaultConfig: {
            content: 'Special Offer',
            backgroundImage: '',
            backgroundColor: '#f5f5f5',
            textColor: '#000000',
            ctaText: 'Shop Now',
            ctaLink: '#',
            ctaPosition: 'right', // 'bottom', 'left', 'right'
            height: 120,
        },
    },
    {
        type: 'card-group',
        label: 'Card Group',
        icon: 'ViewModule',
        category: 'standard',
        description: 'Group of content cards',
        defaultConfig: {
            title: '',
            layout: 'grid', // 'grid', 'carousel'
            cards: [
                { title: 'Card 1', description: 'Description', image: '', link: '#', ctaText: 'Learn More' },
                { title: 'Card 2', description: 'Description', image: '', link: '#', ctaText: 'Learn More' },
                { title: 'Card 3', description: 'Description', image: '', link: '#', ctaText: 'Learn More' },
            ],
            columns: { desktop: 3, tablet: 2, mobile: 1 },
        },
    },
    {
        type: 'icon-box',
        label: 'Icon Box',
        icon: 'Extension',
        category: 'standard',
        description: 'Features or services with icons',
        defaultConfig: {
            items: [],
            layout: 'icon-top',
            displayMode: 'grid',
            columns: 3,
            iconType: 'icon',
            textAlign: 'center'
        },
    },
    {
        type: 'pricing-table',
        label: 'Pricing Table',
        icon: 'MonetizationOn',
        category: 'standard',
        description: 'Pricing plans comparison',
        defaultConfig: {
            plans: [],
            columns: 3
        },
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
    {
        type: 'related-products',
        label: 'Related Products',
        icon: 'Recommend',
        category: 'product',
        description: 'Products related to current context (category, tags, or manual)',
        defaultConfig: {
            title: 'You May Also Like',
            source: 'category',
            limit: 8,
            columns: 4,
            layout: 'carousel',
            showRating: true,
            autoplay: false,
        },
    },
    {
        type: 'recently-viewed',
        label: 'Recently Viewed',
        icon: 'History',
        category: 'product',
        description: 'Products the customer recently viewed',
        defaultConfig: {
            title: 'Recently Viewed',
            limit: 8,
            columns: 4,
            layout: 'carousel',
            showRating: true,
        },
    },
    {
        type: 'personalized-products',
        label: 'Personalized Products',
        icon: 'AutoAwesome',
        category: 'product',
        description: 'AI-powered product suggestions based on user browsing and purchase history',
        defaultConfig: {
            title: 'Recommended For You',
            subtitle: '',
            limit: 8,
            columns: { desktop: 4, tablet: 3, mobile: 2 },
            layout: 'grid', // 'grid' | 'carousel'

            // Exclusion settings
            exclusionScope: 'category', // 'product' | 'category'
            exclusionDays: 30,          // 1-90

            // Data retention (for viewing history)
            retentionDays: 30,          // 1-90

            // Fallback when no personalization data
            fallback: 'featured',       // 'trending' | 'featured' | 'latest' | 'sale'

            // Display options
            showRating: true,
            showPrice: true,
            autoplay: false, // For carousel
        },
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
        defaultConfig: { columns: 4, showFilters: true, showSort: true, perPage: 24 },
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
        type: 'page-content',
        label: 'Page Content',
        icon: 'Article',
        category: 'placeholder',
        description: 'Rich text content of the static page',
        defaultConfig: { containerWidth: 'medium' },
        allowedLayoutTypes: ['page'],
    },
    {
        type: 'page-hero',
        label: 'Page Hero',
        icon: 'ViewCarousel',
        category: 'placeholder',
        description: 'Modern hero section with title and breadcrumbs',
        defaultConfig: {
            showTitle: true,
            showBreadcrumbs: true,
            height: 'medium',
            alignment: 'left',
            containerWidth: 'medium'
        },
        allowedLayoutTypes: ['page'],
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
    // Search page placeholders
    {
        type: 'search-header',
        label: 'Search Header',
        icon: 'Search',
        category: 'placeholder',
        description: 'Search title and result count',
        defaultConfig: { showBreadcrumbs: true },
        allowedLayoutTypes: ['search'],
    },
    {
        type: 'search-filters',
        label: 'Search Filters',
        icon: 'FilterList',
        category: 'placeholder',
        description: 'Product filters for search results',
        defaultConfig: {},
        allowedLayoutTypes: ['search'],
    },
    {
        type: 'search-pagination',
        label: 'Pagination',
        icon: 'LastPage',
        category: 'placeholder',
        description: 'Page navigation / load more',
        defaultConfig: {},
        allowedLayoutTypes: ['search'],
    },

    // Blog modules
    {
        type: 'blog-hero',
        label: 'Blog Hero',
        icon: 'ViewCarousel',
        category: 'standard',
        description: 'Hero section for blog with search',
        defaultConfig: {
            title: 'Blog',
            subtitle: 'Discover insights, stories, and inspiration',
            backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            showSearchBar: true,
            height: 'medium',
        },
    },
    {
        type: 'blog-grid',
        label: 'Blog Grid',
        icon: 'GridView',
        category: 'standard',
        description: 'Blog posts grid with filters',
        defaultConfig: {
            title: 'Latest Posts',
            numberOfPosts: 6,
            columns: 3,
            sortBy: 'date',
            showImage: true,
            showExcerpt: true,
            showAuthor: true,
            showDate: true,
            showReadingTime: true,
            allowViewToggle: false,
        },
    },
    {
        type: 'related-blogs',
        label: 'Related Blogs',
        icon: 'Recommend',
        category: 'standard',
        description: 'Related blog posts',
        defaultConfig: {
            title: 'Related Articles',
            numberOfPosts: 3,
            matchBy: 'category',
            layout: 'grid',
            showImage: true,
            showExcerpt: true,
            showDate: true,
            showReadingTime: true,
        },
    },
    {
        type: 'blog-categories-sidebar',
        label: 'Blog Categories',
        icon: 'Category',
        category: 'standard',
        description: 'Blog category navigation',
        defaultConfig: {
            title: 'Categories',
            displayStyle: 'list',
            showPostCount: true,
            showAllOption: true,
            maxCategories: 10,
        },
    },
    {
        type: 'recent-posts',
        label: 'Recent Posts',
        icon: 'Schedule',
        category: 'standard',
        description: 'Latest blog posts',
        defaultConfig: {
            title: 'Recent Posts',
            numberOfPosts: 5,
            showThumbnail: true,
            showDate: true,
            showExcerpt: false,
            layout: 'vertical',
        },
    },
    {
        type: 'popular-posts',
        label: 'Popular Posts',
        icon: 'TrendingUp',
        category: 'standard',
        description: 'Most popular blog posts',
        defaultConfig: {
            title: 'Popular Posts',
            numberOfPosts: 5,
            metric: 'views',
            timePeriod: 'month',
            showThumbnail: true,
            showRanking: true,
            showStats: true,
        },
    },
    {
        type: 'newsletter-signup',
        label: 'Newsletter Signup',
        icon: 'Email',
        category: 'standard',
        description: 'Email subscription form',
        defaultConfig: {
            title: 'Subscribe to our Newsletter',
            description: 'Get the latest articles and insights delivered to your inbox.',
            placeholder: 'Enter your email',
            buttonText: 'Subscribe',
            style: 'card',
            showPrivacyNote: true,
        },
    },
    {
        type: 'tags-cloud',
        label: 'Tags Cloud',
        icon: 'LocalOffer',
        category: 'standard',
        description: 'Popular blog tags',
        defaultConfig: {
            title: 'Popular Tags',
            maxTags: 20,
            sizeVariation: true,
            colorScheme: 'default',
            layout: 'cloud',
        },
    },
    {
        type: 'author-card',
        label: 'Author Card',
        icon: 'Person',
        category: 'standard',
        description: 'Blog author information',
        defaultConfig: {
            authorName: 'Author Name',
            authorBio: 'Author bio goes here',
            layout: 'expanded',
            position: 'bottom',
            showPostCount: false,
        },
    },

    // Checkout module - SINGLE required placeholder with all config
    {
        type: 'checkout-content',
        label: 'Checkout (Required)',
        icon: 'ShoppingCartCheckout',
        category: 'placeholder',
        description: 'Complete checkout flow with address, shipping, payment, and review',
        defaultConfig: {
            // Checkout mode
            mode: 'stepper', // 'stepper' | 'one-page'

            // Progress bar config
            progress: {
                style: 'numbered', // 'numbered' | 'icons'
                showLabels: true,
                steps: ['Address', 'Shipping', 'Payment', 'Review'],
            },

            // Address section config
            address: {
                displayStyle: 'cards', // 'cards' | 'dropdown'
                showBillingToggle: true,
                showSaveAddress: true,
                maxSavedAddresses: 5,
            },

            // Shipping section config
            shipping: {
                showEstimatedDates: true,
                groupByCarrier: false,
                showShippingBreakdown: true,
            },

            // Payment section config
            payment: {
                showIcons: true,
                layout: 'list', // 'grid' | 'list'
                showExtraCharges: true,
            },

            // Review section config
            review: {
                showItemImages: true,
                showEditButtons: true,
                showCustomerNote: true,
            },

            // Order summary sidebar config
            summary: {
                sticky: true,
                showCoupon: true,
                collapsibleMobile: true,
                showCartItems: true,
                maxVisibleItems: 3,
            },

            // One-page specific config (only used when mode = 'one-page')
            onePage: {
                expandedByDefault: 'address',
                showSectionNumbers: true,
                allowMultipleExpanded: false,
            },
        },
        allowedLayoutTypes: ['checkout'],
    },
    // Cart module - SINGLE required placeholder
    {
        type: 'cart-details',
        label: 'Cart Details (Required)',
        icon: 'ShoppingCart',
        category: 'placeholder',
        description: 'Shopping cart items and summary',
        defaultConfig: {},
        allowedLayoutTypes: ['cart'],
    },
    // Account Modules
    {
        type: 'account-sidebar',
        label: 'Account Sidebar',
        icon: 'Layout', // Using Layout icon or similar
        category: 'account',
        description: 'Account navigation menu',
        defaultConfig: {},
        allowedLayoutTypes: ['account'],
    },
    {
        type: 'account-dashboard',
        label: 'Account Detail',
        icon: 'Grid',
        category: 'account',
        description: 'Dynamic account content (Dashboard, Orders, Profile, etc.)',
        defaultConfig: {},
        allowedLayoutTypes: ['account'],
    },
    // Form module
    {
        type: 'form',
        label: 'Form',
        icon: 'Assignment',
        category: 'standard',
        description: 'Custom form with dynamic fields',
        defaultConfig: {
            formId: '',
            showTitle: true,
            showDescription: true,
            submitButtonText: 'Submit',
            successMessage: 'Thank you! Your submission has been received.',
            redirectUrl: '',
        },
    },
];

// Get modules by category
export const getModulesByCategory = (category: 'standard' | 'product' | 'placeholder' | 'account') =>
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

// Create default search page layout based on filter position
export const createSearchDefaultLayout = (
    filterPosition: CategoryFilterPosition = 'left',
    sidebarWidth: number = 280
): LayoutSection[] => {
    const sections: LayoutSection[] = [];

    // 1. Header section (full width) - search header
    const headerSection: LayoutSection = {
        id: crypto.randomUUID(),
        name: 'Search Header',
        type: 'full-width',
        settings: { paddingTop: 20, paddingBottom: 20 },
        modules: [createModule('search-header')],
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
            modules: [createModule('search-filters')],
        };

        const mainColumn: LayoutColumn = {
            id: crypto.randomUUID(),
            width: mainWidthPercent,
            modules: [
                createModule('search-results'),
                createModule('search-pagination'),
            ],
        };

        const contentSection: LayoutSection = {
            id: crypto.randomUUID(),
            name: 'Search Content',
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
            name: 'Search Content',
            type: 'container',
            settings: { paddingTop: 20, paddingBottom: 40 },
            modules: [
                ...(filterPosition === 'top' ? [createModule('search-filters')] : []),
                createModule('search-results'),
                createModule('search-pagination'),
            ],
            visibility: { desktop: true, tablet: true, mobile: true },
            order: 1,
        };
        sections.push(contentSection);
    }

    return sections;
};

// Check if a layout needs default search sections
export const isSearchLayoutEmpty = (sections: LayoutSection[]): boolean => {
    // Check if layout has no sections, or has only empty sections
    if (sections.length === 0) return true;

    // Check if any section has search-results module
    const hasSearchResults = sections.some(s =>
        s.modules.some(m => m.type === 'search-results') ||
        s.columns?.some(c => c.modules.some(m => m.type === 'search-results'))
    );

    return !hasSearchResults;
};

// Checkout layout mode type
export type CheckoutLayoutMode = 'stepper' | 'one-page';

// Create default checkout page layout - uses single checkout-content module
export const createCheckoutDefaultLayout = (
    mode: CheckoutLayoutMode = 'stepper'
): LayoutSection[] => {
    // Create the checkout-content module with mode set
    const checkoutModule = createModule('checkout-content');
    checkoutModule.config = {
        ...checkoutModule.config,
        mode: mode,
    };

    // Single full-width section containing checkout
    const checkoutSection: LayoutSection = {
        id: crypto.randomUUID(),
        name: 'Checkout',
        type: 'full-width',
        settings: { paddingTop: 20, paddingBottom: 40 },
        modules: [checkoutModule],
        visibility: { desktop: true, tablet: true, mobile: true },
        order: 0,
    };

    return [checkoutSection];
};

// Check if a layout needs default checkout sections
export const isCheckoutLayoutEmpty = (sections: LayoutSection[]): boolean => {
    if (sections.length === 0) return true;

    // Check if any section has checkout-content module
    const hasCheckoutContent = sections.some(s =>
        s.modules.some(m => m.type === 'checkout-content') ||
        s.columns?.some(c => c.modules.some(m => m.type === 'checkout-content'))
    );

    return !hasCheckoutContent;
};
