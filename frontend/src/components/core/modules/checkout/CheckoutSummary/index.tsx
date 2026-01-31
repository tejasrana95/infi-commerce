// CheckoutSummary Module - Order totals and cart items

'use client';

import React, { useState } from 'react';
import { useCheckout } from '../context';
import styles from './CheckoutSummary.module.scss';
import { useCurrency } from '@/hooks/useCurrency';
import Image from 'next/image';

export interface CheckoutSummaryProps {
    config?: any;
}

export default function CheckoutSummary({ config: propsConfig }: CheckoutSummaryProps) {
    const {
        config: globalConfig,
        orderSummary,
        cartItems,
        couponCode,
        appliedCoupon,
        couponLoading,
        handleApplyCoupon,
        handleRemoveCoupon,
        setCouponCode
    } = useCheckout();

    const {formatPriceWithExchange} = useCurrency();

    const config = propsConfig || globalConfig?.summary || {};
    const {
        sticky = false,
        showCoupon = true,
        collapsibleMobile = true,
        showCartItems = true,
        maxVisibleItems = 3,
    } = config;

    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`${styles.summaryModule} ${sticky ? styles.sticky : ''}`}>
            {/* Mobile Header (Collapsible) */}
            <div className={styles.mobileHeader} onClick={() => collapsibleMobile && setIsExpanded(!isExpanded)}>
                <div className={styles.mobileTotal}>
                    <span>Total</span>
                    <span className={styles.totalValue}>{formatPriceWithExchange(orderSummary.total)}</span>
                </div>
                {collapsibleMobile && (
                    <button className={`${styles.expandBtn} ${isExpanded ? styles.expanded : ''}`}>
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                    </button>
                )}
            </div>

            <div className={`${styles.summaryContent} ${isExpanded ? styles.expanded : ''}`}>
                <h2 className={styles.title}>Order Summary</h2>

                {/* Cart Items */}
                {showCartItems && cartItems.length > 0 && (
                    <div className={styles.cartItems}>
                        {/* We can limit items if needed */}
                        {cartItems.slice(0, isExpanded ? undefined : maxVisibleItems).map((item: any, index: number) => (
                            <div key={`${item.productId}-${index}`} className={styles.item}>
                                <div className={styles.itemImage}>
                                    {item.image ? (
                                        <Image src={item.image} alt={item.name} width={68} height={68}/>
                                    ) : (
                                        <div className={styles.placeholderImg} />
                                    )}
                                    <span className={styles.qtyBadge}>{item.quantity}</span>
                                </div>
                                <div className={styles.itemInfo}>
                                    <p className={styles.itemName}>{item.name}</p>
                                    <p className={styles.itemVariant}>{item.variant}</p>
                                </div>
                                <div className={styles.itemPrice}>
                                    {formatPriceWithExchange((item.salePrice || item.price) * item.quantity)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Coupon Code */}
                {showCoupon && (
                    <div className={styles.couponSection}>
                        {appliedCoupon ? (
                            <div className={styles.appliedCoupon}>
                                <span>Code: <strong>{appliedCoupon.code}</strong></span>
                                <button onClick={handleRemoveCoupon} className={styles.removeBtn}>×</button>
                            </div>
                        ) : (
                            <div className={styles.couponInput}>
                                <input
                                    type="text"
                                    placeholder="Discount code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={couponLoading || !couponCode.trim()}
                                >
                                    {couponLoading ? '...' : 'Apply'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Totals */}
                <div className={styles.totals}>
                    <div className={styles.row}>
                        <span>Subtotal</span>
                        <span>{formatPriceWithExchange(orderSummary.subtotal)}</span>
                    </div>

                    <div className={styles.row}>
                        <span>Shipping</span>
                        <span>
                            {orderSummary.shipping > 0 ? formatPriceWithExchange(orderSummary.shipping) : (orderSummary.shipping === 0 && 'Calculated at next step')}
                        </span>
                    </div>

                    {orderSummary.tax > 0 && (
                        <div className={styles.row}>
                            <span>Tax</span>
                            <span>{formatPriceWithExchange(orderSummary.tax)}</span>
                        </div>
                    )}

                    {orderSummary.discount > 0 && (
                        <div className={`${styles.row} ${styles.discount}`}>
                            <span>Discount</span>
                            <span>-{formatPriceWithExchange(orderSummary.discount)}</span>
                        </div>
                    )}

                    <div className={`${styles.row} ${styles.total}`}>
                        <span>Total</span>
                        <span>{formatPriceWithExchange(orderSummary.total)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
