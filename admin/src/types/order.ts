export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'return_requested' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'razorpay' | 'stripe' | 'paypal' | 'cod';

export interface OrderItem {
    productId: string | { _id: string; name: string; slug: string; images: string[] };
    variantId?: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    image?: string;
    attributes?: Record<string, string>;
    weight?: number;
}

export interface Address {
    firstName: string;
    lastName: string;
    email?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
}

export interface Order {
    _id: string;
    storeId: string | { _id: string; name: string };
    customerId?: string | { _id: string; firstName: string; lastName: string; email: string };
    guestEmail?: string;
    orderNumber: string;
    items: OrderItem[];

    // Pricing
    subtotal: number;
    shippingCost: number;
    tax: number;
    discount: number;
    couponId?: string;
    couponCode?: string;
    total: number;
    currency: string;

    // Details
    shippingAddress: Address;
    billingAddress: Address;

    // Status
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    paymentId?: string;
    paymentDetails?: Record<string, any>;

    // Tracking
    trackingNumber?: string;
    courierName?: string;
    trackingUrl?: string;
    shippedAt?: string; // ISO date string
    deliveredAt?: string; // ISO date string

    // Notes
    customerNote?: string;
    adminNote?: string;

    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}

export interface OrderListResponse {
    success: boolean;
    data: Order[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface OrderDetailResponse {
    success: boolean;
    data: Order;
}
