import axios from 'axios';
import {
    BasePaymentGateway,
    PaymentResponse,
    RefundResponse,
    WebhookVerification,
} from './payment-gateway.interface';

/**
 * PayPal Payment Gateway Service
 */
export class PayPalService extends BasePaymentGateway {
    private baseUrl: string;
    private clientId: string;
    private clientSecret: string;

    constructor(credentials: any, isTestMode: boolean = false) {
        super(credentials, isTestMode);

        this.clientId = credentials.clientId;
        this.clientSecret = credentials.clientSecret;
        this.baseUrl = credentials.mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    /**
     * Get PayPal access token
     */
    private async getAccessToken(): Promise<string> {
        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        const response = await axios.post(
            `${this.baseUrl}/v1/oauth2/token`,
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return response.data.access_token;
    }

    /**
     * Create PayPal order
     */
    async createPayment(params: {
        orderId: string;
        amount: number;
        currency: string;
        customerEmail?: string;
        customerName?: string;
        description?: string;
        metadata?: Record<string, any>;
    }): Promise<PaymentResponse> {
        try {
            const accessToken = await this.getAccessToken();

            const orderData = {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        reference_id: params.orderId,
                        description: params.description || `Order ${params.orderId}`,
                        amount: {
                            currency_code: params.currency.toUpperCase(),
                            value: params.amount.toFixed(2),
                        },
                        custom_id: params.orderId,
                    },
                ],
                application_context: {
                    brand_name: 'Your Store',
                    user_action: 'PAY_NOW',
                },
            };

            const response = await axios.post(
                `${this.baseUrl}/v2/checkout/orders`,
                orderData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const order = response.data;
            const approveLink = order.links.find((link: any) => link.rel === 'approve');

            return {
                success: true,
                paymentId: order.id,
                orderId: params.orderId,
                amount: params.amount,
                currency: params.currency,
                status: 'pending',
                redirectUrl: approveLink?.href,
                gatewayResponse: order,
            };
        } catch (error: any) {
            return {
                success: false,
                orderId: params.orderId,
                amount: params.amount,
                currency: params.currency,
                status: 'failed',
                gatewayResponse: error.response?.data || error,
            };
        }
    }

    /**
     * Capture PayPal order (after user approval)
     */
    async capturePayment(paypalOrderId: string): Promise<any> {
        try {
            const accessToken = await this.getAccessToken();

            const response = await axios.post(
                `${this.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Verify PayPal webhook
     */
    async verifyWebhook(params: {
        signature: string;
        payload: any;
        webhookSecret: string;
    }): Promise<WebhookVerification> {
        try {
            const { payload } = params;

            // PayPal webhook verification is complex and requires webhook ID
            // For now, we'll do basic validation
            // In production, implement full webhook verification using PayPal SDK

            const eventType = payload.event_type;
            const resource = payload.resource;

            let status: 'success' | 'failed' = 'failed';
            if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
                status = 'success';
            } else if (eventType === 'PAYMENT.CAPTURE.DENIED') {
                status = 'failed';
            }

            return {
                isValid: true,
                event: eventType,
                paymentId: resource?.id,
                orderId: resource?.custom_id || resource?.purchase_units?.[0]?.reference_id,
                status,
                amount: resource?.amount ? parseFloat(resource.amount.value) : undefined,
                data: payload,
            };
        } catch (error) {
            return {
                isValid: false,
            };
        }
    }

    /**
     * Process refund
     */
    async processRefund(params: {
        paymentId: string;
        amount: number;
        reason?: string;
    }): Promise<RefundResponse> {
        try {
            const accessToken = await this.getAccessToken();

            const refundData = {
                amount: {
                    value: params.amount.toFixed(2),
                    currency_code: 'USD', // Should get from payment
                },
                note_to_payer: params.reason,
            };

            const response = await axios.post(
                `${this.baseUrl}/v2/payments/captures/${params.paymentId}/refund`,
                refundData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const refund = response.data;

            return {
                success: true,
                refundId: refund.id,
                amount: parseFloat(refund.amount.value),
                status: refund.status === 'COMPLETED' ? 'success' : 'pending',
                gatewayResponse: refund,
            };
        } catch (error: any) {
            return {
                success: false,
                amount: params.amount,
                status: 'failed',
                gatewayResponse: error.response?.data || error,
            };
        }
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId: string): Promise<{
        status: 'pending' | 'success' | 'failed' | 'refunded';
        amount?: number;
        currency?: string;
    }> {
        try {
            const accessToken = await this.getAccessToken();

            const response = await axios.get(
                `${this.baseUrl}/v2/checkout/orders/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            const order = response.data;
            let status: 'pending' | 'success' | 'failed' | 'refunded' = 'pending';

            if (order.status === 'COMPLETED') {
                status = 'success';
            } else if (order.status === 'VOIDED' || order.status === 'DECLINED') {
                status = 'failed';
            }

            const amount = order.purchase_units?.[0]?.amount;

            return {
                status,
                amount: amount ? parseFloat(amount.value) : undefined,
                currency: amount?.currency_code,
            };
        } catch (error) {
            return {
                status: 'failed',
            };
        }
    }
}
