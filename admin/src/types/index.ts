export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
}

export interface Store {
  _id: string;
  name: string;
  description?: string;
  domain: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  parentCategory?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attribute {
  _id: string;
  name: string;
  values: string[];
  type: 'select' | 'text' | 'number' | 'boolean';
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  salePrice?: number;
  cost?: number;
  stock: number;
  images?: string[];
  category?: string;
  store?: string;
  attributes?: Record<string, any>;
  isActive: boolean;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Geo {
  _id: string;
  name: string;
  type: 'country' | 'state' | 'city' | 'zone';
  code?: string;
  parent?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeoGroup {
  _id: string;
  name: string;
  description?: string;
  geos: string[];
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
