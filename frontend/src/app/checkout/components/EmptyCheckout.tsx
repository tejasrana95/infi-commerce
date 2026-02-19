'use client';

import Link from 'next/link';
import styles from './EmptyCheckout.module.scss';

const placeholders = ['Small Idol', 'Medium Idol', 'Large Idol'];

export default function EmptyCheckout() {
    return (
        <section className={styles.wrap}>
            <div className={styles.card}>
                <div className={styles.surfaceGlow} aria-hidden="true"></div>

                <div className={styles.left}>
                    <p className={styles.kicker}>Checkout</p>
                    <h1 className={styles.title}>Your cart is waiting for something beautiful</h1>
                    <p className={styles.subtitle}>
                        Explore our collection and add your favorites. Once items are added,
                        checkout will continue from here.
                    </p>

                    <div className={styles.actions}>
                        <Link href="/" className={styles.primaryBtn}>
                            Continue Shopping
                        </Link>
                        <Link href="/products" className={styles.secondaryBtn}>
                            Browse Products
                        </Link>
                    </div>

                    <form className={styles.searchForm} action="/search">
                        <input type="text" name="q" placeholder="Search by deity, size, or stone..." />
                        <button type="submit">Search</button>
                    </form>
                </div>

                <aside className={styles.right}>
                    <div className={styles.previewHeader}>
                        <span>Cart Preview</span>
                        <span>0 Items</span>
                    </div>

                    <div className={styles.previewList}>
                        {placeholders.map((item) => (
                            <div key={item} className={styles.previewItem}>
                                <div className={styles.thumb} aria-hidden="true"></div>
                                <div className={styles.lines}>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.previewFooter}>
                        <div>
                            <span>Subtotal</span>
                            <strong>₹0.00</strong>
                        </div>
                        <button type="button" disabled>
                            Checkout Disabled
                        </button>
                    </div>
                </aside>
            </div>
        </section>
    );
}
