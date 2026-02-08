'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { apiClient } from '@/services/api-client';
import styles from './StripePaymentForm.module.scss';
import { formatPrice } from '@/lib/currency';

interface StripePaymentFormProps {
    amount: number;
    currency: string;
    orderId: string;
    onSuccess: () => void;
    onError: (error: string) => void;
    queryString?: string;
}

export default function StripePaymentForm({
    amount,
    currency: currencyProp,
    orderId,
    onSuccess,
    onError,
    queryString = '',
}: StripePaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const getErrorMessage = (err: unknown) => {
        if (!err) return 'Unknown error';
        if (typeof err === 'string') return err;
        if (typeof err === 'object' && err !== null && 'response' in err) {
            // @ts-ignore
            return (err as any).response?.data?.message || JSON.stringify(err);
        }
        return JSON.stringify(err);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setErrorMessage(null);

        try {
            // Confirm the payment
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/orders/${orderId}/confirmation${queryString}`,
                },
                redirect: 'if_required',
            });

            if (error) {
                setErrorMessage(error.message || 'Payment failed');
                onError(error.message || 'Payment failed');
            } else if (paymentIntent) {
                if (paymentIntent.status === 'succeeded') {
                    // Payment successful - send the successful PaymentIntent ID to backend immediately
                    try {
                        // Extract guest email from query string if present
                        const params = new URLSearchParams(queryString);
                        const guestEmail = params.get('guestEmail');

                        // Send the successful PaymentIntent ID to backend
                        const response = await apiClient.post(`/orders/${orderId}/payment-success`, {
                            paymentId: paymentIntent.id, // The successful PaymentIntent ID from confirmPayment
                            guestEmail: guestEmail || undefined,
                            paymentDetails: {
                                gateway: 'stripe',
                                confirmedAt: new Date().toISOString(),
                            },
                        });

                        onSuccess();
                    } catch (backendError: unknown) {
                        const message = getErrorMessage(backendError);
                        setErrorMessage(message || 'Failed to confirm payment with backend');
                        onError(message || 'Failed to confirm payment');
                    }
                } else {
                    console.warn(`⚠️ PaymentIntent status is not succeeded: ${paymentIntent.status}`);
                    setErrorMessage(`Payment status: ${paymentIntent.status}`);
                    onError(`Payment status: ${paymentIntent.status}`);
                }
            } else {
                setErrorMessage('No payment intent returned from Stripe');
                onError('No payment intent returned from Stripe');
            }
        } catch (err: unknown) {
            const message = getErrorMessage(err);
            setErrorMessage((message as string) || 'An unexpected error occurred');
            onError((message as string) || 'An unexpected error occurred');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.stripeForm}>
            <div className={styles.paymentElement}>
                <PaymentElement />
            </div>

            {errorMessage && (
                <div className={styles.error}>
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || processing}
                className={styles.submitButton}
            >
                {processing ? 'Processing...' : `Pay ${formatPrice(amount, currencyProp, false)}`}
            </button>
        </form>
    );
}
