
export interface Product {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    price: number;
    salePrice?: number; // Effective price if on sale
    stock: number;
    image: string;
    type: 'simple' | 'variable';
    categoryIds: string[];
    attributes?: ProductAttribute[];
    variants?: ProductVariant[];
    taxRate?: number;
    taxAmount?: number;
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
    price: number;
    stock: number;
    image?: string;
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
    price: number; // Final price including tax
    quantity: number;
    image: string;
    attributes?: Record<string, string>; // Display selected attributes
    taxRate: number;
    taxAmount: number; // Unit tax amount
    basePrice: number; // Unit price without tax
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
    refundMethod?: 'cash' | 'card' | 'original';
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
