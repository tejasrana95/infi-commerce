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

    // Config
    cardConfig?: import('@/types').ProductCardConfig;
}

// Raw product data from API
export interface Product {
    _id: string;
    name: string;
    slug: string;
    type?: 'simple' | 'variable';
    price: number;
    compareAtPrice?: number;
    salePrice?: number;
    saleStartDate?: string;
    saleEndDate?: string;
    featuredImage?: string;
    images?: string[];
    rating?: number;
    reviewCount?: number;
    isNew?: boolean;
    inStock?: boolean;
    brand?: string | { _id: string; name: string; slug: string; logo?: string };
    brandName?: string;  // Resolved brand name from API lookup
    sku?: string;
    stockStatus?: string;
    // Tax-inclusive pricing from API
    pricing?: {
        price: number;
        salePrice?: number;
        priceWithTax: number;
        salePriceWithTax?: number;
        taxAmount: number;
        saleTaxAmount?: number;
        finalPrice: number;
        originalPrice: number;
        isOnSale: boolean;
        discountPercent?: number;
        taxRate: number;
        taxName?: string;
    };
}
