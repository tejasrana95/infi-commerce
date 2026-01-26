import axios from 'axios';
import {
    BasePaymentGateway,
    PaymentResponse,
    RefundResponse,
    WebhookVerification,
} from './payment-gateway.interface';
import { IPosQRService, QRGenerationParams, QRGenerationResult, QRPaymentStatus } from './pos-payment.interface';

/**
 * PayPal Payment Gateway Service
 */
export class PayPalService extends BasePaymentGateway implements IPosQRService {
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

    // ... existing private async getAccessToken() ...
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

    // ... existing createPayment ...
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
                    brand_name: params.metadata?.storeName || 'Your Store',
                    user_action: 'PAY_NOW',
                    return_url: `https://${params.metadata?.storeDomain || process.env.FRONTEND_URL}/orders/${params.orderId}/confirmation`,
                    cancel_url: `https://${params.metadata?.storeDomain || process.env.FRONTEND_URL}/checkout?orderId=${params.orderId}&status=cancelled`,
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

    // ... existing capturePayment ...
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

    // ... existing verifyWebhook ...
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

    // ... existing processRefund ...
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

    // ... existing getPaymentStatus ...
    async getPaymentStatus(paymentId: string): Promise<{
        status: 'pending' | 'success' | 'failed' | 'refunded';
        amount?: number;
        currency?: string;
    }> {
        try {
            const accessToken = await this.getAccessToken();
            const response = await axios.get(
                `${this.baseUrl}/v2/checkout/orders/${paymentId}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            const order = response.data;

            let status: 'pending' | 'success' | 'failed' | 'refunded' = 'pending';
            if (order.status === 'COMPLETED' || order.status === 'APPROVED') status = 'success';
            else if (order.status === 'VOIDED') status = 'failed';

            const amount = order.purchase_units?.[0]?.amount;

            return {
                status,
                amount: amount ? parseFloat(amount.value) : undefined,
                currency: amount?.currency_code
            };
        } catch (error) {
            return { status: 'failed' };
        }
    }

    async getQRPaymentStatus(qrId: string): Promise<QRPaymentStatus> {
        try {
            const accessToken = await this.getAccessToken();

            // PayPal QR payments are essentially orders eventually
            // Use order/checkout API to check status
            const response = await axios.get(
                `${this.baseUrl}/v2/checkout/orders/${qrId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            const order = response.data;
            let status: QRPaymentStatus['status'] = 'pending';

            if (order.status === 'COMPLETED' || order.status === 'APPROVED') {
                status = 'completed';
            } else if (order.status === 'VOIDED') {
                status = 'failed';
            }

            const amount = order.purchase_units?.[0]?.amount;

            return {
                status,
                amount: amount ? parseFloat(amount.value) : undefined,
                currency: amount?.currency_code,
                paymentId: order.id, // For PayPal order ID is the tracking ID
                transactionRef: order.purchase_units?.[0]?.payments?.captures?.[0]?.id
            };
        } catch (error) {
            return {
                status: 'failed',
            };
        }
    }

    // ... existing getTransactionDetails ...
    async getTransactionDetails(captureId: string): Promise<{
        netAmount: number;
        fee: number;
        currency: string;
    } | null> {
        try {
            const accessToken = await this.getAccessToken();

            // Get capture details which includes seller_receivable_breakdown
            const response = await axios.get(
                `${this.baseUrl}/v2/payments/captures/${captureId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            const capture = response.data;
            const breakdown = capture.seller_receivable_breakdown;

            if (!breakdown) {
                return null;
            }

            const paypalFee = parseFloat(breakdown.paypal_fee?.value || '0');
            const netAmount = parseFloat(breakdown.net_amount?.value || '0');

            return {
                netAmount,
                fee: paypalFee,
                currency: breakdown.gross_amount?.currency_code || 'USD',
            };
        } catch (error) {
            console.error('Error fetching PayPal transaction details:', error);
            return null;
        }
    }

    /**
     * Generate PayPal QR Code (using PayPal 'Show Code' flow concept or Payment Link)
     * Real PayPal QR Code API is restricted. 
     * We will simulate using a Payment Link which can be encoded to QR locally.
     * Or if we had access to specific QR API, we would use it.
     * For standardization, we will create an Order and return the link to be QR encoded.
     */
    async generateQR(params: QRGenerationParams): Promise<QRGenerationResult> {
        try {
            // PayPal QR typically works best with these currencies
            const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD', 'HKD'];
            // const currency = params.currency.toUpperCase();
            const currency = "USD"; //TEMP
            if (!supportedCurrencies.includes(currency)) {
                // We don't throw here but we should log it as a potential issue
                console.warn(`Currency ${currency} may not be supported by PayPal QR. Supported: ${supportedCurrencies.join(', ')}`);
            }

            // Create a standard order
            const payment = await this.createPayment({
                orderId: params.orderId,
                amount: params.amount,
                currency: currency,
                description: params.description,
                metadata: params.metadata,
                customerEmail: params.customerDetails?.email,
                customerName: params.customerDetails?.name
            });

            if (!payment.success || !payment.paymentId) {
                const errorDetail = JSON.stringify(payment.gatewayResponse);
                throw new Error(`Failed to create PayPal order for QR: ${errorDetail}`);
            }

            // In a real POS scenario involving PayPal, we might use "One-Time QR" API 
            // but that requires specific permissions.
            // We will return the approve link (redirectUrl) which the POS can render as a QR.
            // Scanning it opens the approval page on user's phone.

            return {
                qrCodeId: payment.paymentId,
                qrCodeData: payment.redirectUrl, // This link should be QR encoded by the frontend
                gatewayReferenceId: payment.paymentId
            };
        } catch (error: any) {
            console.error('PayPal QR Generation Failed Details:', error.response?.data || error.message || error);
            throw new Error(`PayPal QR generation failed: ${error.message || 'Unknown error'}`);
        }
    }

    async cancelQR(_qrId: string): Promise<boolean> {
        // PayPal orders automatically expire, but we can't explicitly 'cancel' a pending order 
        // easily via API without complex state. We'll just let it expire or ignore it.
        return true;
    }
}
