'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './AccountOrders.module.scss';
import api from '@/lib/api';
import { formatDate } from '@/lib/date';
import { formatPrice } from '@/lib/currency';
import Loader from '@/components/molecules/Loader';
import { ModuleProps } from '@/components/core/modules';

interface OrderItem {
    name: string;
    image: string;
    quantity: number;
    price: number;
}

interface Order {
    _id: string;
    orderNumber: string;
    status: string;
    total: number;
    subtotal: number;
    shipping: number;
    tax: number;
    currency: string;
    exchangeRate: number;
    createdAt: string;
    items: OrderItem[];
    shippingAddress: {
        firstName: string;
        lastName: string;
        city: string;
        state: string;
    };
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#fef3c7', text: '#d97706' },
    processing: { bg: '#dbeafe', text: '#2563eb' },
    shipped: { bg: '#ede9fe', text: '#7c3aed' },
    delivered: { bg: '#d1fae5', text: '#059669' },
    cancelled: { bg: '#fee2e2', text: '#dc2626' },
};

export default function AccountOrdersModule({ config = {} }: ModuleProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const limit = config?.limit || 10;

    const fetchOrders = async (pageNum: number, statusFilter: string) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', pageNum.toString());
            queryParams.append('limit', limit.toString());
            if (statusFilter !== 'all') {
                queryParams.append('status', statusFilter);
            }

            const response = await api.get(`orders/user/me?${queryParams.toString()}`);
            setOrders(response.orders || []);
            setTotalPages(response.pagination?.pages || 1);
            setTotalOrders(response.pagination?.total || 0);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(page, filter);
    }, [page, filter]);

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        setPage(1); // Reset to first page on filter change
    };


    const getStatusStyle = (status: string) => {
        return STATUS_COLORS[status] || { bg: '#f3f4f6', text: '#4b5563' };
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
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>My Orders</h1>
                    <p>View and track all your orders</p>
                </div>
            </header>

            <div className={styles.filterTabs}>
                {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <button
                        key={status}
                        className={`${styles.filterTab} ${filter === status ? styles.active : ''}`}
                        onClick={() => handleFilterChange(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === 'all' && ` (${totalOrders})`}
                    </button>
                ))}
            </div>

            {orders.length > 0 ? (
                <>
                    <div className={styles.orderList}>
                        {orders.map((order) => {
                            const statusStyle = getStatusStyle(order.status);
                            return (
                                <div key={order._id} className={styles.orderCard}>
                                    <div className={styles.orderHeader}>
                                        <div className={styles.orderMeta}>
                                            <span className={styles.orderNumber}>Order #{order.orderNumber}</span>
                                            <span className={styles.orderDate}>
                                                {formatDate(order.createdAt, 'long')}
                                            </span>
                                        </div>
                                        <span
                                            className={styles.statusBadge}
                                            style={{
                                                backgroundColor: statusStyle.bg,
                                                color: statusStyle.text
                                            }}
                                        >
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className={styles.orderItems}>
                                        {order.items.slice(0, 3).map((item, index) => (
                                            <div key={index} className={styles.itemRow}>
                                                <div className={styles.itemImage}>
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} />
                                                    ) : (
                                                        <div className={styles.placeholder}>📦</div>
                                                    )}
                                                </div>
                                                <div className={styles.itemDetails}>
                                                    <span className={styles.itemName}>{item.name || 'Product'}</span>
                                                    <span className={styles.itemQty}>Qty: {item.quantity}</span>
                                                </div>
                                                <span className={styles.itemPrice}>
                                                    {formatPrice(item.price * item.quantity, { code: order.currency, exchangeRate: order.exchangeRate })}
                                                </span>
                                            </div>
                                        ))}
                                        {order.items.length > 3 && (
                                            <p className={styles.moreItems}>
                                                +{order.items.length - 3} more item(s)
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.orderFooter}>
                                        <div className={styles.orderTotal}>
                                            <span>Total</span>
                                            <strong>{formatPrice(order.total, { code: order.currency, exchangeRate: order.exchangeRate })}</strong>
                                        </div>
                                        <div className={styles.orderActions}>
                                            <Link href={`/account/orders/${order._id}`} className={styles.detailsBtn}>
                                                View Details
                                            </Link>
                                            {order.status === 'shipped' && (
                                                <Link href={`/track/${order.orderNumber}`} className={styles.trackBtn}>
                                                    Track Order
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </button>

                            <div className={styles.pageNumbers}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                    <button
                                        key={pageNum}
                                        className={`${styles.pageNumber} ${page === pageNum ? styles.active : ''}`}
                                        onClick={() => setPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            </div>

                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    </div>
                    <h3>No orders found</h3>
                    <p>
                        {filter === 'all'
                            ? "You haven't placed any orders yet."
                            : `No ${filter} orders found.`}
                    </p>
                    <Link href="/products" className={styles.shopBtn}>
                        Start Shopping
                    </Link>
                </div>
            )}
        </div>
    );
}
