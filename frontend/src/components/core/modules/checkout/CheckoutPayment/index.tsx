// CheckoutPayment Module - Payment method selection

'use client';

import React from 'react';
import { useCheckout } from '../context';
import styles from './CheckoutPayment.module.scss';
import { useCurrency } from '@/hooks/useCurrency';

export interface CheckoutPaymentProps {
    config?: any;
}

export default function CheckoutPayment({ config: propsConfig }: CheckoutPaymentProps) {
    const {
        config: globalConfig,
        paymentMethods,
        selectedPayment,
        handlePaymentSelect,
        paymentsLoading,
    } = useCheckout();

    const config = propsConfig || globalConfig?.payment || {};
    const {
        showIcons = true,
        layout = 'list',
        showExtraCharges = true,
    } = config;

    return (
        <div className={styles.paymentModule}>
            <h2 className={styles.title}>Payment Method</h2>

            {paymentsLoading ? (
                <div className={`${styles.methodsContainer} ${layout === 'grid' ? styles.gridLayout : ''}`}>
                    <div className={styles.skeletonCard}>
                        <div className={styles.skeletonRadio} />
                        <div className={styles.skeletonInfo}>
                            <div className={styles.skeletonTitle} />
                            <div className={styles.skeletonDesc} />
                        </div>
                    </div>
                </div>
            ) : paymentMethods.length === 0 ? (
                <div className={styles.noMethods}>
                    No payment methods available for your region.
                </div>
            ) : (
                <div className={`${styles.methodsContainer} ${layout === 'grid' ? styles.gridLayout : ''}`}>
                    {paymentMethods.map((method) => (
                        <div
                            key={method.id}
                            className={`${styles.methodCard} ${selectedPayment?.id === method.id ? styles.selected : ''}`}
                            onClick={() => handlePaymentSelect(method)}
                        >
                            <input
                                type="radio"
                                checked={selectedPayment?.id === method.id}
                                onChange={() => handlePaymentSelect(method)}
                                className={styles.radio}
                            />
                            <div className={styles.methodHeader}>

                                {showIcons && method.icon && (
                                    <img src={method.icon} alt={method.name} className={styles.methodIcon} />
                                )}
                                <div className={styles.methodName}>{method.name}</div>
                                {method.description && (
                                    <div className={styles.methodDesc}>{method.description}</div>
                                )}
                            </div>


                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
