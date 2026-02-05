import Razorpay from 'razorpay';
import crypto from 'crypto';
import {
    BasePaymentGateway,
    PaymentResponse,
    RefundResponse,
    WebhookVerification,
} from './payment-gateway.interface';
import { IPosQRService, QRGenerationParams, QRGenerationResult, QRPaymentStatus } from './pos-payment.interface';

/**
 * Razorpay Payment Gateway Service
 */
export class RazorpayService extends BasePaymentGateway implements IPosQRService {
    private razorpay: Razorpay;
    // ... existing constructor ...

    constructor(credentials: any, isTestMode: boolean = false) {
        super(credentials, isTestMode);

        const keyId = credentials.keyId || credentials.key_id || credentials.apiKey;
        const keySecret = credentials.keySecret || credentials.key_secret || credentials.apiSecret;

        this.razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }

    // ... existing methods ...

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

    // ... verifyWebhook ...
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

            // Secure constant-time comparison
            const expectedBuffer = Buffer.from(expectedSignature);
            const signatureBuffer = Buffer.from(signature);
            const isValid = expectedBuffer.length === signatureBuffer.length &&
                crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

            if (!isValid) {
                return { isValid: false };
            }

            // Parse webhook event
            const event = payload.event;
            // QR events payload structure difference might exist
            let paymentId, orderId, paymentEntity;

            if (event.startsWith('qrcode.')) {

                paymentEntity = payload.payload?.payment?.entity;
                paymentId = paymentEntity?.id;
                // For QR, order ID logic might differ if not explicitly linked, 
                // but we store our internal ref in notes if possible, or just look up by QR ID
            } else {
                paymentEntity = payload.payload?.payment?.entity;
                paymentId = paymentEntity?.id;
                orderId = paymentEntity?.order_id;
            }

            return {
                isValid: true,
                event,
                paymentId,
                orderId,
                status: (event === 'payment.captured' || event === 'qrcode.credited') ? 'success' : 'failed',
                amount: paymentEntity?.amount ? this.parseAmount(paymentEntity.amount, paymentEntity.currency) : undefined,
                data: payload,
            };
        } catch (error) {
            return { isValid: false };
        }
    }

    // ... verifyPaymentSignature ...
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

        // Secure constant-time comparison
        const expectedBuffer = Buffer.from(expectedSignature);
        const signatureBuffer = Buffer.from(signature);
        return expectedBuffer.length === signatureBuffer.length &&
            crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    }

    // ... processRefund ...
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

    // ... getPaymentStatus (generic) ... we'll need to update or overload this for generic use, 
    // but the interface requires getPaymentStatus(qrId). 
    // Since getPaymentStatus in base class takes paymentId, we might need a separate implementation 
    // or intelligent branching.
    // However, IPosQRService defines getPaymentStatus(qrId). 
    // Typescript allows implementation to match.
    // The base class usually returns a different shape. Typescript might complain if signatures don't match.
    // Let's implement the specific QR methods separate from the base class helper overrides where possible or union them.

    // NOTE: BasePaymentGateway.getPaymentStatus returns Promise<{status, amount, currency}>
    // IPosQRService.getPaymentStatus returns Promise<QRPaymentStatus>
    // These are compatible enough if we extend the return type or just implement it.

    // Let's implement specific QR methods.

    /**
     * Generate UPI QR Code
     */
    async generateQR(params: QRGenerationParams): Promise<QRGenerationResult> {
        try {
            // Razorpay QR API
            // docs: https://razorpay.com/docs/api/qr-codes/create/
            const qrRequest = {
                type: 'upi_qr',
                name: params.metadata?.storeName || 'Store QR',
                usage: 'single_use',
                fixed_amount: true,
                payment_amount: this.formatAmount(params.amount, params.currency),
                description: params.description || `Order ${params.orderId}`,
                customer_id: undefined, // Optional, if we had a razorpay customer ID
                notes: {
                    orderId: params.orderId,
                    storeId: params.storeId,
                    ...params.metadata
                }
            };
            const response: any = await (this.razorpay as any).qrCode.create(qrRequest);

            return {
                qrCodeId: response.id,
                qrCodeUrl: response.image_url,
                paymentLink: response.payment_link, // Check if this exists
                gatewayReferenceId: response.id
            };
        } catch (error: any) {
            console.error('Razorpay QR Generation Full Error:', JSON.stringify(error, null, 2));
            // Log raw error message if JSON.stringify misses it
            if (!error.error) console.error('Razorpay Error Object:', error);

            throw new Error(error.error?.description || error.message || 'Failed to generate Razorpay QR');
        }
    }

    /**
     * Get Payment Status for a QR
     * For Razorpay, we can fetch the QR and check its payments or status.
     * Use fetch(qrId) to get stats, but to get actual payment status we usually look for payments associated.
     * Razorpay QR has 'payments_amount_received' etc.
     */
    /**
     * Get Payment Status (Base Implementation)
     */
    async getPaymentStatus(paymentId: string): Promise<{
        status: 'pending' | 'success' | 'failed' | 'refunded';
        amount?: number;
        currency?: string;
    }> {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);

            let status: 'pending' | 'success' | 'failed' | 'refunded' = 'pending';
            if (payment.status === 'captured') status = 'success';
            else if (payment.status === 'failed') status = 'failed';
            else if (payment.status === 'refunded') status = 'refunded';

            return {
                status,
                amount: this.parseAmount(Number(payment.amount), payment.currency),
                currency: payment.currency
            };
        } catch (error) {
            return { status: 'failed' };
        }
    }

    /**
     * Get QR Payment Status (IPosQRService Implementation)
     */
    async getQRPaymentStatus(qrId: string): Promise<QRPaymentStatus> {
        // If qrId starts with 'pay_', it's a payment ID, not a QR ID.
        if (qrId.startsWith('pay_')) {
            const status = await this.getPaymentStatus(qrId);
            // Map Base status to QR status
            let qrStatus: QRPaymentStatus['status'] = 'pending';
            if (status.status === 'success') qrStatus = 'completed';
            else if (status.status === 'failed') qrStatus = 'failed';

            return {
                status: qrStatus,
                amount: status.amount,
                currency: status.currency,
                paymentId: qrId
            };
        }

        try {
            // Fetch QR details
            const response: any = await (this.razorpay as any).qrCode.fetch(qrId);

            if (response.status === 'closed' && response.payments_amount_received > 0) {
                return {
                    status: 'completed',
                    amount: this.parseAmount(response.payments_amount_received, 'INR'),
                    currency: 'INR'
                };
            }

            return {
                status: 'pending',
                amount: 0,
                currency: 'INR'
            };
        } catch (error) {
            console.error('Razorpay QR Status Error:', error);
            return { status: 'failed' };
        }
    }



    async cancelQR(qrId: string): Promise<boolean> {
        try {
            await (this.razorpay as any).qrCode.close(qrId);
            return true;
        } catch (error) {
            return false;
        }
    }

    // ... getSettlementDetails ...
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
