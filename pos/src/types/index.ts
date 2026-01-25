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

export type OrderStatus = 'completed' | 'pending' | 'cancelled' | 'refunded' | 'delivered';

export interface OrderItem {
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    image: string;
    attributes?: Record<string, string>;
    taxRate?: number;
    taxAmount?: number;
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
