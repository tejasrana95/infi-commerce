// ProductPage Types - Shared props for container and templates

import { ProductCardConfig } from '@/types';

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

export interface ProductVariant {
    sku: string;
    attributes: Record<string, string>; // e.g., { color: 'red', size: 'L' }
    price: number;
    salePrice?: number;
    stock: number;
    images: string[];
    weight?: number;
    dimensions?: ProductDimensions;
}

export interface ProductOption {
    optionId: string;
    name: string;
    values: string[];
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

    // Inventory
    stock: number;
    manageStock: boolean;
    stockStatus: 'in_stock' | 'out_of_stock' | 'on_backorder' | 'made_to_order';
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
    categoryIds: string[];
    categories?: Array<{ _id: string; title: string; slug: string }>;
    tags: string[];
    brand?: string;

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

export interface ProductReview {
    _id: string;
    productId: string;
    customerId?: {
        firstName?: string;
        lastName?: string;
    };
    isGuestReview: boolean;
    guestName?: string;
    rating: number;
    title: string;
    content: string;
    images?: string[];
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    adminReply?: ReviewAdminReply;
    createdAt: string;
}

export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
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

export interface ProductPageConfig {
    gallery?: {
        layout?: 'thumbnails-left' | 'thumbnails-bottom' | 'carousel' | 'grid';
        enableZoom?: boolean;
        enableLightbox?: boolean;
        showVideoGallery?: boolean;
    };
    info?: {
        showSku?: boolean;
        showBrand?: boolean;
        showStock?: boolean;
        showShortDescription?: boolean;
        showSocialShare?: boolean;
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
    relatedProducts?: {
        enabled?: boolean;
        title?: string;
        count?: number;
        source?: 'category' | 'tags' | 'manual';
    };
}

// ============================================
// Template Props
// ============================================

export interface ProductPageTemplateProps {
    // Product data
    product: Product;
    breadcrumbs: BreadcrumbItem[];

    // Variant state
    selectedVariant: ProductVariant | null;
    selectedOptions: Record<string, string>;
    onOptionChange: (optionName: string, value: string) => void;

    // Quantity
    quantity: number;
    onQuantityChange: (quantity: number) => void;

    // Actions
    onAddToCart: () => void;
    onBuyNow: () => void;
    onAddToWishlist: () => void;
    onAddToCompare: () => void;
    isAddingToCart: boolean;

    // Reviews
    reviews: ProductReview[];
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

    // Related Products
    relatedProducts: RelatedProduct[];
    relatedProductsLoading: boolean;

    // Configuration
    config: ProductPageConfig;
    currencySymbol: string;
    exchangeRate: number;
    templateId: string;
    cardConfig?: ProductCardConfig;

    // Layout
    layout?: any;

    // User state
    isLoggedIn: boolean;
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
    relatedProducts: {
        enabled: true,
        title: 'You May Also Like',
        count: 8,
        source: 'category',
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
