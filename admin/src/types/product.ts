import { Store } from './store';

export interface Category {
    _id: string;
    title: string;
    slug: string;
    description?: string;
    storeId: string | { _id: string; name: string; slug: string };
    parentCategory?: string | { _id: string; title: string; slug: string };
    image?: string;
    status: 'active' | 'inactive' | 'draft';

    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        canonicalUrl?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
        twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
        score?: number;
    };

    level: number;
    path: string;
    sortOrder: number;
    isVisible: boolean;
    channels?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface AttributeValue {
    _id?: string;
    label: string;
    value: string;
    colorCode?: string;
    image?: string;
}

export interface Attribute {
    _id: string;
    name: string;
    slug: string;
    type: 'select' | 'multiselect' | 'text' | 'color' | 'size';
    values: AttributeValue[];
    isFilterable: boolean;
    isVariation: boolean;
    sortOrder: number;
    storeId: string | Store; // Can be populated
    createdAt: string;
    updatedAt: string;
}

export interface Brand {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
    description?: string;
    website?: string;
    isActive: boolean;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        score?: number;
    };
    storeId: string | Store; // Can be populated
    createdAt: string;
    updatedAt: string;
}

export interface ProductVideo {
    type: 'youtube' | 'vimeo' | 'url';
    url: string;
    thumbnail?: string;
    title?: string;
}

export interface ProductVariant {
    sku: string;
    attributes: Record<string, string>;
    price: number;
    salePrice?: number;
    stock: number;
    images: string[];
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
}

export interface ProductAttribute {
    attributeId: string | Attribute;
    values: string[];
    isVariation: boolean;
}

export interface Product {
    _id: string;
    storeId: string | Store;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    type: 'simple' | 'variable' | 'digital';
    sku: string;
    hsnCode?: string;

    // Pricing
    price: number;
    salePrice?: number;
    salePriceStartDate?: string;
    salePriceEndDate?: string;
    costPrice?: number;

    // Inventory
    stock: number;
    manageStock: boolean;
    stockStatus: 'in_stock' | 'out_of_stock' | 'on_backorder' | 'made_to_order';
    lowStockThreshold?: number;

    // Shipping
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
        unit: 'cm' | 'in';
    };

    // Media
    images: string[];
    featuredImage?: string;
    videos?: ProductVideo[];

    // Categorization
    categoryIds: (string | Category)[];
    tags: string[];
    brand?: string;

    // Attributes & Variants
    attributes?: ProductAttribute[];
    variants?: ProductVariant[];

    // Digital
    downloadable: boolean;
    downloadFiles?: Array<{
        name: string;
        url: string;
        fileSize: number;
    }>;
    downloadLimit?: number;
    downloadExpiry?: number;

    // SEO
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        focusKeyword?: string;
        canonicalUrl?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
        score?: number;
    };

    // Status
    isActive: boolean;
    isFeatured: boolean;
    isOnSale: boolean;

    // Stats
    views: number;
    salesCount: number;
    averageRating?: number;
    reviewCount: number;

    createdAt: string;
    updatedAt: string;
}

export interface Sale {
    _id: string;
    name: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    startDate: string;
    endDate: string;
    applicableProducts?: string[];
    applicableCategories?: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
