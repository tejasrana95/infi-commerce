import { apiClient } from "./api-client";


export interface CheckoutValidationResponse {
    valid: boolean;
    cart: {
        items: any[];
        subtotal: number;
        itemCount: number;
    };
    storeConfig: {
        guestCheckoutEnabled: boolean;
        shippingEnabled: boolean;
        minOrderAmount?: number;
        maxOrderAmount?: number;
        requireEmailVerification: boolean;
    };
    issues: string[];
}

export interface Address {
    _id?: string;
    type: 'shipping' | 'billing';
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
    isDefault?: boolean;
}

export interface ShippingMethod {
    id: string;
    name: string;
    description?: string;
    cost: number;
    currency: string;
    estimatedDays: string;
}

export interface TaxBreakdown {
    name: string;
    rate: number;
    amount: number;
    taxRateId: string;
    isSplit?: boolean;
    subTaxes?: Array<{
        name: string;
        rate: number;
    }>;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: 'online' | 'offline';
    icon?: string;
    description?: string;
    available: boolean;
    extraCharge?: number;
    order: number;
}

export interface OrderResponse {
    success: boolean;
    message: string;
    order: {
        orderId: string;
        orderNumber: string;
        total: number;
        currency: string;
        paymentMethod: string;
        paymentRequired: boolean;
        status: string;
    };
}

/**
 * Validate cart before starting checkout
 */
export async function validateCheckout(): Promise<CheckoutValidationResponse> {
    const response = await apiClient.post('/checkout/validate', {});
    return response;
}

/**
 * Get saved addresses for logged-in user
 */
export async function getAddresses(): Promise<{ addresses: Address[] }> {
    const response = await apiClient.get('/checkout/addresses');
    return response;
}

/**
 * Add new address for logged-in user
 */
export async function addAddress(address: Omit<Address, '_id'>): Promise<{ success: boolean; address: Address }> {
    const response = await apiClient.post('/checkout/addresses', address);
    return response;
}

/**
 * Calculate shipping using smart calculation (category priority > geo > fallback)
 */
export async function getShippingMethods(
    shippingAddress: Partial<Address>,
    cartItems: any[]
): Promise<{
    shippingCost: number;
    currency: string;
    name?: string;
    description?: string;
    breakdown: any[];
    orderSummary: any;
    success?: boolean;
    restrictedItems?: string[];
}> {
    // Transform cart items to the format expected by the API
    const items = cartItems.map(item => ({
        productId: typeof item.productId === 'object' ? item.productId._id : (item.productId || item._id),
        variantId: item.variantId,
        quantity: item.quantity
    }));

    const response = await apiClient.post('shipping/calculate-smart', {
        country: shippingAddress.country,
        items,
    });
    return response;
}

/**
 * Calculate tax based on shipping address
 */
export async function calculateTax(
    shippingAddress: Partial<Address>,
    shippingCost?: number
): Promise<{
    taxBreakdown: TaxBreakdown[];
    totalTax: number;
    taxableAmount: number;
    splitTax: boolean;
}> {
    const response = await apiClient.post('/checkout/calculate-tax', { shippingAddress, shippingCost });
    return response;
}

/**
 * Apply coupon code
 */
export async function applyCoupon(couponCode: string): Promise<{
    valid: boolean;
    coupon: {
        code: string;
        discountType: 'flat' | 'percentage';
        discountValue: number;
        discountAmount: number;
        description?: string;
    };
    newSubtotal: number;
}> {
    const response = await apiClient.post('/checkout/apply-coupon', { couponCode });
    return response;
}

/**
 * Remove applied coupon
 */
export async function removeCoupon(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete('/checkout/remove-coupon');
    return response;
}

/**
 * Get available payment methods
 */
export async function getPaymentMethods(
    country?: string,
    amount?: number,
    currency?: string
): Promise<{ methods: PaymentMethod[]; currency: string }> {
    const payload: any = {};
    if (country) payload.country = country;
    if (amount) payload.amount = amount;
    if (currency) payload.currency = currency;

    const response = await apiClient.post('/payment-gateways/available', payload);
    return {
        methods: response.data,
        currency: currency || response.currency || 'USD'
    };
}

/**
 * Create order
 */
export async function createOrder(orderData: {
    shippingAddress: Address;
    billingAddress: Address;
    shippingMethodId?: string;
    paymentMethod: string;
    currency: string;
    customerNote?: string;
    guestEmail?: string;
    saveAddress?: boolean;
}): Promise<OrderResponse> {
    const response = await apiClient.post('/checkout/create-order', orderData);
    return response;
}

export interface GeoCountry {
    _id: string;
    countryCode: string;
    countryName: string;
    isActive: boolean;
    isShippingAvailable: boolean;
    states: {
        _id: string;
        code: string;
        name: string;
        isActive: boolean;
        cities: {
            _id: string;
            name: string;
            isActive: boolean;
        }[];
    }[];
}

/**
 * Get countries hierarchical data
 */
export async function getCountries(): Promise<{ countries: GeoCountry[] }> {
    const response = await apiClient.get('/geo/countries');
    return response;
}
