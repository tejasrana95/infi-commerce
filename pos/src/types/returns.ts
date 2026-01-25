export interface ReturnItem {
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number; // Price paid per unit (after all discounts, including tax)
    quantityPurchased: number;
    quantityToReturn: number;
    reason: string;
    image: string;
    // Refund breakdown
    basePrice?: number; // Price without tax
    taxAmount?: number; // Tax amount for returned quantity
    discountAmount?: number; // Item-level discount
    couponAmount?: number; // Pro-rata coupon discount
    totalRefund?: number; // Total refund for this item
}

export interface ReturnOrder {
    originalOrderId: string;
    originalOrderNumber: string;
    items: ReturnItem[];
    subtotal: number;
    tax: number;
    total: number;
    refundMethod: 'cash' | 'card' | 'original';
    reason: string;
    // Refund breakdown
    breakdown?: {
        subtotal: number;
        itemDiscounts: number;
        couponDiscount: number;
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
        unitPrice: number;
        basePrice: number;
        taxAmount: number;
        discountAmount: number;
        couponAmount: number;
        totalRefund: number;
    }>;
    breakdown: {
        subtotal: number;
        itemDiscounts: number;
        couponDiscount: number;
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
