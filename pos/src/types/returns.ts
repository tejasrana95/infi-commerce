export interface ReturnItem {
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number; // Final price per unit (after all discounts)
    originalPrice?: number; // Price before discounts
    quantityPurchased: number;
    quantityToReturn: number;
    reason: string;
    image: string;
    // Refund breakdown
    taxAmount?: number; // Tax amount for returned quantity
    discountAmount?: number; // Total discount for returned quantity
    couponDiscount?: number; // Coupon discount for returned quantity
    manualDiscount?: number; // Manual discount for returned quantity
    totalRefund?: number; // Total refund for this item
    isCouponEligible?: boolean;
}

export interface ReturnOrder {
    originalOrderId: string;
    originalOrderNumber: string;
    items: ReturnItem[];
    subtotal: number;
    tax: number;
    total: number;
    refundMethod: 'cash' | 'card' | 'original' | 'upi' | 'stripe' | 'razorpay' | 'paypal';
    reason: string;
    // Refund breakdown
    breakdown?: {
        subtotal: number;
        originalSubtotal: number;
        totalDiscount: number;
        couponDiscount: number;
        manualDiscount: number;
        tax: number;
        total: number;
    };
}

export interface RefundCalculation {
    refundAmount: number;
    itemRefunds: Array<{
        productId: string;
        variantId?: string;
        name: string;
        sku: string;
        quantity: number;
        originalPrice: number;
        unitPrice: number;
        taxAmount: number;
        discountAmount: number;
        couponDiscount: number;
        manualDiscount: number;
        totalRefund: number;
        isCouponEligible: boolean;
    }>;
    breakdown: {
        subtotal: number;
        originalSubtotal: number;
        totalDiscount: number;
        couponDiscount: number;
        manualDiscount: number;
        tax: number;
        total: number;
    };
}

export const RETURN_REASONS = [
    'Damaged/Defective',
    'Wrong Item',
    'Changed Mind',
    'Not as Described',
    'Quality Issues',
    'Other',
] as const;

export type ReturnReason = typeof RETURN_REASONS[number];
