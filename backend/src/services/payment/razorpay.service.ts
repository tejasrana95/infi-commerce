import Razorpay from 'razorpay';
import crypto from 'crypto';
import {
    BasePaymentGateway,
    PaymentResponse,
    RefundResponse,
    WebhookVerification,
} from './payment-gateway.interface';

/**
 * Razorpay Payment Gateway Service
 */
export class RazorpayService extends BasePaymentGateway {
    private razorpay: Razorpay;

    constructor(credentials: any, isTestMode: boolean = false) {
        super(credentials, isTestMode);

        this.razorpay = new Razorpay({
            key_id: credentials.keyId,
            key_secret: credentials.keySecret,
        });
    }

    /**
     * Create Razorpay order
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
            const options = {
                amount: this.formatAmount(params.amount, params.currency),
                currency: params.currency.toUpperCase(),
                receipt: params.orderId,
                notes: {
                    orderId: params.orderId,
                    customerEmail: params.customerEmail,
                    ...params.metadata,
                },
            };

            const order = await this.razorpay.orders.create(options as any);

            return {
                success: true,
                paymentId: order.id,
                orderId: params.orderId,
                amount: params.amount,
                currency: params.currency,
                status: 'pending',
                gatewayResponse: order,
            };
        } catch (error: any) {
            return {
                success: false,
                orderId: params.orderId,
                amount: params.amount,
                currency: params.currency,
                status: 'failed',
                gatewayResponse: error,
            };
        }
    }

    /**
     * Verify Razorpay webhook signature
     */
    async verifyWebhook(params: {
        signature: string;
        payload: any;
        webhookSecret: string;
    }): Promise<WebhookVerification> {
        try {
            const { signature, payload, webhookSecret } = params;

            // Generate expected signature
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(payload))
                .digest('hex');

            const isValid = expectedSignature === signature;

            if (!isValid) {
                return { isValid: false };
            }

            // Parse webhook event
            const event = payload.event;
            const paymentEntity = payload.payload?.payment?.entity;

            return {
                isValid: true,
                event,
                paymentId: paymentEntity?.id,
                orderId: paymentEntity?.order_id,
                status: event === 'payment.captured' ? 'success' : 'failed',
                amount: paymentEntity?.amount ? this.parseAmount(paymentEntity.amount, paymentEntity.currency) : undefined,
                data: payload,
            };
        } catch (error) {
            return { isValid: false };
        }
    }

    /**
     * Verify payment signature (for client-side verification)
     */
    verifyPaymentSignature(params: {
        orderId: string;
        paymentId: string;
        signature: string;
    }): boolean {
        const { orderId, paymentId, signature } = params;

        const expectedSignature = crypto
            .createHmac('sha256', this.credentials.keySecret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        return expectedSignature === signature;
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
            const refundResult = await this.razorpay.payments.refund(params.paymentId, {
                amount: this.formatAmount(params.amount, 'INR'), // Razorpay uses INR by default
                notes: {
                    reason: params.reason || null,
                },
            } as any);

            return {
                success: true,
                refundId: refundResult.id,
                amount: this.parseAmount(Number(refundResult.amount), 'INR'),
                status: refundResult.status === 'processed' ? 'success' : 'pending',
                gatewayResponse: refundResult,
            };
        } catch (error: any) {
            return {
                success: false,
                amount: params.amount,
                status: 'failed',
                gatewayResponse: error,
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
            const payment = await this.razorpay.payments.fetch(paymentId);

            let status: 'pending' | 'success' | 'failed' | 'refunded' = 'pending';

            if (payment.status === 'captured') {
                status = 'success';
            } else if (payment.status === 'failed') {
                status = 'failed';
            } else if (payment.status === 'refunded') {
                status = 'refunded';
            }

            return {
                status,
                amount: this.parseAmount(Number(payment.amount), payment.currency),
                currency: payment.currency,
            };
        } catch (error) {
            return {
                status: 'failed',
            };
        }
    }

    /**
     * Get settlement details for accounting
     * Retrieves fee information from captured payment
     */
    async getSettlementDetails(paymentId: string): Promise<{
        settledAmount: number;
        fee: number;
        tax: number;
        currency: string;
    } | null> {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);

            // Razorpay includes fee info directly in the payment object
            const amount = Number(payment.amount);
            const fee = Number(payment.fee || 0);
            const tax = Number(payment.tax || 0);

            // Settled amount = amount - fee - tax
            const settledAmount = this.parseAmount(amount - fee - tax, payment.currency);

            return {
                settledAmount,
                fee: this.parseAmount(fee, payment.currency),
                tax: this.parseAmount(tax, payment.currency),
                currency: payment.currency.toUpperCase(),
            };
        } catch (error) {
            console.error('Error fetching Razorpay settlement details:', error);
            return null;
        }
    }
}
