'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import styles from './StripePaymentForm.module.scss';
import { formatPrice } from '@/lib/currency';
import { useCurrency } from '@/hooks/useCurrency';

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
    const currency = useCurrency();
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Payment successful
                onSuccess();
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'An unexpected error occurred');
            onError(err.message || 'An unexpected error occurred');
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
                {processing ? 'Processing...' : `Pay ${formatPrice(amount, currency, false)}`}
            </button>
        </form>
    );
}
