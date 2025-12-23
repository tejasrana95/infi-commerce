'use client';

import React from 'react';
import Link from 'next/link';
import styles from './page.module.scss';

export default function OrdersPage() {
    const orders = []; // Mock empty orders for now

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>My Orders</h1>
                <p>View and track your recent orders.</p>
            </header>

            {orders.length > 0 ? (
                <div className={styles.list}>
                    {/* Order list would go here */}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.icon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    </div>
                    <h3>No orders yet</h3>
                    <p>Looks like you haven't placed any orders yet.</p>
                    <Link href="/products" className={styles.button}>Start Shopping</Link>
                </div>
            )}
        </div>
    );
}
