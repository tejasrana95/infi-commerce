export interface ReturnItem {
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number;
    quantityPurchased: number;
    quantityToReturn: number;
    reason: string;
    image: string;
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
