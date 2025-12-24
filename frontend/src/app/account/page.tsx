'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';
import { useCustomer } from '@/providers/AuthProvider';
import api from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import Loader from '@/components/molecules/Loader';

interface Order {
    _id: string;
    orderNumber: string;
    status: string;
    total: number;
    currency: string;
    createdAt: string;
    items: Array<{
        product: { name: string; images: string[] };
        quantity: number;
    }>;
}

export default function AccountPage() {
    const { customer, defaultShippingAddress } = useCustomer();
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentOrders = async () => {
            try {
                const response = await api.get('orders/user/me?limit=3');
                setRecentOrders(response.orders || []);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentOrders();
    }, []);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: '#f59e0b',
            processing: '#3b82f6',
            shipped: '#8b5cf6',
            delivered: '#10b981',
            cancelled: '#ef4444',
        };
        return colors[status] || '#6b7280';
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader variant="spinner" size="lg" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Welcome Header */}
            <header className={styles.header}>
                <div className={styles.welcomeSection}>
                    <div className={styles.avatar}>
                        {customer?.firstName?.[0]}{customer?.lastName?.[0]}
                    </div>
                    <div className={styles.welcomeText}>
                        <h1>Welcome back, {customer?.firstName || 'Guest'}!</h1>
                        <p>Here's what's happening with your account today.</p>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{recentOrders.length}</span>
                        <span className={styles.statLabel}>Total Orders</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{customer?.wishlist?.length || 0}</span>
                        <span className={styles.statLabel}>Wishlist Items</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{customer?.addresses?.length || 0}</span>
                        <span className={styles.statLabel}>Saved Addresses</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className={styles.grid}>
                {/* Recent Orders */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>Recent Orders</h2>
                        <Link href="/account/orders" className={styles.viewAllLink}>
                            View all
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                    <div className={styles.cardBody}>
                        {recentOrders.length > 0 ? (
                            <div className={styles.orderList}>
                                {recentOrders.map((order) => (
                                    <Link
                                        key={order._id}
                                        href={`/account/orders/${order._id}`}
                                        className={styles.orderItem}
                                    >
                                        <div className={styles.orderInfo}>
                                            <span className={styles.orderNumber}>#{order.orderNumber}</span>
                                            <span className={styles.orderDate}>
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className={styles.orderMeta}>
                                            <span
                                                className={styles.orderStatus}
                                                style={{ backgroundColor: getStatusColor(order.status) }}
                                            >
                                                {order.status}
                                            </span>
                                            <span className={styles.orderTotal}>
                                                {formatPrice(order.total, order.currency)}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <circle cx="9" cy="21" r="1"></circle>
                                    <circle cx="20" cy="21" r="1"></circle>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                                <p>No orders yet</p>
                                <Link href="/products" className={styles.shopButton}>
                                    Start Shopping
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Default Address */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>Default Address</h2>
                        <Link href="/account/addresses" className={styles.viewAllLink}>
                            Manage
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                    <div className={styles.cardBody}>
                        {defaultShippingAddress ? (
                            <div className={styles.addressCard}>
                                <div className={styles.addressIcon}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                                <div className={styles.addressDetails}>
                                    <p className={styles.addressName}>
                                        {defaultShippingAddress.firstName} {defaultShippingAddress.lastName}
                                    </p>
                                    <p>{defaultShippingAddress.address1}</p>
                                    {defaultShippingAddress.address2 && <p>{defaultShippingAddress.address2}</p>}
                                    <p>
                                        {defaultShippingAddress.city}, {defaultShippingAddress.state} {defaultShippingAddress.postalCode}
                                    </p>
                                    <p>{defaultShippingAddress.country}</p>
                                    <p className={styles.addressPhone}>{defaultShippingAddress.phone}</p>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p>No address saved</p>
                                <Link href="/account/addresses" className={styles.shopButton}>
                                    Add Address
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Account Details */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>Account Details</h2>
                        <Link href="/account/profile" className={styles.viewAllLink}>
                            Edit
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.detailsList}>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Name</span>
                                <span className={styles.detailValue}>
                                    {customer?.firstName} {customer?.lastName}
                                </span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Email</span>
                                <span className={styles.detailValue}>{customer?.email}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Phone</span>
                                <span className={styles.detailValue}>
                                    {customer?.phone || 'Not provided'}
                                </span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Email Verified</span>
                                <span className={`${styles.detailValue} ${customer?.emailVerified ? styles.verified : styles.notVerified}`}>
                                    {customer?.emailVerified ? '✓ Verified' : 'Not verified'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
