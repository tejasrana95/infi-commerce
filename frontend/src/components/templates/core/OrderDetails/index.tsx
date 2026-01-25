'use client';

import React from 'react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';
import styles from './OrderDetails.module.scss';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/services/api-client';
import { useToast } from '@/providers/ToastProvider';
import { useDialog } from '@/providers/DialogProvider';
import Chip from '@/components/atoms/Chip';

// Types reuse
export interface OrderItem {
    name: string;
    sku: string;
    price: number;
    quantity: number;
    image?: string;
    attributes?: Record<string, string>;
    discount?: {
        amount?: number;
        appliedAt?: string; // ISO date string
        discountType?: 'fixed' | 'percentage';
        discountedPrice?: number;
        originalPrice?: number;
    }
}

export interface OrderAddress {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
}

export interface TaxBreakdown {
    name: string;
    rate: number;
    amount: number;
}

export interface OrderDetails {
    _id: string;
    orderNumber: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'return_requested' | 'returned';
    paymentStatus: string;
    paymentMethod: string;
    items: OrderItem[];
    shippingAddress: OrderAddress;
    billingAddress: OrderAddress;
    subtotal: number;
    shippingCost: number;
    tax: number;
    taxBreakdown?: TaxBreakdown[];
    discount: number;
    couponCode?: string;
    total: number;
    currency: string;
    exchangeRate: number;
    customerNote?: string;
    adminNote?: string;
    refundStatus?: 'none' | 'requested' | 'approved' | 'rejected' | 'processed';
    refundReason?: string;
    refundRequestedAt?: string;
    createdAt: string;
    shippedAt?: string;
    deliveredAt?: string;
    trackingNumber?: string;
    trackingUrl?: string; // Add trackingUrl
    courierName?: string; // Add courierName
    guestEmail?: string;
    isPOSOrder?: boolean;
}

interface OrderDetailsTemplateProps {
    order: OrderDetails;
    loading?: boolean;
    onRefresh?: () => Promise<void>;
}

export default function OrderDetailsTemplate({ order, loading, onRefresh }: OrderDetailsTemplateProps) {
    const router = useRouter();
    const currency = useCurrency();
    const { isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const [downloading, setDownloading] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState('');
    const [requestingReturn, setRequestingReturn] = useState(false);
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [requestingRefund, setRequestingRefund] = useState(false);
    const { showConfirm } = useDialog();
    const handleCancelOrder = async () => {

        const confirmed = await showConfirm({
            title: 'Cancel Order',
            message: 'Are you sure you want to cancel this order? This action cannot be undone.',
            confirmText: 'Yes, Cancel Order',
            cancelText: 'No, Keep Order',
            type: 'warning',
            isDanger: true,
        });

        if (!confirmed) {
            return;
        }

        try {
            setCancellingOrder(true);
            await apiClient.post(`/orders/${order._id}/cancel`);
            addToast('success', 'Order cancelled successfully');
            if (onRefresh) {
                await onRefresh();
            } else {
                router.refresh();
            }
        } catch (error) {
            addToast('error', 'Failed to cancel order');
        } finally {
            setCancellingOrder(false);
        }
    };

    const handleRequestRefund = async () => {
        if (!refundReason.trim()) {
            addToast('error', 'Please provide a reason for refund');
            return;
        }
        try {
            setRequestingRefund(true);
            await apiClient.post(`/orders/${order._id}/refund-request`, {
                reason: refundReason
            });
            addToast('success', 'Refund request submitted successfully');
            setShowRefundModal(false);
            if (onRefresh) {
                await onRefresh();
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error(error);
            addToast('error', 'Failed to request refund');
        } finally {
            setRequestingRefund(false);
        }
    };

    const handleRequestReturn = async () => {
        if (!returnReason.trim()) {
            addToast('error', 'Please provide a reason for return');
            return;
        }
        try {
            setRequestingReturn(true);
            await apiClient.post(`/orders/${order._id}/return-request`, {
                reason: returnReason
            });
            addToast('success', 'Return requested successfully');
            setShowReturnModal(false);
            if (onRefresh) {
                await onRefresh();
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error(error);
            addToast('error', 'Failed to request return');
        } finally {
            setRequestingReturn(false);
        }
    };

    // We can also allow overriding currency if strictly needed from order object
    // but standard approach is to use store currency context or handle conversion if needed.
    // For now assuming store currency context is correct or order.currency matches store.

    const handleDownloadInvoice = async () => {
        try {
            setDownloading(true);
            const blob = await apiClient.getBlob(`orders/${order._id}/invoice`);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${order.orderNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            addToast('success', 'Invoice downloaded successfully');
        } catch (error) {
            console.error("Download failed", error);
            addToast('error', 'Failed to download invoice');
        } finally {
            setDownloading(false);
        }
    };

    const getStatusStep = (status: string) => {
        const steps = ['pending', 'processing', 'shipped', 'delivered'];
        if (['cancelled', 'refunded', 'returned', 'return_requested'].includes(status)) return -1;
        return steps.indexOf(status);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading order details...</p>
            </div>
        );
    }

    if (!order) return null;

    const currentStep = getStatusStep(order.status);
    const isCancelled = ['cancelled', 'refunded', 'returned', 'return_requested'].includes(order.status);

    const getAttributeLabel = (key: string) => {
        // If key looks like a MongoDB ID (24 hex chars), probably a variant ID.
        // We can't easily map it to a name here without more data, so we'll just return 'Option' or empty.
        // For standard UI, let's just ignore the key if it looks like an ID and only show value,
        // or formatting it if it's a readable key.
        if (/^[a-fA-F0-9]{24}$/.test(key)) return '';
        return `${key}: `;
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.container}>
                <div className={styles.content}>
                    {/* Header Section */}
                    <div className={styles.header}>
                        <div className={styles.headerTop}>
                            <div>
                                <h1>Order #{order.orderNumber}</h1>
                                <p className={styles.date}>Placed on {formatDate(order.createdAt)}</p>
                            </div>
                            {order.isPOSOrder && <Chip variant="info" size="medium">POS Order</Chip>}
                            {!order.isPOSOrder && (
                                <div className={styles.actions}>
                                    <button
                                        className={styles.btnSecondary}
                                        onClick={handleDownloadInvoice}
                                        disabled={downloading}
                                    >
                                        {downloading ? 'Downloading...' : 'Download Invoice'}
                                    </button>

                                    {order.status === 'delivered' && (
                                        <button
                                            className={styles.btnSecondary}
                                            onClick={() => setShowReturnModal(true)}
                                        >
                                            Request Return
                                        </button>
                                    )}

                                    {(order.status === 'pending' || order.status === 'processing') && (
                                        <button
                                            className={styles.btnSecondary}
                                            onClick={handleCancelOrder}
                                            disabled={cancellingOrder}
                                            style={{ color: 'var(--color-error, #dc3545)' }}
                                        >
                                            {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                                        </button>
                                    )}

                                    {order.paymentStatus === 'paid' && (!order.refundStatus || order.refundStatus === 'none' || order.refundStatus === 'rejected') && order.status !== 'refunded' && (
                                        <button
                                            className={styles.btnSecondary}
                                            onClick={() => setShowRefundModal(true)}
                                        >
                                            {order.refundStatus === 'rejected' ? 'Re-request Refund' : 'Request Refund'}
                                        </button>
                                    )}

                                    {order.trackingNumber && order.trackingUrl && (
                                        <a
                                            href={order.trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.btnPrimary}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                padding: '0.75rem 1.5rem',
                                                backgroundColor: 'var(--color-primary, #000)',
                                                color: 'white',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                textDecoration: 'none',
                                            }}
                                        >
                                            Track Order
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Order Status Timeline */}
                        <div className={styles.timeline}>
                            {isCancelled ? (
                                <div className={`${styles.statusBadge} ${styles[order.status]}`}>
                                    {order.status.replace('_', ' ').toUpperCase()}
                                </div>
                            ) : (
                                <div className={styles.steps}>
                                    {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, index) => {
                                        const stepName = step.toLowerCase();
                                        const isCompleted = index <= currentStep;
                                        const isActive = index === currentStep;

                                        return (
                                            <div
                                                key={step}
                                                className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}
                                            >
                                                <div className={styles.stepIcon}>
                                                    {index < currentStep ? '✓' : index + 1}
                                                </div>
                                                <span className={styles.stepLabel}>{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.grid}>
                        {/* Main Column */}
                        <div className={styles.main}>
                            {/* Order Items */}
                            <section className={`${styles.card}`}>
                                <h2>Items ({order.items.length})</h2>
                                <div className={styles.itemsList}>
                                    {order.items.map((item, index) => (
                                        <div key={index} className={styles.item}>
                                            <div className={styles.itemImage}>
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} />
                                                ) : (
                                                    <div className={styles.placeholder}>📦</div>
                                                )}
                                            </div>
                                            <div className={styles.itemDetails}>
                                                <h3>{item.name}</h3>
                                                <p className={styles.sku}>SKU: {item.sku}</p>
                                                {item.attributes && Object.keys(item.attributes).length > 0 && (
                                                    <div className={styles.attributes}>
                                                        {Object.entries(item.attributes).map(([key, value]) => (
                                                            <span key={key}>
                                                                {getAttributeLabel(key)}{value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {item?.discount?.amount && (
                                                    <div className={styles.discountChip}>
                                                        <Chip variant="discount" size="small">
                                                            -{item.discount.discountType === 'percentage' ? item.discount.amount + '%' : formatPrice(item.discount.amount, { code: order.currency, exchangeRate: order.exchangeRate })} OFF
                                                        </Chip>
                                                    </div>
                                                )}

                                            </div>
                                            <div className={styles.itemMeta}>
                                                <span className={styles.price}>
                                                    {formatPrice(item.price, { code: order.currency, exchangeRate: order.exchangeRate })}
                                                </span>
                                                <span className={styles.quantity}>Qty: {item.quantity}</span>
                                                <span className={styles.totalPrice}>
                                                    {formatPrice(item.price * item.quantity, { code: order.currency, exchangeRate: order.exchangeRate })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Addresses */}
                            <div className={styles.addressGrid}>
                                <div className={styles.addressCard}>
                                    <h2>Shipping Address</h2>
                                    <address>
                                        <strong>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</strong>
                                        {order.shippingAddress.address1}<br />
                                        {order.shippingAddress.address2 && <>{order.shippingAddress.address2}<br /></>}
                                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                                        {order.shippingAddress.country}<br />
                                        {order.shippingAddress.phone && <>Phone: {order.shippingAddress.phone}</>}
                                    </address>
                                    {order.trackingNumber && (
                                        <div className={styles.trackingInfo}>
                                            <h2>Tracking Information</h2>
                                            <div><strong>Courier:</strong> {order.courierName}</div>
                                            <div><strong>Tracking Number:</strong> {order.trackingNumber}</div>
                                            <div><strong>Tracking URL:</strong> <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">{order.trackingUrl}</a></div>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.addressCard}>
                                    <h2>Billing Address</h2>
                                    <address>
                                        <strong>{order.billingAddress.firstName} {order.billingAddress.lastName}</strong>
                                        {order.billingAddress.address1}<br />
                                        {order.billingAddress.address2 && <>{order.billingAddress.address2}<br /></>}
                                        {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}<br />
                                        {order.billingAddress.country}
                                    </address>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Column */}
                        <div className={styles.sidebar}>
                            <section className={`${styles.section} ${styles.card}`}>
                                <h2>Order Summary</h2>
                                <div className={styles.summaryRows}>
                                    <div className={styles.row}>
                                        <span>Subtotal</span>
                                        <span>{formatPrice(order.subtotal, { code: order.currency, exchangeRate: order.exchangeRate })}</span>
                                    </div>
                                    <div className={styles.row}>
                                        <span>Shipping</span>
                                        <span>{formatPrice(order.shippingCost, { code: order.currency, exchangeRate: order.exchangeRate })}</span>
                                    </div>
                                    <div className={styles.row}>
                                        <span>Tax</span>
                                        <span>{formatPrice(order.tax, { code: order.currency, exchangeRate: order.exchangeRate })}</span>
                                    </div>
                                    {order.taxBreakdown?.map((t, i) => (
                                        <div key={i} className={`${styles.row} ${styles.subTx}`}>
                                            <span>{t.name} ({t.rate}%)</span>
                                            <span>{formatPrice(t.amount, { code: order.currency, exchangeRate: order.exchangeRate })}</span>
                                        </div>
                                    ))}
                                    {order.discount > 0 && (
                                        <div className={`${styles.row} ${styles.discount}`}>
                                            <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                                            <span>-{formatPrice(order.discount, { code: order.currency, exchangeRate: order.exchangeRate })}</span>
                                        </div>
                                    )}
                                    <div className={`${styles.row} ${styles.total}`}>
                                        <span>Total</span>
                                        <span>{formatPrice(order.total, { code: order.currency, exchangeRate: order.exchangeRate })}</span>
                                    </div>
                                </div>

                                <div className={styles.paymentInfo}>
                                    <p>
                                        <strong>Payment Method:</strong>
                                        <span>{order.paymentMethod.toUpperCase()}</span>
                                    </p>
                                    <p>
                                        <strong>Status:</strong>
                                        <span className={`${styles.statusLabel} ${styles[order.paymentStatus]}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </p>
                                </div>
                            </section>

                            {order.customerNote && (
                                <section className={styles.note}>
                                    <p>“{order.customerNote}”</p>
                                </section>
                            )}

                            <div className={styles.help}>
                                <p>Need help with this order? <Link href="/contact">Contact Support</Link></p>
                            </div>

                            {isAuthenticated && (
                                <div className={styles.backLink}>
                                    <Link href="/account/orders">
                                        <span>←</span> Back to My Orders
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {order.refundStatus && order.refundStatus !== 'none' && (
                        <div className={`${styles.refundStatusBanner} ${styles[order.refundStatus]}`}>
                            <div className={styles.statusLabel}>
                                Refund Status: <strong>{order.refundStatus.replace('_', ' ')}</strong>
                            </div>
                            {order.refundStatus === 'requested' && (
                                <p>Your refund request is currently being reviewed by our team.</p>
                            )}
                            {order.refundStatus === 'rejected' && (
                                <div className={styles.rejectedMessage}>
                                    <p>Your refund request was declined.</p>
                                    {order.adminNote && (
                                        <div className={styles.adminNote}>
                                            <strong>Reason from Store:</strong> {order.adminNote}
                                        </div>
                                    )}
                                </div>
                            )}
                            {order.refundStatus === 'approved' && (
                                <p>Your refund request has been approved and is being processed.</p>
                            )}
                        </div>
                    )}
                </div>

                {(showReturnModal && !order.isPOSOrder) && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <h2>Request Return</h2>
                            <label>Reason for Return</label>
                            <textarea
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                placeholder="Please describe why you want to return this item..."
                            />
                            <div className={styles.modalActions}>
                                <button
                                    className={styles.btnSecondary}
                                    onClick={() => setShowReturnModal(false)}
                                    disabled={requestingReturn}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleRequestReturn}
                                    disabled={requestingReturn}
                                >
                                    {requestingReturn ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {(showRefundModal && !order.isPOSOrder) && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <h2>Request Refund</h2>
                            <label>Reason for Refund</label>
                            <textarea
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Please explain why you are requesting a refund..."
                            />
                            <div className={styles.modalActions}>
                                <button
                                    className={styles.btnSecondary}
                                    onClick={() => setShowRefundModal(false)}
                                    disabled={requestingRefund}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleRequestRefund}
                                    disabled={requestingRefund}
                                >
                                    {requestingRefund ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
