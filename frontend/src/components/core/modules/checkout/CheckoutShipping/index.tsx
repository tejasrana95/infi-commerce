// CheckoutShipping Module - Shipping method selection

'use client';

import React from 'react';
import { useCheckout } from '../context';
import styles from './CheckoutShipping.module.scss';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';

export interface CheckoutShippingProps {
    config?: any;
}

export default function CheckoutShipping({ config: propsConfig }: CheckoutShippingProps) {
    const {
        config: globalConfig,
        shippingAddress,
        shippingCost,
        shippingDetails,
        storeConfig
    } = useCheckout();

    // Re-check context... I did not expose storeConfig or shippingMethods list.
    // In CheckoutContent, I have `getShippingMethods` which returns `shippingCost`.
    // It seems simple shipping for now.

    // Let's use currency hook for formatting
    const currency = useCurrency();

    const config = propsConfig || globalConfig?.shipping || {};
    const {
        showEstimatedDates = true,
    } = config;

    if (!shippingAddress) {
        return <div className={styles.placeholder}>Please select a shipping address first.</div>;
    }
    // Default shipping method display
    return (
        <div className={styles.shippingModule}>
            <h2 className={styles.title}>Shipping Method</h2>

            <div className={styles.methodCard}>
                <div className={styles.methodHeader}>
                    <input
                        type="radio"
                        checked={true}
                        readOnly
                        className={styles.radio}
                    />
                    <div className={styles.methodInfo}>
                        <div className={styles.methodName}>{shippingDetails?.name || 'Standard Shipping'}</div>
                        {showEstimatedDates && (
                            <div className={styles.estDate}>{shippingDetails?.description || 'Delivery in 3-5 business days'}</div>
                        )}
                        <div className={styles.price}>
                            {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, currency)}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
