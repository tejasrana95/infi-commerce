'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/providers/CartProvider';
import { useCurrency } from '@/hooks/useCurrency';
import CartItem from '@/components/core/CartItem';
import EmptyCheckout from '@/app/checkout/components/EmptyCheckout';
import styles from './cart.module.scss';
import { ModuleProps } from '@/components/core/modules';

export default function CartModule({ config: _config }: ModuleProps) {
    void _config;
    const { cart, items, cartCount, updateCartItem, removeFromCart, isLoading, refreshCart } = useCart();

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);
    const { formatPriceWithExchange } = useCurrency();

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = cart?.tax || 0;
    const shipping = cart?.shippingCost || 0;
    const total = cart?.total || subtotal + tax + shipping;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

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
            <div className={styles.head}>
                <div>
                    <h1 className={styles.title}>Your Cart</h1>
                    <p className={styles.subtitle}>
                        {totalItems} {totalItems === 1 ? 'item' : 'items'} ready for checkout
                    </p>
                </div>
                <Link href="/" className={styles.continueTopLink}>
                    Continue Shopping
                </Link>
            </div>

            <div className={styles.layout}>
                {/* Cart Items */}
                <div className={styles.itemsPanel}>
                    <div className={styles.sectionHead}>
                        <h2>Cart Items</h2>
                        <span>{cartCount} products</span>
                    </div>
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
                                item={item as React.ComponentProps<typeof CartItem>['item']}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemoveItem}
                            />
                        ))}
                    </div>
                </div>

                {/* Order Summary */}
                <div className={styles.summary}>
                    <h2>Order Summary</h2>

                    <div className={styles.summaryBadge}>
                        <span>Subtotal ({totalItems} items)</span>
                        <strong>{formatPriceWithExchange(subtotal)}</strong>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>Shipping</span>
                        <span>{shipping > 0 ? formatPriceWithExchange(shipping) : 'Calculated at checkout'}</span>
                    </div>

                    {tax > 0 && (
                        <div className={styles.summaryRow}>
                            <span>Tax</span>
                            <span>{formatPriceWithExchange(tax)}</span>
                        </div>
                    )}

                    <div className={styles.divider}></div>

                    <div className={`${styles.summaryRow} ${styles.total}`}>
                        <span>Payable Total</span>
                        <span>{formatPriceWithExchange(total)}</span>
                    </div>

                    <p className={styles.secureText}>Secure checkout with encrypted payments.</p>

                    <Link href="/checkout" className={styles.checkoutBtn}>
                        Proceed to Checkout
                    </Link>

                    <Link href="/" className={styles.continueLink}>
                        Continue Shopping
                    </Link>
                </div>
            </div>

            <div className={styles.mobileCheckoutBar}>
                <div className={styles.mobileCheckoutMeta}>
                    <span>Total</span>
                    <strong>{formatPriceWithExchange(total)}</strong>
                </div>
                <Link href="/checkout" className={styles.mobileCheckoutBtn}>
                    Checkout
                </Link>
            </div>
        </div>
    );
}
