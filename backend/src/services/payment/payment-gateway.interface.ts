/**
 * Payment Gateway Interface
 * All payment gateway services must implement this interface
 */

export interface PaymentResponse {
    success: boolean;
    paymentId?: string;
    orderId?: string;
    amount: number;
    currency: string;
    status: 'pending' | 'success' | 'failed';
    gatewayResponse?: any;
    redirectUrl?: string; // For redirect-based gateways
    clientSecret?: string; // For client-side confirmation (Stripe)
}

export interface RefundResponse {
    success: boolean;
    refundId?: string;
    amount: number;
    status: 'pending' | 'success' | 'failed';
    gatewayResponse?: any;
}

export interface WebhookVerification {
    isValid: boolean;
    event?: string;
    paymentId?: string;
    orderId?: string;
    status?: 'success' | 'failed';
    amount?: number;
    data?: any;
}

export interface IPaymentGateway {
    /**
     * Create a payment/order in the gateway
     */
    createPayment(params: {
        orderId: string;
        amount: number;
        currency: string;
        customerEmail?: string;
        customerName?: string;
        description?: string;
        metadata?: Record<string, any>;
        shippingAddress?: {
            firstName: string;
            lastName: string;
            address1: string;
            address2?: string;
            city: string;
            state: string;
            country: string;
            postalCode: string;
            phone: string;
        };
    }): Promise<PaymentResponse>;

    /**
     * Verify payment signature/webhook
     */
    verifyWebhook(params: {
        signature: string;
        payload: any;
        webhookSecret: string;
    }): Promise<WebhookVerification>;

    /**
     * Process refund
     */
    processRefund(params: {
        paymentId: string;
        amount: number;
        reason?: string;
    }): Promise<RefundResponse>;

    /**
     * Get payment status
     */
    getPaymentStatus(paymentId: string): Promise<{
        status: 'pending' | 'success' | 'failed' | 'refunded';
        amount?: number;
        currency?: string;
    }>;
}

/**
 * Base Payment Gateway Class
 * Provides common functionality for all gateways
 */
export abstract class BasePaymentGateway implements IPaymentGateway {
    protected credentials: any;
    protected isTestMode: boolean;

    constructor(credentials: any, isTestMode: boolean = false) {
        this.credentials = credentials;
        this.isTestMode = isTestMode;
    }

    abstract createPayment(params: {
        orderId: string;
        amount: number;
        currency: string;
        customerEmail?: string;
        customerName?: string;
        description?: string;
        metadata?: Record<string, any>;
        shippingAddress?: {
            firstName: string;
            lastName: string;
            address1: string;
            address2?: string;
            city: string;
            state: string;
            country: string;
            postalCode: string;
            phone: string;
        };
    }): Promise<PaymentResponse>;

    abstract verifyWebhook(params: {
        signature: string;
        payload: any;
        webhookSecret: string;
    }): Promise<WebhookVerification>;

    abstract processRefund(params: {
        paymentId: string;
        amount: number;
        reason?: string;
    }): Promise<RefundResponse>;

    abstract getPaymentStatus(paymentId: string): Promise<{
        status: 'pending' | 'success' | 'failed' | 'refunded';
        amount?: number;
        currency?: string;
    }>;

    /**
     * Common helper to format amount (convert to smallest currency unit)
     */
    protected formatAmount(amount: number, currency: string): number {
        // Most currencies use 2 decimal places (cents)
        // Some currencies like JPY use 0 decimal places
        const zeroCurrencies = ['JPY', 'KRW', 'VND'];

        if (zeroCurrencies.includes(currency.toUpperCase())) {
            return Math.round(amount);
        }

        return Math.round(amount * 100);
    }

    /**
     * Common helper to parse amount (convert from smallest currency unit)
     */
    protected parseAmount(amount: number, currency: string): number {
        const zeroCurrencies = ['JPY', 'KRW', 'VND'];

        if (zeroCurrencies.includes(currency.toUpperCase())) {
            return amount;
        }

        return amount / 100;
    }
}
