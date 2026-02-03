export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'return_requested' | 'exchange_requested' | 'returned' | 'partially_returned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'razorpay' | 'stripe' | 'paypal' | 'cod';

export interface OrderItem {
    productId: string | { _id: string; name: string; slug: string; images: string[] };
    variantId?: string;
    name: string;
    sku: string;
    hsnCode?: string;
    price: number;
    originalPrice?: number;
    discountedPrice?: number;
    quantity: number;
    image?: string;
    attributes?: Record<string, string>;
    weight?: number;
    manualDiscount?: number;
    // Per-item tax amount (per unit)
    taxAmount?: number;
    // Shipping cost charged for this item (for full quantity)
    shippingCost?: number;
    // Return/exchange window and flag
    returnWindowDays?: number;
    exchangeWindowDays?: number;
    isReturnable?: boolean;
    discount?: {
        amount?: number;
        appliedAt?: string; // ISO date string
        discountType?: 'fixed' | 'percentage';
        discountedPrice?: number;
        originalPrice?: number;
    }
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
    isPOSOrder?: boolean;
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
    returnStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'pickup_scheduled' | 'picked_up' | 'received' | 'inspected' | 'refund_initiated' | 'refund_completed' | 'exchange_shipped' | 'completed' | 'cancelled';
    paymentId?: string;
    paymentDetails?: Record<string, any>;
    refundStatus?: 'none' | 'requested' | 'approved' | 'rejected' | 'processed';
    refundReason?: string;
    refundRequestedAt?: string; // ISO date string
    
    // Tracking
    trackingNumber?: string;
    courierName?: string;
    trackingUrl?: string;
    shippedAt?: string; // ISO date string
    deliveredAt?: string; // ISO date string

    // Notes
    customerNote?: string;
    adminNote?: string;

    // Returns history
    returns?: Array<{
        _id?: string;
        returnedAt: string;
        items: Array<{
            productId: string | { _id: string };
            variantId?: string;
            quantity: number;
            reason: string;
            refundAmount: number;
        }>;
        totalRefundAmount?: number;
        refundAmount?: number;
        refundMethod?: string;
        refundReference?: string;
        processedBy?: string;
        note?: string;
    }>;

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
