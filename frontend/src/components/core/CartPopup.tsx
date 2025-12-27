'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/providers/CartProvider';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';
import CartItem from '@/components/core/CartItem';
import styles from './CartPopup.module.scss';

interface CartPopupProps {
    onClose: () => void;
}

export default function CartPopup({ onClose }: CartPopupProps) {
    const { cart, items, cartCount, updateCartItem, removeFromCart } = useCart();
    const currency = useCurrency();

    // Show only first 3 items in popup
    const displayItems = items.slice(0, 3);
    const hasMoreItems = items.length > 3;

    // Calculate total
    const total = cart?.total || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Wrapper functions to match CartItem's expected signatures
    const handleUpdateQuantity = async (itemId: string, quantity: number) => {
        return await updateCartItem({ itemId, quantity });
    };

    const handleRemoveItem = async (itemId: string) => {
        return await removeFromCart(itemId);
    };

    if (cartCount === 0) {
        return (
            <div className={styles.cartPopup}>
                <div className={styles.header}>
                    <span>Shopping Cart</span>
                    <button onClick={onClose} className={styles.closeBtn}>×</button>
                </div>
                <div className={styles.emptyCart}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.emptyIcon}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p>Your cart is empty</p>
                    <Link href="/" className={styles.shopBtn} onClick={onClose}>
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.cartPopup}>
            <div className={styles.header}>
                <span>Shopping Cart ({cartCount})</span>
                <button onClick={onClose} className={styles.closeBtn}>×</button>
            </div>

            <div className={styles.items}>
                {displayItems.map((item) => (
                    <CartItem
                        key={item._id}
                        item={item as any}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                        compact
                    />
                ))}

                {hasMoreItems && (
                    <div className={styles.moreItems}>
                        +{items.length - 3} more {items.length - 3 === 1 ? 'item' : 'items'}
                    </div>
                )}
            </div>

            <div className={styles.footer}>
                <div className={styles.total}>
                    <span>Total:</span>
                    <span className={styles.totalAmount}>{formatPrice(total, currency)}</span>
                </div>

                <div className={styles.actions}>
                    <Link href="/cart" className={styles.viewCartBtn} onClick={onClose}>
                        View Cart
                    </Link>
                    <Link href="/checkout" className={styles.checkoutBtn} onClick={onClose}>
                        Checkout
                    </Link>
                </div>
            </div>
        </div>
    );
}
