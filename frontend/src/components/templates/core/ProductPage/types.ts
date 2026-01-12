// ProductPage Types - Shared props for container and templates

import { ProductCardConfig, ProductPageConfig } from '@/types';
export type { ProductPageConfig } from '@/types';

// ============================================
// Product Data Types
// ============================================

export interface ProductVideo {
    type: 'youtube' | 'vimeo' | 'url';
    url: string;
    thumbnail?: string;
    title?: string;
}

export interface ProductDimensions {
    length?: number;
    width?: number;
    height?: number;
    unit?: 'cm' | 'in';
}

export interface TaxBreakdown {
    name: string;
    rate: number;
    amount: number;
}

export interface ProductPricing {
    price: number;
    salePrice?: number;
    priceWithTax: number;
    salePriceWithTax?: number;
    taxRate: number;
    taxAmount: number;
    finalPrice: number;
    taxBreakdown?: TaxBreakdown[];
}

export interface ProductVariant {
    _id?: string;
    sku: string;
    attributes: Record<string, string>; // e.g., { attributeId: 'value' }
    price: number;
    salePrice?: number;
    stock: number;
    images: string[];
    weight?: number;
    dimensions?: ProductDimensions;
    pricing?: ProductPricing;
}

export interface OptionValue {
    label: string;
    value: string;
}

export interface ProductOption {
    optionId: string;
    name: string;
    values: OptionValue[];
    isVariation: boolean;
}

export interface ProductSpecification {
    attributeId: string;
    name: string;
    value: any;
}

export interface ProductSEO {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    focusKeyword?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
}

export interface Product {
    _id: string;
    storeId: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    type: 'simple' | 'variable' | 'digital';
    sku: string;

    // Pricing
    price: number;
    salePrice?: number;
    salePriceStartDate?: string;
    salePriceEndDate?: string;
    costPrice?: number;

    // Computed pricing (from container)
    formattedPrice?: string;
    formattedSalePrice?: string;
    formattedCompareAtPrice?: string;
    discountPercent?: number;
    isOnSale?: boolean;

    // Tax-inclusive pricing from API
    pricing?: ProductPricing;
    taxClassId?: {
        _id: string;
        name: string;
        rate: number;
        isSplit: boolean;
        subTaxes?: Array<{ name: string; rate: number }>;
    };

    // Inventory
    stock: number;
    manageStock: boolean;
    stockStatus: 'in_stock' | 'out_of_stock' | 'on_backorder' | 'made_to_order' | 'low_stock';
    lowStockThreshold?: number;

    // Shipping
    weight?: number;
    dimensions?: ProductDimensions;

    // Digital
    downloadable: boolean;

    // Options & Variants
    productOptions?: ProductOption[];
    variants?: ProductVariant[];
    specifications?: ProductSpecification[];

    // Media
    images: string[];
    featuredImage?: string;
    videos?: ProductVideo[];

    // Categorization
    categoryIds: Array<{ _id: string; title: string; slug: string; path?: string }>;
    categories?: Array<{ _id: string; title: string; slug: string; path?: string }>;
    categoryBreadcrumbs?: Array<{ label: string; href: string }>;
    tags: string[];
    brand?: string | { _id: string; name: string; slug: string; logo?: string };

    // SEO
    seo?: ProductSEO;

    // Status
    isActive: boolean;
    isFeatured: boolean;

    // Stats
    views: number;
    salesCount: number;
    averageRating?: number;
    reviewCount: number;

    createdAt: string;
    updatedAt: string;
}

// ============================================
// Review Types
// ============================================

export interface ReviewAdminReply {
    content: string;
    repliedAt: string;
    repliedBy?: {
        name: string;
    };
}

export interface Review {
    _id: string;
    storeId: string;
    productId: string;
    customerId?: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    isGuestReview: boolean;
    guestName?: string;
    rating: number;
    title: string;
    content: string;
    images?: string[];
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    votedBy: string[]; // User IDs
    adminReply?: {
        content: string;
        repliedAt: string;
        repliedBy: {
            name: string;
            email: string;
        };
    };
    createdAt: string;
}

export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
}

export interface ReviewSettings {
    allowReviews: boolean;
    allowGuestReviews: boolean;
    requireGuestEmailVerification: boolean;
    requireApproval: boolean;
    minRating: number;
    maxRating: number;
    allowImages: boolean;
    maxImagesPerReview: number;
}

// ============================================
// Breadcrumb
// ============================================

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

// ============================================
// Related Products
// ============================================

export interface RelatedProduct {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    images: string[];
    averageRating?: number;
    reviewCount?: number;
    stockStatus?: string;
    isOnSale?: boolean;
    discountPercent?: number;
}

// ============================================
// Product Page Configuration
// ============================================



// ============================================
// Template Props
// ============================================

export interface ProductPageTemplateProps {
    // Product data
    product: Product;
    breadcrumbs: BreadcrumbItem[];

    // Variant state
    selectedVariant: ProductVariant | null;
    matchingVariant?: ProductVariant | null; // For previewing partial selections
    selectedOptions: Record<string, string>;
    availableOptions: Record<string, string[]>; // Available values per option based on current selections
    allOptionsSelected: boolean; // True when all variation options have been selected
    onOptionChange: (optionId: string, value: string) => void;

    // Quantity
    quantity: number;
    onQuantityChange: (quantity: number) => void;

    // Actions
    onAddToCart: () => void;
    onBuyNow: () => void;
    onAddToWishlist: () => void;
    isWishlisted?: boolean;
    onAddToCompare: () => void;
    isInCompare?: boolean;
    compareEnabled?: boolean;
    compareDisabled?: boolean;
    compareDisabledReason?: string;
    isAddingToCart: boolean;

    // Reviews
    reviews: Review[];
    reviewStats: ReviewStats | null;
    reviewSettings: ReviewSettings;
    reviewsLoading: boolean;
    reviewsPagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    onLoadMoreReviews: () => void;
    onSubmitReview: (review: {
        rating: number;
        title: string;
        content: string;
        images?: string[];
        guestName?: string;
        guestEmail?: string;
    }) => Promise<boolean>;
    isSubmittingReview: boolean;
    relatedProducts: RelatedProduct[];
    config: ProductPageConfig;
    currencySymbol: string;
    exchangeRate: number;
    currency: import('@/types').Currency | string;
    templateId: string;
    cardConfig?: ProductCardConfig;

    // Layout
    layout?: any;

    // User state
    isLoggedIn: boolean;
    userId?: string;
    onHelpfulVote: (reviewId: string) => Promise<void>;

    // Shipping Calculator
    shippingEstimate?: {
        loading: boolean;
        error?: string;
        cost?: number;
        formattedCost?: string;
        days?: string;
        name?: string;
    };
    userDefaultCountry?: string;
    onCalculateShipping?: (zip: string, country: string) => Promise<void>;
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_PRODUCT_PAGE_CONFIG: ProductPageConfig = {
    gallery: {
        layout: 'thumbnails-left',
        enableZoom: true,
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
        showCalculator: true,
    },
    pricing: {
        showTaxIncluded: false,
        showPriceWithoutTax: false,
    },
};

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
    allowReviews: true,
    allowGuestReviews: true,
    requireGuestEmailVerification: false,
    requireApproval: true,
    minRating: 1,
    maxRating: 5,
    allowImages: true,
    maxImagesPerReview: 5,
};
