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
import { Box } from 'lucide-react';
import { REFUND_METHODS } from '@/lib/constants';

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
                            Method: {REFUND_METHODS[refund.method ?? ''] || refund.method || 'N/A'}
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
                                    <div className={styles.placeholder}><Box /></div>
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
            {refund?.method === 'bank_transfer' && (
                <div className={styles.section}>
                    <h2>Bank Details</h2>
                    <div className={`${styles.card} ${styles.infoGrid}`}>
                        {refund?.bankDetails?.accountHolderName && (
                            <div className={styles.infoGroup}>
                                <h3>Account Holder Name</h3>
                                <p>{refund?.bankDetails?.accountHolderName}</p>
                            </div>
                        )}
                        {refund?.bankDetails?.accountNumber && (
                            <div className={styles.infoGroup}>
                                <h3>Account Number</h3>
                                <p>{refund?.bankDetails?.accountNumber}</p>
                            </div>
                        )}
                        {refund?.bankDetails?.accountType && (
                            <div className={`${styles.infoGroup} capitalize`}>
                                <h3>Account Type</h3>
                                <p>{refund?.bankDetails?.accountType}</p>
                            </div>
                        )}
                        {refund?.bankDetails?.routingNumber && (
                            <div className={styles.infoGroup}>
                                <h3>Routing Number</h3>
                                <p>{refund?.bankDetails?.routingNumber}</p>
                            </div>
                        )}
                        {refund?.bankDetails?.swiftBicCode && (
                            <div className={styles.infoGroup}>
                                <h3>IFSC/SWIFT/BIC Code</h3>
                                <p>{refund?.bankDetails?.swiftBicCode}</p>
                            </div>
                        )}
                        {refund?.bankDetails?.bankName && (
                            <div className={styles.infoGroup}>
                                <h3>Bank Name</h3>
                                <p>{refund?.bankDetails?.bankName}</p>
                            </div>
                        )}
                        {refund?.bankDetails?.branchAddress && (
                            <div className={styles.infoGroup}>
                                <h3>Branch Address</h3>
                                <p>{refund?.bankDetails?.branchAddress}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className={styles.section}>
                <h2>Timeline</h2>
                <div className={styles.card} style={{ padding: '1.5rem' }}>
                    {statusHistory && statusHistory.length > 0 ? (
                        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                            {/* Vertical line */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '0.4rem',
                                    top: 0,
                                    bottom: 0,
                                    width: '2px',
                                    background: 'linear-gradient(to bottom, #d97706, #2563eb, #4338ca, #3f6212)',
                                    opacity: 0.3
                                }}
                            />

                            {statusHistory.slice().reverse().map((event: any, index: number) => {
                                const statusText = (event.status || '').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                                const { text: markerColor } = getStatusStyle(event.status || '');

                                // Handle updatedBy safely
                                let updatedByText = '';
                                if (event.updatedBy) {
                                    if (typeof event.updatedBy === 'string') {
                                        updatedByText = event.updatedBy;
                                    } else if (typeof event.updatedBy === 'object') {
                                        const first = event.updatedBy.firstName || '';
                                        const last = event.updatedBy.lastName || '';
                                        updatedByText = `${first} ${last}`.trim() || event.updatedBy.name || '';
                                    }
                                }

                                return (
                                    <div
                                        key={index}
                                        style={{
                                            position: 'relative',
                                            marginBottom: index !== statusHistory.length - 1 ? '2rem' : 0,
                                            paddingBottom: index !== statusHistory.length - 1 ? '0' : 0
                                        }}
                                    >
                                        {/* Timeline dot */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: '-2.05rem',
                                                top: '0.125rem',
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '50%',
                                                backgroundColor: markerColor,
                                                border: '3px solid white',
                                                boxShadow: `0 0 0 2px ${markerColor}80`,
                                                zIndex: 2
                                            }}
                                        />

                                        {/* Content */}
                                        <div style={{ paddingTop: '0.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                                                    {statusText}
                                                </h4>
                                                <time style={{ fontSize: '0.85rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                                    {formatDate(event.updatedAt, 'long')}
                                                </time>
                                            </div>

                                            {event.note && (
                                                <p style={{
                                                    margin: '0.5rem 0 0 0',
                                                    fontSize: '0.9375rem',
                                                    color: '#4b5563',
                                                    lineHeight: 1.6
                                                }}>
                                                    {event.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#9ca3af', margin: 0, padding: '1rem 0' }}>
                            No timeline updates yet
                        </p>
                    )}
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
