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
        storeConfig,
        restrictedItems
    } = useCheckout();
    console.log('shippingDetails', shippingDetails);
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

    if (restrictedItems && restrictedItems.length > 0) {
        return (
            <div className={styles.shippingModule}>
                <h2 className={styles.title}>Shipping Method</h2>
                <div className={styles.errorContainer} style={{ padding: '15px', backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '4px', color: '#c53030' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>Shipping Restrictions</h3>
                    <p style={{ marginBottom: '10px' }}>{`The following item${restrictedItems.length > 1 ? 's' : ''} cannot be shipped to your selected location`}:</p>
                    <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                        {restrictedItems.map((item, index) => (
                            <li key={index} style={{ marginBottom: '4px' }}>{item}</li>
                        ))}
                    </ul>
                    <p style={{ marginTop: '10px', fontSize: '14px' }}>Please remove these items or select a different shipping address.</p>
                </div>
            </div>
        );
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
                            <div className={styles.estDate}>
                                {shippingDetails?.estimatedDays || shippingDetails?.description || 'Delivery in 3-7 business days'}
                            </div>
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
