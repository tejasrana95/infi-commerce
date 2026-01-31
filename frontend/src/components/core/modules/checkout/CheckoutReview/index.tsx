// CheckoutReview Module - Order review summary

'use client';

import React from 'react';
import { useCheckout } from '../context';
import styles from './CheckoutReview.module.scss';
import { useCurrency } from '@/hooks/useCurrency';

export interface CheckoutReviewProps {
    config?: any;
}

export default function CheckoutReview({ config: propsConfig }: CheckoutReviewProps) {
    const {
        config: globalConfig,
        cartItems,
        shippingAddress,
        billingAddress,
        sameAsShipping,
        selectedPayment,
        customerNote,
        setCustomerNote,
        goToStep
    } = useCheckout();

    const {formatPriceWithExchange} = useCurrency();

    const config = propsConfig || globalConfig?.review || {};
    const {
        showItemImages = true,
        showEditButtons = true,
        showCustomerNote = true,
    } = config;

    return (
        <div className={styles.reviewModule}>
            <h2 className={styles.title}>Review Your Order</h2>

            <div className={styles.reviewGrid}>
                {/* Shipping Info */}
                <div className={styles.reviewSection}>
                    <div className={styles.sectionHeader}>
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            Shipping
                        </h3>
                        {showEditButtons && <button onClick={() => goToStep(1)}>Edit</button>}
                    </div>
                    {shippingAddress ? (
                        <div className={styles.sectionContent}>
                            <p><strong>{shippingAddress.firstName} {shippingAddress.lastName}</strong></p>
                            <p>{shippingAddress.address1}</p>
                            {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                            <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                            <p>{shippingAddress.country}</p>
                            <p>{shippingAddress.phone}</p>
                        </div>
                    ) : (
                        <div className={styles.sectionContent}>
                            <p className={styles.missing}>No shipping address selected</p>
                        </div>
                    )}
                </div>

                {/* Billing Info */}
                <div className={styles.reviewSection}>
                    <div className={styles.sectionHeader}>
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            Billing
                        </h3>
                        {showEditButtons && <button onClick={() => goToStep(1)}>Edit</button>}
                    </div>
                    {sameAsShipping ? (
                        <div className={styles.sectionContent}>
                            <p>Same as shipping address</p>
                        </div>
                    ) : billingAddress ? (
                        <div className={styles.sectionContent}>
                            <p><strong>{billingAddress.firstName} {billingAddress.lastName}</strong></p>
                            <p>{billingAddress.address1}</p>
                            {billingAddress.address2 && <p>{billingAddress.address2}</p>}
                            <p>{billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}</p>
                            <p>{billingAddress.country}</p>
                            <p>{billingAddress.phone}</p>
                        </div>
                    ) : (
                        <div className={styles.sectionContent}>
                            <p className={styles.missing}>No billing address selected</p>
                        </div>
                    )}
                </div>

                {/* Payment Info */}
                <div className={styles.reviewSection}>
                    <div className={styles.sectionHeader}>
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            Payment
                        </h3>
                        {showEditButtons && <button onClick={() => goToStep(3)}>Edit</button>}
                    </div>
                    {selectedPayment ? (
                        <div className={styles.sectionContent}>
                            <p><strong>Method:</strong> {selectedPayment.name}</p>
                            {selectedPayment.extraCharge! > 0 && (
                                <p><strong>Extra Charge:</strong> {formatPriceWithExchange(selectedPayment.extraCharge!)}</p>
                            )}
                        </div>
                    ) : (
                        <div className={styles.sectionContent}>
                            <p className={styles.missing}>No payment method selected</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Note */}
            {showCustomerNote && (
                <div className={styles.noteSection}>
                    <label>Order Note (Optional)</label>
                    <textarea
                        value={customerNote}
                        onChange={(e) => setCustomerNote(e.target.value)}
                        placeholder="Any special instructions for your order..."
                        rows={3}
                    />
                </div>
            )}
        </div>
    );
}
