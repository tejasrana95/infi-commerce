import Stripe from 'stripe';
import {
    BasePaymentGateway,
    PaymentResponse,
    RefundResponse,
    WebhookVerification,
} from './payment-gateway.interface';
import { IPosQRService, QRGenerationParams, QRGenerationResult, QRPaymentStatus } from './pos-payment.interface';

/**
 * Stripe Payment Gateway Service
 */
export class StripeService extends BasePaymentGateway implements IPosQRService {
    private stripe: Stripe;

    // ... implementation details ...
    constructor(credentials: any, isTestMode: boolean = false) {
        super(credentials, isTestMode);

        this.stripe = new Stripe(credentials.secretKey, {
            apiVersion: '2023-10-16',
        });
    }

    async createPayment(params: {
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
    }): Promise<PaymentResponse> {
        try {
            const amountInCents = Math.round(params.amount * 100);

            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amountInCents,
                currency: params.currency.toLowerCase(),
                description: params.description || `Order ${params.orderId}`,
                metadata: {
                    orderId: params.orderId,
                    customerEmail: params.customerEmail || '',
                    ...params.metadata,
                },
                receipt_email: params.customerEmail,
                // Add shipping details for Indian export compliance
                shipping: params.shippingAddress ? {
                    name: `${params.shippingAddress.firstName} ${params.shippingAddress.lastName}`,
                    address: {
                        line1: params.shippingAddress.address1,
                        line2: params.shippingAddress.address2 || undefined,
                        city: params.shippingAddress.city,
                        state: params.shippingAddress.state,
                        postal_code: params.shippingAddress.postalCode,
                        country: params.shippingAddress.country,
                    },
                    phone: params.shippingAddress.phone,
                } : undefined,
            });

            return {
                success: true,
                paymentId: paymentIntent.id,
                orderId: params.orderId,
                amount: params.amount,
                currency: params.currency,
                status: 'pending',
                clientSecret: paymentIntent.client_secret || undefined,
                gatewayResponse: paymentIntent,
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

    // ... existing verifyWebhook ...
    async verifyWebhook(params: {
        signature: string;
        payload: any;
        webhookSecret: string;
    }): Promise<WebhookVerification> {
        try {
            const { signature, payload, webhookSecret } = params;

            // Verify webhook signature
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret
            );

            // Parse event
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            let status: 'success' | 'failed' = 'failed';
            if (event.type === 'payment_intent.succeeded') {
                status = 'success';
            } else if (event.type === 'payment_intent.payment_failed') {
                status = 'failed';
            }

            return {
                isValid: true,
                event: event.type,
                paymentId: paymentIntent.id,
                orderId: paymentIntent.metadata?.orderId,
                status,
                amount: paymentIntent.amount ? this.parseAmount(paymentIntent.amount, paymentIntent.currency) : undefined,
                data: event,
            };
        } catch (error: any) {
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
            // Get the payment intent to get the currency
            const paymentIntent = await this.stripe.paymentIntents.retrieve(params.paymentId);

            const refund = await this.stripe.refunds.create({
                payment_intent: params.paymentId,
                amount: this.formatAmount(params.amount, paymentIntent.currency),
                reason: params.reason === 'requested_by_customer' ? 'requested_by_customer' : undefined,
            });

            return {
                success: true,
                refundId: refund.id,
                amount: this.parseAmount(refund.amount, refund.currency || 'usd'),
                status: refund.status === 'succeeded' ? 'success' : 'pending',
                gatewayResponse: refund,
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

    // ... existing getPaymentStatus ...
    /**
     * Get Payment Status (Base Implementation)
     */
    async getPaymentStatus(paymentId: string): Promise<{
        status: 'pending' | 'success' | 'failed' | 'refunded';
        amount?: number;
        currency?: string;
    }> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

            let status: 'pending' | 'success' | 'failed' | 'refunded' = 'pending';
            if (paymentIntent.status === 'succeeded') status = 'success';
            else if (paymentIntent.status === 'canceled') status = 'failed';
            else if (paymentIntent.status === 'requires_payment_method') status = 'failed';

            return {
                status,
                amount: this.parseAmount(paymentIntent.amount, paymentIntent.currency),
                currency: paymentIntent.currency
            };
        } catch (error) {
            return { status: 'failed' };
        }
    }

    /**
     * Get QR Payment Status (IPosQRService Implementation)
     */
    async getQRPaymentStatus(qrId: string): Promise<QRPaymentStatus> {
        try {
            // Check if it's a Checkout Session (cs_...) or Payment Intent (pi_...)
            if (qrId.startsWith('cs_')) {
                const session = await this.stripe.checkout.sessions.retrieve(qrId);

                let status: QRPaymentStatus['status'] = 'pending';
                if (session.payment_status === 'paid') status = 'completed';
                if (session.status === 'expired') status = 'expired';

                return {
                    status,
                    amount: session.amount_total ? this.parseAmount(session.amount_total, session.currency || 'usd') : undefined,
                    currency: session.currency || 'usd',
                    paymentId: session.payment_intent as string,
                    gatewayResponse: session
                };
            } else {
                // Assume Payment Intent
                const paymentIntent = await this.stripe.paymentIntents.retrieve(qrId);

                let status: QRPaymentStatus['status'] = 'pending';
                if (paymentIntent.status === 'succeeded') status = 'completed';
                else if (paymentIntent.status === 'canceled') status = 'failed';

                // Check if refunded
                if (paymentIntent.amount_received > 0 && paymentIntent.amount_received < paymentIntent.amount) {
                    status = 'completed';
                }

                return {
                    status,
                    amount: this.parseAmount(paymentIntent.amount, paymentIntent.currency),
                    currency: paymentIntent.currency,
                    paymentId: paymentIntent.id,
                    gatewayResponse: paymentIntent
                };
            }
        } catch (error) {
            return {
                status: 'failed',
            };
        }
    }

    // ... existing getPayoutDetails ...
    async getPayoutDetails(paymentIntentId: string): Promise<{
        netAmount: number;
        fee: number;
        currency: string;
        exchangeRate?: number;
    } | null> {
        try {
            // Get the payment intent with expanded charges
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId, {
                expand: ['latest_charge.balance_transaction'],
            });

            // Get the charge and balance transaction
            const charge = paymentIntent.latest_charge as Stripe.Charge | null;
            if (!charge) {
                return null;
            }

            const balanceTransaction = charge.balance_transaction as Stripe.BalanceTransaction | null;
            if (!balanceTransaction) {
                return null;
            }

            // Balance transaction contains fee and net amount
            return {
                netAmount: this.parseAmount(balanceTransaction.net, balanceTransaction.currency),
                fee: this.parseAmount(balanceTransaction.fee, balanceTransaction.currency),
                currency: balanceTransaction.currency.toUpperCase(),
                exchangeRate: balanceTransaction.exchange_rate || undefined,
            };
        } catch (error) {
            console.error('Error fetching Stripe payout details:', error);
            return null;
        }
    }

    /**
     * Generate Stripe QR (using Payment Link or simple checkout session URL to be encoded)
     * Real Stripe QR is mostly Terminal based. For pure online->QR flow, we can use Payment Links.
     */
    async generateQR(params: QRGenerationParams): Promise<QRGenerationResult> {
        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'], // Add others if needed
                customer_email: params.customerDetails?.email || undefined,
                line_items: [{
                    price_data: {
                        currency: params.currency.toLowerCase(),
                        product_data: {
                            name: params.description || 'Order Payment',
                        },
                        unit_amount: Math.round(params.amount * 100),
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `https://${params.storeDomain || process.env.FRONTEND_URL}/orders/${params.orderId}/confirmation`,
                cancel_url: `https://${params.storeDomain || process.env.FRONTEND_URL}/checkout?orderId=${params.orderId}&status=cancelled`,
                client_reference_id: params.orderId,
                payment_intent_data: {
                    description: params.description || `Order ${params.orderId}`,
                    shipping: params.customerDetails?.address ? {
                        name: params.customerDetails.name || 'Customer',
                        address: {
                            line1: params.customerDetails.address.line1,
                            line2: params.customerDetails.address.line2 || undefined,
                            city: params.customerDetails.address.city,
                            state: params.customerDetails.address.state,
                            postal_code: params.customerDetails.address.postalCode,
                            country: params.customerDetails.address.country,
                        }
                    } : undefined,
                },
                metadata: JSON.parse(JSON.stringify({
                    orderId: params.orderId,
                    storeId: params.storeId,
                    customerName: params.customerDetails?.name,
                    ...params.metadata
                }))
            });

            return {
                qrCodeId: session.id, // We use session ID as QR ID for tracking
                qrCodeData: session.url || '', // This URL becomes the QR code
                gatewayReferenceId: session.payment_intent as string
            };

        } catch (error: any) {
            console.error('Stripe QR Generation Error:', error);
            throw new Error('Stripe QR generation failed');
        }
    }

    async cancelQR(qrId: string): Promise<boolean> {
        try {
            await this.stripe.checkout.sessions.expire(qrId);
            return true;
        } catch (error) {
            return false;
        }
    }
}
