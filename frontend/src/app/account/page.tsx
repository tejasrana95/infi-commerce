'use client';

import Link from 'next/link';
import styles from './page.module.scss';
import React from 'react';
import { useCustomer } from '@/providers/AuthProvider';

export default function AccountPage() {
    const { customer, fullName } = useCustomer();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Dashboard Overview</h1>
                <p>Welcome back, {customer?.firstName || 'Guest'}! Here's what's happening with your account today.</p>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>Recent Orders</h3>
                        <Link href="/account/orders" className={styles.link}>View all</Link>
                    </div>
                    <div className={styles.emptyState}>
                        <p>No recent orders found.</p>
                        <Link href="/products" className={styles.button}>Start Shopping</Link>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>Default Address</h3>
                        <Link href="/account/addresses" className={styles.link}>Manage</Link>
                    </div>
                    <div className={styles.addressPreview}>
                        <p className={styles.name}>{customer ? `${customer.firstName} ${customer.lastName}` : 'No address saved'}</p>
                        <p>Add your shipping address</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>Account Details</h3>
                        <Link href="/account/profile" className={styles.link}>Edit</Link>
                    </div>
                    <div className={styles.detailsPreview}>
                        <p><strong>Name:</strong> {customer ? `${customer.firstName} ${customer.lastName}` : 'Guest'}</p>
                        <p><strong>Email:</strong> {customer?.email || 'Not provided'}</p>
                        <p><strong>Phone:</strong> {customer?.phone || 'Not provided'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

