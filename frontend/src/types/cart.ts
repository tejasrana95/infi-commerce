// Cart-related types and interfaces

export interface CartItem {
    _id: string;
    productId: string | { _id: string };
    variantId?: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    image?: string;
    attributes?: Record<string, string>;
    priceWithTax?: number;
}

export interface Cart {
    _id: string;
    userId?: string;
    sessionId?: string;
    storeId: string;
    items: CartItem[];
    subtotal: number;
    shippingCost: number;
    discount: number;
    tax: number;
    total: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface AddToCartParams {
    productId: string;
    variantId?: string;
    quantity: number;
    storeId: string;
}

export interface UpdateCartItemParams {
    itemId: string;
    quantity: number;
}
