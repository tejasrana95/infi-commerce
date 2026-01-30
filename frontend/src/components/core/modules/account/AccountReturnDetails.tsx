'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from './AccountReturnDetails.module.scss';
import { apiClient } from '@/services/api-client';
import { formatDate } from '@/lib/date';
import { formatPrice } from '@/lib/currency';
import Loader from '@/components/molecules/Loader';
import { useToast } from '@/providers/ToastProvider';
import { useDialog } from '@/providers/DialogProvider';

export interface ModuleProps {
    config: Record<string, any>;
    sectionType?: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
    initialData?: any;
    priority?: boolean;
}

export default function AccountReturnDetailsModule({ config = {} }: ModuleProps) {
    const params = useParams();
    const router = useRouter();
    const { addToast } = useToast();
    const { showConfirm } = useDialog();
    const id = params?.id as string;

    const [returnRequest, setReturnRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchReturnDetails = async () => {
        try {
            const response = await apiClient.get(`/returns/${id}`);
            setReturnRequest(response.data);
        } catch (error) {
            console.error('Failed to fetch return details:', error);
            // Handle error (e.g., redirect or show message)
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchReturnDetails();
        }
    }, [id]);

    const RETURN_REASONS = {
        defective: 'Defective or Damaged',
        wrong_item: 'Wrong Item Received',
        not_as_described: 'Product Not As Described',
        size_fit: 'Size or Fit Issue',
        quality: 'Quality Issue',
        changed_mind: 'Changed my mind',
        other: 'Other',
    }

    const handleCancelRequest = async () => {
        const confirmed = await showConfirm({
            title: 'Cancel Return Request',
            message: 'Are you sure you want to cancel this return request? This action cannot be undone.',
            confirmText: 'Yes, Cancel Request',
            cancelText: 'No, Keep Request',
            type: 'warning',
            isDanger: true,
        });

        if (!confirmed) return;

        try {
            await apiClient.patch(`/returns/${id}/cancel`, { reason: 'Cancelled by customer' });
            addToast('success', 'Return request cancelled successfully');
            fetchReturnDetails();
        } catch (error: any) {
            console.error('Failed to cancel request:', error);
            addToast('error', error.response?.data?.message || 'Failed to cancel request');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <Loader variant="spinner" size="lg" />
            </div>
        );
    }

    if (!returnRequest) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <h3>Return request not found</h3>
                    <Link href="/account/returns" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                        Back to Returns
                    </Link>
                </div>
            </div>
        );
    }

    const {
        requestNumber,
        _id,
        type,
        status,
        requestedAt,
        items,
        refund,
        exchange,
        statusHistory,
        orderId,
        reason,
        customerNotes,
        adminNotes,
        pickup
    } = returnRequest;

    const displayId = requestNumber || _id.slice(-6).toUpperCase();
    const currency = orderId?.currency || 'USD';

    const getStatusStyle = (s: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            pending: { bg: '#fef3c7', text: '#d97706' },
            approved: { bg: '#dbeafe', text: '#2563eb' },
            rejected: { bg: '#fee2e2', text: '#dc2626' },
            received: { bg: '#e0e7ff', text: '#4338ca' },
            completed: { bg: '#ecfccb', text: '#3f6212' },
            cancelled: { bg: '#f3f4f6', text: '#6b7280' },
        };
        return colors[s] || { bg: '#f3f4f6', text: '#4b5563' };
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <h1>{type === 'exchange' ? 'Exchange' : 'Return'} #{displayId}</h1>
                        <span className={styles.requestDate}>
                            Requested on {formatDate(requestedAt, 'medium')}
                        </span>
                    </div>
                    <Link href="/account/returns" className={styles.backLink}>
                        &larr; Back to Returns
                    </Link>
                </div>
            </div>

            <div className={styles.statusSection}>
                <div>
                    <span className={styles.statusLabel}>Current Status</span>
                    <span
                        className={styles.statusValue}
                        style={{ ...getStatusStyle(status), backgroundColor: getStatusStyle(status).bg, color: getStatusStyle(status).text }}
                    >
                        {status.replace(/_/g, ' ')}
                    </span>
                </div>
                {type === 'return' && refund && (
                    <div style={{ textAlign: 'right' }}>
                        <span className={styles.statusLabel}>Refund Amount</span>
                        <span style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--primary-color)' }}>
                            {formatPrice(refund.amount, { code: currency })}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Method: {refund.method === 'original' ? 'Original Payment' : 'Store Credit'}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <h2>Items</h2>
                <div className={styles.card}>
                    {items.map((item: any, i: number) => (
                        <div key={i} className={styles.itemRow}>
                            <div className={styles.image}>
                                {item.image ? (
                                    <img src={item.image} alt={item.name} />
                                ) : (
                                    <div className={styles.placeholder}>📦</div>
                                )}
                            </div>
                            <div className={styles.details}>
                                <h3>{item.name}</h3>
                                <div className={styles.meta}>
                                    <span>Quantity: {item.quantity}</span>
                                </div>
                            </div>
                            {type === 'return' && (
                                <div className={styles.pricing}>
                                    {formatPrice(item.refundAmount, { code: currency })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {pickup?.scheduledDate && (
                <div className={styles.section}>
                    <h2>Pickup Details</h2>
                    <div className={`${styles.card} ${styles.infoGrid}`}>
                        {pickup?.scheduledDate && (
                            <div className={styles.infoGroup}>
                                <h3>{pickup?.method === 'dropoff' ? 'Ship by' : 'Pickup Date'}</h3>
                                <p>{formatDate(pickup?.scheduledDate, 'medium')}</p>
                            </div>
                        )}
                        {pickup?.scheduledSlot && (
                            <div className={styles.infoGroup}>
                                <h3>Pickup Slot</h3>
                                <p>{pickup?.scheduledSlot}</p>
                            </div>
                        )}
                        {pickup?.courierName && (
                            <div className={styles.infoGroup}>
                                <h3>Courier Name</h3>
                                <p>{pickup?.courierName}</p>
                            </div>
                        )}
                        {pickup?.trackingNumber && (
                            <div className={styles.infoGroup}>
                                <h3>Tracking Number</h3>
                                <p>{pickup?.trackingNumber}</p>
                            </div>
                        )}
                        {pickup?.trackingUrl && (
                            <div className={styles.infoGroup}>
                                <h3>Tracking URL</h3>
                                <p><Link href={pickup?.trackingUrl} target='_blank'>{pickup?.trackingUrl}</Link></p>
                            </div>
                        )}
                        {pickup?.adminNotes && (
                            <div className={styles.infoGroup} style={{ gridColumn: 'span 2' }}>
                                <h3>Instructions</h3>
                                <p>{pickup?.adminNotes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className={styles.section}>
                <h2>Request Details</h2>
                <div className={`${styles.card} ${styles.infoGrid}`}>
                    <div className={styles.infoGroup}>
                        <h3>Related Order</h3>
                        <p>Order #{orderId?.orderNumber}</p>
                        <Link href={`/account/orders/${orderId?._id}`} style={{ fontSize: '0.875rem', color: 'var(--primary-color)' }}>
                            View Order
                        </Link>
                    </div>
                    <div className={styles.infoGroup}>
                        <h3>Return Reason</h3>
                        <p>{RETURN_REASONS[reason as keyof typeof RETURN_REASONS] || reason}</p>
                    </div>
                    {customerNotes && (
                        <div className={styles.infoGroup} style={{ gridColumn: 'span 2' }}>
                            <h3>Your Notes</h3>
                            <p>{customerNotes}</p>
                        </div>
                    )}
                    {adminNotes && (
                        <div className={styles.infoGroup} style={{ gridColumn: 'span 2' }}>
                            <h3>Admin Notes</h3>
                            <p>{adminNotes}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <h2>Timeline</h2>
                <div className={styles.card} style={{ padding: '1.5rem' }}>
                    <div className={styles.timeline}>
                        {statusHistory?.slice().reverse().map((hist: any, i: number) => (
                            <div key={i} className={styles.timelineItem}>
                                <h4>{hist.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</h4>
                                <time>{formatDate(hist.updatedAt, 'long')}</time>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {['pending', 'approved'].includes(status) && (
                <div className={styles.actionPanel}>
                    <h3>Actions</h3>
                    <button onClick={handleCancelRequest}>
                        Cancel Request
                    </button>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        You can cancel this request as long as it hasn't been completed.
                    </p>
                </div>
            )}
        </div>
    );
}
