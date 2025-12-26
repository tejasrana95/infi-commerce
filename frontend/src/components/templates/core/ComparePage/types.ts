// ComparePage Types - Shared between Core and Templates

import { CompareConfig } from '@/types';

// ============================================
// Product Data for Comparison
// ============================================

export interface CompareProductSpec {
    name: string;
    value: any;
    type: string;
}

export interface CompareProduct {
    _id: string;
    name: string;
    slug: string;
    sku: string;
    description?: string;
    images: string[];
    featuredImage?: string;
    brand?: {
        _id: string;
        name: string;
        slug: string;
    };
    categories: Array<{
        _id: string;
        name: string;
        slug: string;
    }>;
    stockStatus: string;
    averageRating?: number;
    reviewCount?: number;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
        unit: string;
    };
    price: number;
    salePrice?: number;
    isOnSale: boolean;
    pricing: {
        regularPrice: number;
        finalPrice: number;
        discountAmount: number;
    };
    specifications: Record<string, CompareProductSpec>;
}

export interface CompareAttribute {
    id: string;
    name: string;
    slug: string;
    type: string;
}

// ============================================
// Container Props (passed to Template)
// ============================================

export interface ComparePageTemplateProps {
    // Products data
    products: CompareProduct[];
    comparisonAttributes: CompareAttribute[];

    // Configuration
    config: CompareConfig;

    // Formatting utilities
    formatPrice: (price: number) => string;
    currencySymbol: string;

    // State
    isLoading: boolean;
    error?: string;

    // Actions
    onRemoveProduct: (productId: string) => void;
    onClearAll: () => void;
    onViewProduct: (slug: string) => void;
    onAddToCart: (productId: string) => void;
    onAddToWishlist: (productId: string) => void;
}

// ============================================
// Comparison Row Types
// ============================================

export type ComparisonRowType =
    | 'image'
    | 'name'
    | 'price'
    | 'rating'
    | 'brand'
    | 'stock'
    | 'sku'
    | 'weight'
    | 'dimensions'
    | 'specification'
    | 'actions';

export interface ComparisonRow {
    type: ComparisonRowType;
    label: string;
    attributeSlug?: string; // For specification rows
}
