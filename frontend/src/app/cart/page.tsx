'use client';

import Link from 'next/link';
import styles from './page.module.scss';

export default function CartPage() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.title}>Shopping Cart</h1>

                <div className={styles.layout}>
                    {/* Cart Items */}
                    <div className={styles.cartItems}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className={styles.cartItem}>
                                <div className={styles.itemImage}></div>
                                <div className={styles.itemDetails}>
                                    <h3>Product Name {i}</h3>
                                    <p className={styles.variant}>Size: M / Color: Black</p>
                                    <p className={styles.price}>$99.00</p>
                                </div>
                                <div className={styles.quantity}>
                                    <button>-</button>
                                    <input type="number" value="1" readOnly />
                                    <button>+</button>
                                </div>
                                <button className={styles.remove}>×</button>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className={styles.summary}>
                        <h2>Order Summary</h2>
                        <div className={styles.summaryRow}>
                            <span>Subtotal</span>
                            <span>$297.00</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Shipping</span>
                            <span>Calculated at checkout</span>
                        </div>
                        <div className={styles.divider}></div>
                        <div className={`${styles.summaryRow} ${styles.total}`}>
                            <span>Total</span>
                            <span>$297.00</span>
                        </div>
                        <button className={styles.checkoutBtn}>Proceed to Checkout</button>
                        <Link href="/" className={styles.continueLink}>Continue Shopping</Link>
                    </div>
                </div>

                <div className={styles.notice}>
                    <p>🚧 Cart functionality under development</p>
                </div>
            </div>
        </div>
    );
}
