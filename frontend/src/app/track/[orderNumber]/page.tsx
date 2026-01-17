'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Loader from '@/components/molecules/Loader';
import { formatDate } from '@/lib/date';
import styles from './page.module.scss';

interface ShippingDetails {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
    shippedDate?: string;
}

interface Order {
    _id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    shippingDetails?: ShippingDetails;
    shippingAddress?: {
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
}

const STATUS_STEPS = [
    { key: 'pending', label: 'Order Placed', icon: '📦' },
    { key: 'processing', label: 'Processing', icon: '⚙️' },
    { key: 'shipped', label: 'Shipped', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '✅' },
];

export default function TrackOrderPage() {
    const params = useParams();
    const router = useRouter();
    const orderNumber = params.orderNumber as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await api.get(`orders/track/${orderNumber}`);
                setOrder(response.order);
            } catch (err: any) {
                console.error('Failed to fetch order:', err);
                setError(err.response?.data?.message || 'Order not found');
            } finally {
                setLoading(false);
            }
        };

        if (orderNumber) {
            fetchOrder();
        }
    }, [orderNumber]);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <Loader variant="spinner" size="lg" />
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <div className={styles.errorIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h2>Order Not Found</h2>
                    <p>{error || 'We couldn\'t find an order with this tracking number.'}</p>
                    <Link href="/account/orders" className={styles.backBtn}>
                        View My Orders
                    </Link>
                </div>
            </div>
        );
    }

    // Determine current step
    const getCurrentStepIndex = () => {
        const statusIndex = STATUS_STEPS.findIndex(step => step.key === order.status);
        return statusIndex >= 0 ? statusIndex : 0;
    };

    const currentStepIndex = getCurrentStepIndex();

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <header className={styles.header}>
                    <h1>Track Your Order</h1>
                    <p className={styles.orderNumber}>Order #{order.orderNumber}</p>
                    <p className={styles.orderDate}>
                        Placed on {formatDate(order.createdAt, 'long')}
                    </p>
                </header>

                {/* Status Timeline */}
                <div className={styles.timeline}>
                    {STATUS_STEPS.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const isCancelled = order.status === 'cancelled';

                        return (
                            <div
                                key={step.key}
                                className={`${styles.timelineStep} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
                            >
                                <div className={styles.stepIcon}>
                                    {isCompleted ? (
                                        <span className={styles.checkmark}>✓</span>
                                    ) : (
                                        <span className={styles.emoji}>{step.icon}</span>
                                    )}
                                </div>
                                <div className={styles.stepContent}>
                                    <h3>{step.label}</h3>
                                    {isCurrent && !isCancelled && (
                                        <p className={styles.currentStatus}>Current Status</p>
                                    )}
                                </div>
                                {index < STATUS_STEPS.length - 1 && (
                                    <div className={`${styles.connector} ${isCompleted ? styles.connectorCompleted : ''}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Cancelled Status */}
                {order.status === 'cancelled' && (
                    <div className={styles.cancelledBanner}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <div>
                            <h3>Order Cancelled</h3>
                            <p>This order has been cancelled</p>
                        </div>
                    </div>
                )}

                {/* Shipping Details */}
                {order.status === 'shipped' && order.shippingDetails && (
                    <div className={styles.shippingCard}>
                        <h2>Shipping Information</h2>
                        <div className={styles.shippingGrid}>
                            {order.shippingDetails.carrier && (
                                <div className={styles.shippingItem}>
                                    <span className={styles.label}>Carrier</span>
                                    <span className={styles.value}>{order.shippingDetails.carrier}</span>
                                </div>
                            )}
                            {order.shippingDetails.trackingNumber && (
                                <div className={styles.shippingItem}>
                                    <span className={styles.label}>Tracking Number</span>
                                    <span className={styles.value}>{order.shippingDetails.trackingNumber}</span>
                                </div>
                            )}
                            {order.shippingDetails.shippedDate && (
                                <div className={styles.shippingItem}>
                                    <span className={styles.label}>Shipped Date</span>
                                    <span className={styles.value}>
                                        {formatDate(order.shippingDetails.shippedDate, 'long')}
                                    </span>
                                </div>
                            )}
                            {order.shippingDetails.estimatedDelivery && (
                                <div className={styles.shippingItem}>
                                    <span className={styles.label}>Estimated Delivery</span>
                                    <span className={styles.value}>
                                        {formatDate(order.shippingDetails.estimatedDelivery, 'long')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {order.shippingDetails.trackingUrl && (
                            <a
                                href={order.shippingDetails.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.trackingLink}
                            >
                                Track with {order.shippingDetails.carrier || 'Carrier'}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        )}
                    </div>
                )}

                {/* Shipping Address */}
                {order.shippingAddress && (
                    <div className={styles.addressCard}>
                        <h2>Delivery Address</h2>
                        <div className={styles.address}>
                            <p className={styles.name}>
                                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                            </p>
                            <p>{order.shippingAddress.address}</p>
                            <p>
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className={styles.actions}>
                    <Link href={`/account/orders/${order._id}`} className={styles.detailsBtn}>
                        View Order Details
                    </Link>
                    <Link href="/account/orders" className={styles.backBtn}>
                        Back to Orders
                    </Link>
                </div>
            </div>
        </div>
    );
}
