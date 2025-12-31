'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/providers/CartProvider';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';
import CartItem from '@/components/core/CartItem';
import EmptyCheckout from '@/app/checkout/components/EmptyCheckout';
import styles from './cart.module.scss';
import { ModuleProps } from '@/components/core/modules';

export default function CartModule({ config }: ModuleProps) {
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
            <div className={styles.loading}>Loading your cart...</div>
        );
    }

    if (cartCount === 0 && !isLoading) {
        return <EmptyCheckout />
    }

    return (
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
    );
}
