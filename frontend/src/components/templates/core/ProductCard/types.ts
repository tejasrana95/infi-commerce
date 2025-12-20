// ProductCard Types - Shared between Core and Templates

export interface ProductTemplateProps {
    // Product Info
    id: string;
    name: string;
    slug: string;
    brand?: string;
    sku?: string;

    // Pricing
    price: number;
    compareAtPrice?: number;
    discountPercent?: number;
    hasDiscount: boolean;
    formattedPrice: string;
    formattedCompareAtPrice?: string;

    // Media
    imageUrl?: string;
    imageAlt: string;

    // Rating
    rating?: number;
    reviewCount?: number;

    // Status
    isNew?: boolean;
    isOnSale?: boolean;
    inStock?: boolean;
    stockStatus?: string;

    // URLs
    productUrl: string;

    // Currency
    currency: string;
}

// Raw product data from API
export interface Product {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    salePrice?: number;
    saleStartDate?: string;
    saleEndDate?: string;
    images?: string[];
    rating?: number;
    reviewCount?: number;
    isNew?: boolean;
    inStock?: boolean;
    brand?: string;
    brandName?: string;  // Resolved brand name from API lookup
    sku?: string;
    stockStatus?: string;
}
