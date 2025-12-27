'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/providers/CartProvider';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';
import CartItem from '@/components/core/CartItem';
import styles from './page.module.scss';

export default function CartPage() {
    const { cart, items, cartCount, updateCartItem, removeFromCart, isLoading } = useCart();
    const currency = useCurrency();

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = cart?.tax || 0;
    const shipping = cart?.shippingCost || 0;
    const total = cart?.total || subtotal + tax + shipping;

    // Wrapper functions to match CartItem's expected signatures
    const handleUpdateQuantity = async (itemId: string, quantity: number) => {
        return await updateCartItem({ itemId, quantity });
    };

    const handleRemoveItem = async (itemId: string) => {
        return await removeFromCart(itemId);
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.loading}>Loading your cart...</div>
                </div>
            </div>
        );
    }

    if (cartCount === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.emptyCart}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.emptyIcon}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <h2>Your cart is empty</h2>
                        <p>Add some products to get started</p>
                        <Link href="/" className={styles.shopBtn}>
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.title}>Shopping Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})</h1>

                <div className={styles.layout}>
                    {/* Cart Items */}
                    <div className={styles.cartItems}>
                        <div className={styles.cartHeader}>
                            <div className={styles.headerProduct}>Product</div>
                            <div className={styles.headerPrice}>Price</div>
                            <div className={styles.headerQuantity}>Quantity</div>
                            <div className={styles.headerTotal}>Total</div>
                            <div className={styles.headerRemove}></div>
                        </div>

                        {items.map((item) => (
                            <CartItem
                                key={item._id}
                                item={item as any}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemoveItem}
                            />
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className={styles.summary}>
                        <h2>Order Summary</h2>

                        <div className={styles.summaryRow}>
                            <span>Subtotal</span>
                            <span>{formatPrice(subtotal, currency)}</span>
                        </div>

                        {tax > 0 && (
                            <div className={styles.summaryRow}>
                                <span>Tax</span>
                                <span>{formatPrice(tax, currency)}</span>
                            </div>
                        )}

                        <div className={styles.summaryRow}>
                            <span>Shipping</span>
                            <span>{shipping > 0 ? formatPrice(shipping, currency) : 'Calculated at checkout'}</span>
                        </div>

                        <div className={styles.divider}></div>

                        <div className={`${styles.summaryRow} ${styles.total}`}>
                            <span>Total</span>
                            <span>{formatPrice(total, currency)}</span>
                        </div>

                        <Link href="/checkout" className={styles.checkoutBtn}>
                            Proceed to Checkout
                        </Link>

                        <Link href="/" className={styles.continueLink}>
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
