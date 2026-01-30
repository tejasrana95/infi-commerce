'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './AccountReturns.module.scss';
import { apiClient } from '@/services/api-client';
import { formatDate } from '@/lib/date';
import { formatPrice } from '@/lib/currency';
import Loader from '@/components/molecules/Loader';
import Chip from '@/components/atoms/Chip';

export interface ModuleProps {
    config: Record<string, any>;
    sectionType?: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
    initialData?: any;
    priority?: boolean;
}

interface ReturnItem {
    name: string;
    image?: string;
    quantity: number;
    refundAmount: number;
}

interface ReturnRequest {
    _id: string;
    requestNumber?: string; // Should be added in backend if not present, fallback to ID slice
    orderId: {
        _id: string;
        orderNumber: string;
        currency: string;
    };
    status: string;
    type: 'return' | 'exchange';
    requestedAt: string;
    items: ReturnItem[];
    refund?: {
        amount: number;
    };
    adminNotes?: string;
    customerNotes?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#fef3c7', text: '#d97706' },
    approved: { bg: '#dbeafe', text: '#2563eb' },
    rejected: { bg: '#fee2e2', text: '#dc2626' },
    received: { bg: '#e0e7ff', text: '#4338ca' },
    refund_processed: { bg: '#d1fae5', text: '#059669' },
    refund_completed: { bg: '#d1fae5', text: '#059669' },
    completed: { bg: '#ecfccb', text: '#3f6212' },
    cancelled: { bg: '#f3f4f6', text: '#6b7280' },
};

export default function AccountReturnsModule({ config = {} }: ModuleProps) {
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReturns, setTotalReturns] = useState(0);
    const limit = config?.limit || 10;

    const fetchReturns = async (pageNum: number, statusFilter: string) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', pageNum.toString());
            queryParams.append('limit', limit.toString());
            if (statusFilter !== 'all') {
                queryParams.append('status', statusFilter);
            }

            // Using the endpoint from backend controller logic
            const response = await apiClient.get(`/returns/user/me?${queryParams.toString()}`);
            setReturns(response.data || []);
            setTotalPages(response.pagination?.pages || 1);
            setTotalReturns(response.pagination?.total || 0);
        } catch (error) {
            console.error('Failed to fetch returns:', error);
            // setReturns([]); // Keep previous if failed? Or clear?
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns(page, filter);
    }, [page, filter]);

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        setPage(1);
    };

    const getStatusStyle = (status: string) => {
        return STATUS_COLORS[status] || { bg: '#f3f4f6', text: '#4b5563' };
    };

    if (loading && returns.length === 0) {
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
                    <h1>Returns & Refunds</h1>
                    <p>Track and manage your return requests</p>
                </div>
            </header>

            <div className={styles.filterTabs}>
                {['all', 'pending', 'approved', 'rejected', 'completed', 'refund_completed'].map((status) => {
                    const statusName = status.replace('_', ' ');

                    return (
                        <button
                            key={status}
                            className={`${styles.filterTab} ${filter === status ? styles.active : ''}`}
                            onClick={() => handleFilterChange(status)}
                        >
                            {statusName.charAt(0).toUpperCase() + statusName.slice(1)}
                        </button>
                    )
                })}
            </div>

            {returns.length > 0 ? (
                <>
                    <div className={styles.returnsList}>
                        {returns.map((ret) => {
                            const statusStyle = getStatusStyle(ret.status);
                            return (
                                <div key={ret._id} className={styles.returnCard}>
                                    <div className={styles.returnHeader}>
                                        <div className={styles.returnMeta}>
                                            <span className={styles.returnNumber}>
                                                {ret.type === 'exchange' ? 'Exchange' : 'Return'} #{ret.requestNumber || ret._id.slice(-6).toUpperCase()}
                                            </span>
                                            <span className={styles.returnDate}>
                                                Requested on {formatDate(ret.requestedAt, 'medium')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Chip variant="default" size="small">
                                                Order #{ret.orderId?.orderNumber}
                                            </Chip>
                                            <span
                                                className={styles.statusBadge}
                                                style={{
                                                    backgroundColor: statusStyle.bg,
                                                    color: statusStyle.text
                                                }}
                                            >
                                                {ret.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.returnItems}>
                                        {ret.items.slice(0, 3).map((item, index) => (
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
                                                {ret.type === 'return' && (
                                                    <span className={styles.itemRefund}>
                                                        {formatPrice(item.refundAmount, { code: ret.orderId?.currency || 'USD' })}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {ret.items.length > 3 && (
                                            <p className={styles.moreItems}>
                                                +{ret.items.length - 3} more item(s)
                                            </p>
                                        )}
                                    </div>



                                    <div className={styles.returnFooter}>
                                        <div className={styles.totalRefund}>
                                            {ret.type === 'return' && (
                                                <>
                                                    <span>Total Refund:</span>
                                                    <strong>
                                                        {formatPrice(ret.refund?.amount || 0, { code: ret.orderId?.currency || 'USD' })}
                                                    </strong>
                                                </>
                                            )}
                                        </div>
                                        <div className={styles.returnActions}>
                                            <Link href={`/account/returns/${ret._id}`} className={styles.viewBtn}>
                                                View Details
                                            </Link>
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
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <polyline points="9 14 4 9 9 4"></polyline>
                            <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                        </svg>
                    </div>
                    <h3>No returns found</h3>
                    <p>
                        {filter === 'all'
                            ? "You haven't made any return requests yet."
                            : `No ${filter.replace('_', ' ')} returns found.`}
                    </p>
                    <Link href="/account/orders" className={styles.shopBtn}>
                        Go to My Orders
                    </Link>
                </div>
            )}
        </div>
    );
}
