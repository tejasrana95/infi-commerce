'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { useDialog } from '@/providers/DialogProvider';
import { apiClient } from '@/services/api-client';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '@/components/payment/StripePaymentForm';
import styles from './page.module.scss';

interface OrderData {
    _id: string;
    orderNumber: string;
    total: number;
    subtotal: number;
    shippingCost: number;
    tax: number;
    discount: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: string;
    guestEmail?: string;
}

interface PaymentInitData {
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    gatewayType: string;
    paymentId: string;
    razorpay?: {
        key: string;
        orderId: string;
        amount: number;
        currency: string;
        name: string;
        description: string;
        prefill: {
            name: string;
            email: string;
            contact: string;
        };
    };
    stripe?: {
        clientSecret: string;
        publishableKey: string;
    };
    paypal?: {
        redirectUrl: string;
        orderId: string;
    };
}

export default function OrderPaymentPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const orderId = params.orderId as string;
    const { customer } = useAuth();
    const toast = useToast();
    const { showConfirm } = useDialog();
    const currency = useCurrency();

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [order, setOrder] = useState<OrderData | null>(null);
    const [paymentData, setPaymentData] = useState<PaymentInitData | null>(null);
    const [isCOD, setIsCOD] = useState(false);
    const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

    const guestEmail = searchParams.get('guestEmail');
    const queryString = guestEmail ? `?guestEmail=${encodeURIComponent(guestEmail)}` : '';

    // Load order and initialize payment
    useEffect(() => {
        if (orderId) {
            initializePayment();
        }
    }, [orderId]);

    const initializePayment = async () => {
        try {
            setLoading(true);
            setError(null);

            // First, fetch order details
            const orderResponse = await apiClient.get(`/orders/${orderId}${queryString}`);
            const orderData = orderResponse.data;
            setOrder(orderData);

            // Check if already paid
            if (orderData.paymentStatus === 'paid') {
                router.replace(`/orders/${orderId}/confirmation${queryString}`);
                return;
            }

            // Initialize payment with gateway
            const paymentResponse = await apiClient.post(`/orders/${orderId}/initialize-payment`, {
                guestEmail: guestEmail || undefined,
            });

            if (paymentResponse.data?.requiresPayment === false) {
                // COD or other offline method
                setIsCOD(true);
                setLoading(false);
                return;
            }

            setPaymentData(paymentResponse.data);

            // Handle gateway-specific initialization
            const gateway = paymentResponse.data.gatewayType;

            if (gateway === 'razorpay') {
                await loadRazorpayScript();
            } else if (gateway === 'stripe') {
                // Load Stripe with publishable key
                if (paymentResponse.data.stripe?.publishableKey) {
                    const stripe = loadStripe(paymentResponse.data.stripe.publishableKey);
                    setStripePromise(stripe);
                }
            } else if (gateway === 'paypal') {
                // PayPal redirect happens on button click
            }

        } catch (err: any) {
            console.error('Payment initialization error:', err);
            setError(err.response?.data?.message || 'Failed to initialize payment');
        } finally {
            setLoading(false);
        }
    };

    // Load Razorpay script
    const loadRazorpayScript = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if ((window as any).Razorpay) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Razorpay'));
            document.body.appendChild(script);
        });
    };

    // Handle Razorpay payment
    const handleRazorpayPayment = async () => {
        if (!paymentData?.razorpay) return;

        const options = {
            key: paymentData.razorpay.key,
            amount: paymentData.razorpay.amount,
            currency: paymentData.razorpay.currency,
            name: paymentData.razorpay.name,
            description: paymentData.razorpay.description,
            order_id: paymentData.razorpay.orderId,
            prefill: paymentData.razorpay.prefill,
            handler: async (response: any) => {
                // Payment successful - notify backend
                try {
                    setProcessing(true);
                    await apiClient.post(`/orders/${orderId}/payment-success`, {
                        paymentId: response.razorpay_payment_id,
                        paymentDetails: {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        },
                    });
                    toast.success('Payment successful!');
                    router.replace(`/orders/${orderId}/confirmation${queryString}`);
                } catch (err) {
                    console.error('Error confirming payment:', err);
                    toast.error('Payment received but confirmation failed. Please contact support.');
                } finally {
                    setProcessing(false);
                }
            },
            modal: {
                ondismiss: () => {
                    toast.info('Payment cancelled');
                },
            },
            theme: {
                color: '#667eea',
            },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.on('payment.failed', async (response: any) => {
            try {
                await apiClient.post(`/orders/${orderId}/payment-failed`, {
                    paymentDetails: {
                        error: response.error,
                    },
                });
            } catch (err) {
                console.error('Error reporting payment failure:', err);
            }
            toast.error(`Payment failed: ${response.error.description}`);
        });
        razorpay.open();
    };

    // Handle PayPal redirect
    const handlePayPalPayment = () => {
        if (paymentData?.paypal?.redirectUrl) {
            window.location.href = paymentData.paypal.redirectUrl;
        }
    };

    // Handle Stripe payment success
    const handleStripeSuccess = async () => {
        try {
            setProcessing(true);
            await apiClient.post(`/orders/${orderId}/payment-success`, {
                paymentId: paymentData?.paymentId,
                guestEmail: guestEmail || undefined,
                paymentDetails: {
                    gateway: 'stripe',
                },
            });
            toast.success('Payment successful!');
            router.replace(`/orders/${orderId}/confirmation${queryString}`);
        } catch (err) {
            console.error('Error confirming payment:', err);
            toast.error('Payment received but confirmation failed. Please contact support.');
        } finally {
            setProcessing(false);
        }
    };

    // Handle Stripe payment error
    const handleStripeError = (error: string) => {
        toast.error(`Payment failed: ${error}`);
    };

    // Handle pay button click
    const handlePayNow = async () => {
        if (!paymentData) return;

        setProcessing(true);

        try {
            switch (paymentData.gatewayType) {
                case 'razorpay':
                    await handleRazorpayPayment();
                    break;
                case 'paypal':
                    handlePayPalPayment();
                    break;
                case 'stripe':
                    // Stripe payment will be handled by Stripe Elements
                    toast.info('Stripe integration coming soon');
                    break;
                default:
                    toast.error('Unknown payment method');
            }
        } catch (err) {
            console.error('Payment error:', err);
            toast.error('Failed to process payment');
        } finally {
            setProcessing(false);
        }
    };

    // Handle cancel/back
    const handleCancel = async () => {
        const confirmed = await showConfirm({
            title: 'Leave Payment?',
            message: 'Your order has been placed. You can complete the payment later from your order details.',
            confirmText: 'Leave',
            cancelText: 'Stay',
            type: 'warning',
        });

        if (confirmed) {
            router.push(`/orders/${orderId}/confirmation${queryString}`);
        }
    };

    // COD success - redirect to confirmation
    const handleCODContinue = () => {
        router.replace(`/orders/${orderId}/confirmation${queryString}`);
    };

    // Render loading state
    if (loading) {
        return (
            <div className={styles.paymentPage}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Initializing payment...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className={styles.paymentPage}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.error}>
                            <div className={styles.errorIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v4m0 4h.01" />
                                </svg>
                            </div>
                            <h2>Payment Error</h2>
                            <p>{error}</p>
                            <button onClick={() => initializePayment()}>Try Again</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render COD notice
    if (isCOD) {
        return (
            <div className={styles.paymentPage}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <h1>Order Placed!</h1>
                            <p className={styles.orderNumber}>Order #{order?.orderNumber}</p>
                        </div>
                        <div className={styles.codNotice}>
                            <div className={styles.checkIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2>Cash on Delivery</h2>
                            <p>No online payment required. Pay when your order arrives.</p>
                            <button className={styles.payButton} onClick={handleCODContinue}>
                                View Order Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render payment form
    return (
        <div className={styles.paymentPage}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <h1>Complete Payment</h1>
                        <p className={styles.orderNumber}>Order #{order?.orderNumber}</p>
                    </div>

                    {order && (
                        <div className={styles.orderSummary}>
                            <h2>Order Summary</h2>
                            <div className={styles.summaryRow}>
                                <span>Subtotal</span>
                                <span>{formatPrice(order.subtotal, currency)}</span>
                            </div>
                            {order.shippingCost > 0 && (
                                <div className={styles.summaryRow}>
                                    <span>Shipping</span>
                                    <span>{formatPrice(order.shippingCost, currency)}</span>
                                </div>
                            )}
                            {order.tax > 0 && (
                                <div className={styles.summaryRow}>
                                    <span>Tax</span>
                                    <span>{formatPrice(order.tax, currency)}</span>
                                </div>
                            )}
                            {order.discount > 0 && (
                                <div className={styles.summaryRow}>
                                    <span>Discount</span>
                                    <span>-{formatPrice(order.discount, currency)}</span>
                                </div>
                            )}
                            <div className={`${styles.summaryRow} ${styles.total}`}>
                                <span>Total</span>
                                <span>{formatPrice(order.total, currency)}</span>
                            </div>
                        </div>
                    )}

                    <div className={styles.paymentSection}>
                        <div className={styles.paymentMethod}>
                            <div className={styles.methodIcon}>
                                {paymentData?.gatewayType === 'razorpay' && (
                                    <img src="https://razorpay.com/favicon.png" alt="Razorpay" />
                                )}
                                {paymentData?.gatewayType === 'stripe' && (
                                    <img src="/images/payment/Stripe_icon.svg" alt="Stripe" />
                                )}
                                {paymentData?.gatewayType === 'paypal' && (
                                    <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" />
                                )}
                            </div>
                            <div className={styles.methodInfo}>
                                <h3>
                                    {paymentData?.gatewayType === 'razorpay' && 'Razorpay'}
                                    {paymentData?.gatewayType === 'stripe' && 'Stripe'}
                                    {paymentData?.gatewayType === 'paypal' && 'PayPal'}
                                </h3>
                                <p>Secure payment gateway</p>
                            </div>
                        </div>

                        {/* Stripe Payment Form */}
                        {paymentData?.gatewayType === 'stripe' && stripePromise && paymentData.stripe?.clientSecret ? (
                            <div className={styles.stripeContainer}>
                                <Elements
                                    stripe={stripePromise}
                                    options={{
                                        clientSecret: paymentData.stripe.clientSecret,
                                        appearance: {
                                            theme: 'stripe',
                                            variables: {
                                                colorPrimary: '#667eea',
                                            },
                                        },
                                    }}
                                >
                                    <StripePaymentForm
                                        amount={paymentData.amount}
                                        currency={order?.currency || 'USD'}
                                        orderId={orderId}
                                        onSuccess={handleStripeSuccess}
                                        onError={handleStripeError}
                                        queryString={queryString}
                                    />
                                </Elements>
                                <div className={styles.cancelLink} onClick={handleCancel}>
                                    Pay Later
                                </div>
                            </div>
                        ) : (
                            /* Other payment methods */
                            <div className={styles.actions}>
                                <button
                                    className={styles.payButton}
                                    onClick={handlePayNow}
                                    disabled={processing}
                                >
                                    {processing ? 'Processing...' : `Pay ${formatPrice(order?.total || 0, currency)}`}
                                </button>

                                <div className={styles.cancelLink} onClick={handleCancel}>
                                    Pay Later
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
