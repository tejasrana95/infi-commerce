
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

// Pricing object structure from backend - includes tax-inclusive prices
export interface ProductPricing {
    price: number;              // Base price (without tax)
    salePrice?: number;         // Sale price (without tax)
    priceWithTax: number;       // Price including tax
    salePriceWithTax?: number;  // Sale price including tax
    taxRate: number;            // Tax percentage rate
    taxAmount: number;          // Calculated tax amount
    finalPrice: number;         // Final display price (with tax, either sale or regular)
    originalPrice: number;      // Original price with tax (for strikethrough display)
    isOnSale: boolean;          // Whether product is on sale
    discountPercent?: number;   // Discount percentage
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    price: number;              // Base price (without tax)
    salePrice?: number;         // Sale price (without tax)
    stock: number;
    image: string;
    type: 'simple' | 'variable';
    categoryIds: string[];
    attributes?: ProductAttribute[];
    variants?: ProductVariant[];
    taxRate?: number;
    taxAmount?: number;
    productOptions?: ProductOption[];
    pricing?: ProductPricing;   // Full pricing object with tax-inclusive prices
}

export interface ProductAttribute {
    id: string;
    name: string;
    options: string[];
}

export interface ProductVariant {
    id: string;
    sku: string;
    barcode?: string;
    attributes: Record<string, string>; // e.g. { Size: 'L', Color: 'Red' }
    price: number;              // Base price (without tax)
    salePrice?: number;         // Sale price (without tax)
    stock: number;
    image?: string;
    taxRate?: number;
    taxAmount?: number;
    pricing?: ProductPricing;   // Full pricing object with tax-inclusive prices
    priceWithTax?: number; // Price including tax
    salePriceWithTax?: number; // Sale price including tax
    finalPrice?: number; // Final display price (with tax, either sale or regular)
}

export interface Category {
    id: string;
    _id: string;
    name: string;
    slug: string;
    parentCategory?: Category;
    image?: string;
}

export interface CartItem {
    cartId: string; // Unique ID for cart item (product + variant)
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number; // Final price including tax (sale price with tax if on sale)
    quantity: number;
    image: string;
    attributes?: Record<string, string>; // Display selected attributes
    taxRate: number;
    taxAmount: number; // Unit tax amount
    basePrice: number; // Unit price without tax
    originalPrice?: number; // Original price with tax (for strikethrough when on sale)
    discountAmount?: number; // Discount per unit
    discountType?: 'fixed' | 'percentage'; // Type of discount
}

export interface Customer {
    _id?: string;
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    addresses?: Array<{
        type: 'billing' | 'shipping';
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        phone: string;
        isDefault: boolean;
    }>;
    totalOrders: number;
    totalSpent: number;
}

export interface User {
    _id: string;
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    role: string;
    storeIds: string[];
    permissions: string[];
    posPermissions?: {
        canApplyDiscount?: boolean;
    };
    twoFactorEnabled: boolean;
}

export interface POCSession {
    id: string;
    storeId: string;
    userId: string;
    openedAt: string;
    openingBalance: number;
    status: 'active' | 'closed';
}

export type OrderStatus = 'completed' | 'pending' | 'cancelled' | 'refunded' | 'delivered' | 'returned' | 'partially_returned';

export interface OrderItem {
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    originalPrice: number;      // Price before any discount (per unit)
    price: number;              // Final price after all discounts (per unit)
    quantity: number;
    image: string;
    attributes?: Record<string, string>;
    categoryIds?: string[];     // Product categories for display
    taxRate?: number;
    taxAmount?: number;         // Tax per unit
    // Optional fields for compatibility with other parts of the app
    discountedPrice?: number;
    shippingCost?: number;
    // Discount breakdown (per unit)
    discountAmount?: number;    // Total discount per unit
    couponDiscount?: number;    // Coupon portion per unit
    manualDiscount?: number;    // Manual/POS discount per unit
    isCouponEligible?: boolean; // Was this item eligible for coupon?
    // Return tracking
    returnedQuantity?: number;
    refundedAmount?: number;
}

export interface ReturnItem {
    productId?: string;
    quantity?: number;
    variantId?: string;
    refundAmount?: number;
    reason?: string;
    _id?: string;
}

export interface Return {
    items: ReturnItem[];
    notes?: string;
    processedBy?: string;
    refundMethod?: 'cash' | 'card' | 'upi' | 'qr' | 'stripe' | 'razorpay' | 'paypal';
    refundReference?: string;
    returnedAt?: string;
    totalRefundAmount?: number;
    _id?: string;
}
export interface Order {
    id: string;
    orderNumber: string;
    date: string;
    status: OrderStatus;
    customerId: string | Customer | null;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'cash' | 'card' | 'upi' | 'qr' | 'stripe' | 'razorpay' | 'paypal';
    cashReceived?: number;
    change?: number;
    notes?: string;
    discount?: number;
    couponCode?: string;
    returns?: Return[];
    discountsApplied?: Array<{
        productId: string;
        variantId?: string;
        discountAmount: number;
        discountType: 'fixed' | 'percentage';
        originalPrice: number;
        quantity: number;
    }>;
}

export interface StoreSettings {
    storeName: string;
    storeAddress: string;
    storePhone: string;
    storeEmail: string;
    taxRate: number;
    currency: string;
    receiptHeader: string;
    receiptFooter: string;
    printAutomatically: boolean;
    soundEnabled: boolean;
}
