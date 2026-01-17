export interface ProductCardConfig {
    cardStyle: 'default' | 'minimal' | 'overlay' | 'horizontal' | 'bordered';
    imageAspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | 'auto';
    imageSize: 'small' | 'medium' | 'large';
    imageFit: 'cover' | 'contain';
    showImageHover: boolean;
    showAddToCart: boolean;
    showBuyNow: boolean;
    showWishlist: boolean;
    showQuickView: boolean;
    showCompare: boolean;
    addToCartStyle: 'filled' | 'outlined' | 'text' | 'icon-only';
    buyNowStyle: 'filled' | 'outlined' | 'text' | 'icon-only';
    wishlistPosition: 'top-right' | 'top-left' | 'bottom';
    quickViewPosition: 'overlay' | 'top-right';
    titleLines: 1 | 2 | 3;
    titleFontSize: 'small' | 'medium' | 'large';
    titleFontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
    priceFontSize: 'small' | 'medium' | 'large';
    showBrand: boolean;
    showRating: boolean;
    showRatingValue: boolean;
    showSalePercent: boolean;
    showStock: boolean;
    showSku: boolean;
    hoverEffect: 'none' | 'zoom' | 'lift' | 'shadow' | 'overlay';
    cardGap: number;
    cardPadding: number;
    cardBorderRadius: number;
}

export interface CategoryHeaderConfig {
    showImage: boolean;
    showDescription: boolean;
    descriptionPosition: 'top' | 'bottom' | 'below-image';
    descriptionStyle: 'expanded' | 'collapsed';
    defaultExpanded: boolean;
    expandLabel: string;
    collapseLabel: string;
}

export interface CategoryGridConfig {
    productsPerPage: number;
    productsPerRow: {
        desktop: 3 | 4 | 5;
        tablet: 2 | 3;
        mobile: 1 | 2;
    };
    cardStyle: 'default' | 'compact' | 'detailed';
}

export interface CategorySortingConfig {
    defaultSort: 'featured' | 'newest' | 'oldest' | 'price-low' | 'price-high' | 'alphabetical' | 'bestselling';
    showSortDropdown: boolean;
    availableSortOptions: string[];
}

export interface CategoryPaginationConfig {
    type: 'pagination' | 'infinite-scroll' | 'load-more';
    position: 'left' | 'center' | 'right';
    showProductCount: boolean;
}

export interface CategoryFiltersConfig {
    enabled: boolean;
    position: 'left' | 'right' | 'top' | 'off-canvas';
    sidebarWidth: number;
    style: 'sticky' | 'static';
    defaultState: 'expanded' | 'collapsed';
    showPriceRange: boolean;
    priceRangeStyle: 'slider' | 'input' | 'range-buttons';
    showCategoryFilter: boolean;
    showAttributeFilters: boolean;
    showTagFilter: boolean;
    showBrandFilter: boolean;
    showRatingFilter: boolean;
    showAvailabilityFilter: boolean;
    offCanvas?: {
        slideFrom: 'left' | 'right';
        drawerWidth: number;
        buttonText: string;
        buttonPosition: 'left' | 'right';
        showFilterCount: boolean;
    };
}

export interface SubcategoryDisplayConfig {
    display: 'filter' | 'cards' | 'both' | 'none';
    cardStyle: 'image' | 'minimal';
    position: 'above-products' | 'sidebar';
}

export interface CategoryEmptyStateConfig {
    message: string;
    showClearFilters: boolean;
}

export interface CategorySEOConfig {
    indexFilteredPages: boolean;
}

export interface CategoryConfig {
    header: CategoryHeaderConfig;
    grid: CategoryGridConfig;
    sorting: CategorySortingConfig;
    pagination: CategoryPaginationConfig;
    filters: CategoryFiltersConfig;
    subcategories: SubcategoryDisplayConfig;
    emptyState: CategoryEmptyStateConfig;
    seo: CategorySEOConfig;
}

export const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
    header: {
        showImage: true,
        showDescription: true,
        descriptionPosition: 'below-image',
        descriptionStyle: 'collapsed',
        defaultExpanded: false,
        expandLabel: 'Read more',
        collapseLabel: 'Show less',
    },
    grid: {
        productsPerPage: 24,
        productsPerRow: { desktop: 4, tablet: 3, mobile: 2 },
        cardStyle: 'default',
    },
    sorting: {
        defaultSort: 'featured',
        showSortDropdown: true,
        availableSortOptions: ['featured', 'newest', 'price-low', 'price-high', 'bestselling'],
    },
    pagination: {
        type: 'pagination',
        position: 'center',
        showProductCount: true,
    },
    filters: {
        enabled: true,
        position: 'left',
        sidebarWidth: 280,
        style: 'sticky',
        defaultState: 'expanded',
        showPriceRange: true,
        priceRangeStyle: 'slider',
        showCategoryFilter: true,
        showAttributeFilters: true,
        showTagFilter: false,
        showBrandFilter: true,
        showRatingFilter: true,
        showAvailabilityFilter: true,
        offCanvas: {
            slideFrom: 'left',
            drawerWidth: 320,
            buttonText: 'Filters',
            buttonPosition: 'left',
            showFilterCount: true,
        },
    },
    subcategories: {
        display: 'both',
        cardStyle: 'image',
        position: 'above-products',
    },
    emptyState: {
        message: 'No products found',
        showClearFilters: true,
    },
    seo: {
        indexFilteredPages: false,
    },
};

export interface ProductPageConfig {
    pricing?: {
        showTaxIncluded: boolean;
        showPriceWithoutTax: boolean;
    };
    gallery?: {
        layout?: 'thumbnails-left' | 'thumbnails-bottom' | 'carousel' | 'grid';
        enableZoom?: boolean;
        zoomType?: 'hover' | 'magnify' | 'lightbox-only';
        enableLightbox?: boolean;
        showVideoGallery?: boolean;
    };
    info?: {
        showSku?: boolean;
        showBrand?: boolean;
        showStock?: boolean;
        showShortDescription?: boolean;
        showSocialShare?: boolean;
        showReviews?: boolean;
    };
    specifications?: {
        show: boolean;
        layout: 'tab' | 'list';
    };
    variants?: {
        style?: 'dropdown' | 'buttons' | 'swatches';
        showUnavailable?: boolean;
    };
    tabs?: {
        layout?: 'tabs' | 'accordion' | 'sections';
        showDescription?: boolean;
        showSpecifications?: boolean;
        showReviews?: boolean;
    };
    shipping?: {
        showCalculator: boolean;
    };
}

export const DEFAULT_PRODUCT_PAGE_CONFIG: ProductPageConfig = {
    pricing: {
        showTaxIncluded: false,
        showPriceWithoutTax: false,
    },
    gallery: {
        layout: 'thumbnails-left',
        enableZoom: true,
        zoomType: 'hover',
        enableLightbox: true,
        showVideoGallery: true,
    },
    info: {
        showSku: true,
        showBrand: true,
        showStock: true,
        showShortDescription: true,
        showSocialShare: false,
        showReviews: true,
    },
    specifications: {
        show: true,
        layout: 'tab',
    },
    variants: {
        style: 'buttons',
        showUnavailable: true,
    },
    tabs: {
        layout: 'tabs',
        showDescription: true,
        showSpecifications: true,
        showReviews: true,
    },
    shipping: {
        showCalculator: false,
    },
};

export interface CompareConfig {
    enabled?: boolean;
    maxProducts?: 2 | 3 | 4;
    maxProductsMobile?: 2;
    requireSameCategory?: boolean;
    showInProductCard?: boolean;
    showInProductPage?: boolean;
    widgetStyle?: 'floating' | 'drawer' | 'none';
    widgetPosition?: 'bottom' | 'bottom-right' | 'bottom-left';
}

export const DEFAULT_COMPARE_CONFIG: CompareConfig = {
    enabled: true,
    maxProducts: 4,
    maxProductsMobile: 2,
    requireSameCategory: true,
    showInProductCard: true,
    showInProductPage: true,
    widgetStyle: 'floating',
    widgetPosition: 'bottom-right',
};
