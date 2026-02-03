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
                // Required for export transactions as per https://stripe.com/docs/india-exports
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
            console.error(`❌ Stripe PaymentIntent creation failed:`, error);
            console.error(`❌ Error details:`, {
                type: error.type,
                code: error.code,
                message: error.message,
                param: error.param,
                raw: error.raw,
                requestId: error.requestId,
            });

            // Check if this is a regional restriction error
            if (error.message && error.message.includes('search feature is temporarily unavailable')) {
                console.error(`🚫 Regional restriction detected. This might be due to:`);
                console.error(`   - Shipping country restrictions`);
                console.error(`   - Stripe account regional limitations`);
                console.error(`   - Test mode restrictions for certain countries`);
                console.error(`   - Shipping address:`, params.shippingAddress);

                // Try creating PaymentIntent without shipping as fallback

                try {
                    // Re-calculate amountInCents here or ensure it's accessible
                    const amountInCentsFallback = Math.round(params.amount * 100);
                    const fallbackPaymentIntent = await this.stripe.paymentIntents.create({
                        amount: amountInCentsFallback,
                        currency: params.currency.toLowerCase(),
                        description: params.description || `Order ${params.orderId}`,
                        metadata: {
                            orderId: params.orderId,
                            customerEmail: params.customerEmail || '',
                            ...params.metadata,
                        },
                        receipt_email: params.customerEmail,
                    });


                    return {
                        success: true,
                        paymentId: fallbackPaymentIntent.id,
                        orderId: params.orderId,
                        amount: params.amount,
                        currency: params.currency,
                        status: 'pending',
                        clientSecret: fallbackPaymentIntent.client_secret || undefined,
                        gatewayResponse: fallbackPaymentIntent,
                    };
                } catch (fallbackError) {
                    console.error(`❌ Fallback also failed:`, fallbackError);
                }
            }

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
                orderId: paymentIntent.metadata?.orderId || undefined,
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
        // optional: if you are using Stripe Connect, pass connected account id here
        stripeAccount?: string;
    }): Promise<RefundResponse> {
        try {


            // Always expand charges to increase chance of getting the charge object inline
            const retrieveOpts: any = { expand: ['latest_charge', 'charges.data'] };
            if (params.stripeAccount) retrieveOpts.stripeAccount = params.stripeAccount;

            let paymentIntent = await this.stripe.paymentIntents.retrieve(params.paymentId, retrieveOpts);



            // If not in refundable state -> try to find another PaymentIntent for same order (existing logic kept)
            if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
                // console.log('⚠️  PaymentIntent status is', paymentIntent.status, 'attempting to find succeeded one...');
                const orderId = paymentIntent.metadata?.orderId;
                if (orderId) {
                    const piList = await this.stripe.paymentIntents.list({ limit: 10 }, params.stripeAccount ? { stripeAccount: params.stripeAccount } : undefined);
                    const foundIntent = piList.data.find((pi: any) =>
                        pi.metadata?.orderId === orderId &&
                        (pi.status === 'succeeded' || pi.status === 'processing') &&
                        (pi as any).charges?.data?.length > 0
                    );
                    if (foundIntent) {

                        paymentIntent = foundIntent as any;
                    }
                }
            }

            // Now try to find a charge id using multiple strategies
            let chargeId: string | null = null;
            // 1) paymentIntent.charges.data if expanded
            if ((paymentIntent as any).charges && Array.isArray((paymentIntent as any).charges.data) && (paymentIntent as any).charges.data.length > 0) {
                chargeId = (paymentIntent as any).charges.data[0].id;

            }

            // 2) latest_charge may be a string (id) or an object
            if (!chargeId && (paymentIntent as any).latest_charge) {
                const latest = (paymentIntent as any).latest_charge;
                if (typeof latest === 'string') {
                    // retrieve the charge explicitly

                    const charge = await this.stripe.charges.retrieve(latest, params.stripeAccount ? { stripeAccount: params.stripeAccount } : undefined);
                    if (charge && charge.id) {
                        chargeId = charge.id;

                    }
                } else if (latest && latest.id) {
                    chargeId = latest.id;

                }
            }

            // 3) list charges by payment_intent (safe fallback)
            if (!chargeId) {

                const chargesList = await this.stripe.charges.list({ limit: 5, payment_intent: paymentIntent.id }, params.stripeAccount ? { stripeAccount: params.stripeAccount } : undefined);
                if (chargesList && chargesList.data && chargesList.data.length > 0) {
                    chargeId = chargesList.data[0].id;

                }
            }

            // 4) final fallback: search recent charges by metadata.orderId (if present)
            if (!chargeId && paymentIntent.metadata?.orderId) {

                const orderId = paymentIntent.metadata.orderId;
                const recentCharges = await this.stripe.charges.list({ limit: 20 }, params.stripeAccount ? { stripeAccount: params.stripeAccount } : undefined);
                const matched = recentCharges.data.find((c: any) => c.metadata?.orderId === orderId);
                if (matched) {
                    chargeId = matched.id;

                }
            }

            if (!chargeId) {
                console.error('❌ No charge found in PaymentIntent or via fallbacks');
                throw new Error(
                    `No charge found for PaymentIntent ${params.paymentId}. ` +
                    `Payment status: ${paymentIntent.status}. ` +
                    `Please ensure the payment was successfully captured, and check if the charge lives on a connected account or in another environment (test/live).`
                );
            }

            // Prepare amount in cents (integer) for refunds
            // If your formatAmount returns integer cents already, you can keep it; else compute directly:
            const refundAmount = Math.round(params.amount * 100);


            const refund = await this.stripe.refunds.create({
                charge: chargeId,
                amount: refundAmount,
                reason: params.reason === 'requested_by_customer' ? 'requested_by_customer' : undefined,
            }, params.stripeAccount ? { stripeAccount: params.stripeAccount } : undefined);


            return {
                success: true,
                refundId: refund.id,
                amount: this.parseAmount(refund.amount, refund.currency || paymentIntent.currency || 'usd'),
                status: refund.status === 'succeeded' ? 'success' : 'pending',
                gatewayResponse: refund,
            };

        } catch (error: any) {
            console.error('Payment gateway refund error:', error);
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
            if (paymentIntent.status === 'succeeded') {
                status = 'success';

            } else if (paymentIntent.status === 'processing') {
                status = 'success'; // Processing is also a valid success state

            } else if (paymentIntent.status === 'canceled') {
                status = 'failed';

            } else if (paymentIntent.status === 'requires_payment_method') {
                status = 'failed';

            } else {
                console.warn(`⚠️ PaymentIntent status unknown: ${paymentIntent.status}`);
            }

            return {
                status,
                amount: this.parseAmount(paymentIntent.amount, paymentIntent.currency),
                currency: paymentIntent.currency
            };
        } catch (error: any) {
            console.error(`❌ Error retrieving PaymentIntent status:`, error.message);
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
                // Redirect to POS confirmation page with customer email and session ID
                // This allows fetching the latest order matching these parameters
                success_url: `https://${params.storeDomain || process.env.FRONTEND_URL || 'localhost:3000'}/orders/pos/confirmation?customer=${encodeURIComponent(params.customerDetails?.email || '')}&customerId=${params.customerDetails?.id || ''}&posSessionId=${params.metadata?.posSessionId || ''}`,
                cancel_url: `https://${params.storeDomain || process.env.FRONTEND_URL || 'localhost:3000'}/orders/pos/cancelled?customer=${encodeURIComponent(params.customerDetails?.email || '')}&customerId=${params.customerDetails?.id || ''}&posSessionId=${params.metadata?.posSessionId || ''}`,
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
