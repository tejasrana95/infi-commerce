export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
}

export interface Store {
  _id: string;
  name: string;
  slug: string;
  domain: string;
  description?: string;
  logo?: string;
  favicon?: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  settings?: {
    emailNotifications?: boolean;
    orderNotifications?: boolean;
    maintenanceMode?: boolean;
    allowGuestCheckout?: boolean;
    requireEmailVerification?: boolean;
    minOrderAmount?: number;
    maxOrderAmount?: number;
    taxEnabled?: boolean;
    taxRate?: number;
    shippingEnabled?: boolean;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

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
  };

  level: number;
  path: string;
  sortOrder: number;
  isVisible: boolean;

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

export interface Currency {
  _id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBaseCurrency: boolean;
  isActive: boolean;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  thousandsSeparator: string;
  decimalSeparator: string;
  createdAt: string;
  updatedAt: string;
}

export interface Geo {
  _id: string;
  name: string;
  type: 'country' | 'state' | 'city';
  code?: string;
  parentId?: string | Geo; // Can be populated
  isActive: boolean;
  isShippingAvailable?: boolean; // Only for countries
  createdAt: string;
  updatedAt: string;
}

export interface GeoGroup {
  _id: string;
  name: string;
  storeId: string;
  description?: string;
  geos: string[]; // Deprecated, use countries
  countries?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingRule {
  _id: string;
  name: string;
  description?: string;
  geoGroup?: string;
  minWeight?: number;
  maxWeight?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  shippingCost: number;
  estimatedDays?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
