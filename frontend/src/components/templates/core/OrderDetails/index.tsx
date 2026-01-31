'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Clock,
    Settings,
    Truck,
    CheckCircle,
    XCircle,
    DollarSign,
    RotateCcw,
    ArrowLeftRight,
    FileText,
    MapPin,
    Phone,
    Package,
    ChevronLeft
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import styles from './OrderDetails.module.scss';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/services/api-client';
import { useToast } from '@/providers/ToastProvider';
import { useDialog } from '@/providers/DialogProvider';
import Chip from '@/components/atoms/Chip';
import ReturnOrderModal from '@/components/core/modules/account/ReturnOrderModal';
import { useStore } from '@/providers/StoreProvider';
import Image from 'next/image';

// Types
export interface OrderItem {
    name: string;
    sku: string;
    hsnCode?: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    image?: string;
    attributes?: Record<string, string>;
    productId?: string;
    variantId?: string;
    discount?: {
        amount?: number;
        appliedAt?: string;
        discountType?: 'fixed' | 'percentage';
        discountedPrice?: number;
        originalPrice?: number;
    };
    returnWindowDays?: number;
    exchangeWindowDays?: number;
    isReturnable?: boolean;
    manualDiscount?: number;
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
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'return_requested' | 'exchange_requested' | 'returned';
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
    trackingUrl?: string;
    courierName?: string;
    guestEmail?: string;
    isPOSOrder?: boolean;
    returns?: {
        returnedAt: string;
        items: {
            productId: string;
            variantId?: string;
            quantity: number;
            reason?: string;
            refundAmount?: number;
        }[];
        totalRefundAmount?: number;
        status: string;
    }[];
    returnStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'pickup_scheduled' | 'picked_up' | 'received' | 'inspected' | 'refund_initiated' | 'refund_completed' | 'exchange_shipped' | 'completed' | 'cancelled';
    returnRequestId?: string | { _id: string;[key: string]: any };
}

interface OrderDetailsTemplateProps {
    order: OrderDetails;
    loading?: boolean;
    onRefresh?: () => Promise<void>;
}

// Status configuration
const STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; label: string }> = {
    pending: { icon: Clock, color: '#d97706', bg: '#fef3c7', label: 'Pending' },
    processing: { icon: Settings, color: '#2563eb', bg: '#dbeafe', label: 'Processing' },
    shipped: { icon: Truck, color: '#7c3aed', bg: '#ede9fe', label: 'Shipped' },
    delivered: { icon: CheckCircle, color: '#059669', bg: '#d1fae5', label: 'Delivered' },
    cancelled: { icon: XCircle, color: '#dc2626', bg: '#fee2e2', label: 'Cancelled' },
    refunded: { icon: DollarSign, color: '#4b5563', bg: '#f3f4f6', label: 'Refunded' },
    return_requested: { icon: RotateCcw, color: '#b45309', bg: '#fffbeb', label: 'Return Requested' },
    exchange_requested: { icon: ArrowLeftRight, color: '#ea580c', bg: '#fef3c7', label: 'Exchange Requested' },
    returned: { icon: RotateCcw, color: '#0369a1', bg: '#e0f2fe', label: 'Returned' },
};

const RETURN_STATUS_CONFIG: Record<string, { message: string; color: string }> = {
    pending: { message: 'Your request is being reviewed by our team.', color: '#d97706' },
    approved: { message: 'Your request has been approved. Follow pickup/shipping instructions.', color: '#059669' },
    rejected: { message: 'Your request was declined.', color: '#dc2626' },
    pickup_scheduled: { message: 'A pickup has been scheduled. Please be ready.', color: '#7c3aed' },
    picked_up: { message: 'Items have been picked up and are in transit.', color: '#7c3aed' },
    received: { message: 'We have received your items and are inspecting them.', color: '#2563eb' },
    inspected: { message: 'Inspection complete. Processing your refund/exchange.', color: '#2563eb' },
    refund_initiated: { message: 'Your refund has been initiated.', color: '#059669' },
    refund_completed: { message: 'Your refund has been processed successfully.', color: '#059669' },
    exchange_shipped: { message: 'Your exchange has been shipped!', color: '#059669' },
    completed: { message: 'Process completed successfully.', color: '#059669' },
    cancelled: { message: 'Request was cancelled.', color: '#6b7280' },
};

export default function OrderDetailsTemplate({ order, loading, onRefresh }: OrderDetailsTemplateProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const { showConfirm } = useDialog();
    const { store } = useStore();
    const { returnSettings } = store?.settings || {};
    // State
    const [downloading, setDownloading] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const { convertAndFormat } = useCurrency();
    // Helper functions
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const canRequestReturn = () => {
        if(!returnSettings?.enabled) return false;
        if (order.isPOSOrder) return false;
        if (order.status !== 'delivered') return false;
        if (order.returnStatus && !['none', 'rejected'].includes(order.returnStatus)) return false;
        return true;
    };

    const canCancelOrder = () => {
        if (order.isPOSOrder) return false;
        return ['pending', 'processing'].includes(order.status);
    };

    const hasTracking = () => !!(order.trackingNumber && order.trackingUrl);

    const hasActiveReturn = () => order.returnStatus && order.returnStatus !== 'none' && order.returnStatus !== 'rejected';

    const getStatusStep = () => {
        const steps = ['pending', 'processing', 'shipped', 'delivered'];
        return steps.indexOf(order.status);
    };

    // Actions
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
            addToast('error', 'Failed to download invoice');
        } finally {
            setDownloading(false);
        }
    };

    const handleCancelOrder = async () => {
        const confirmed = await showConfirm({
            title: 'Cancel Order',
            message: 'Are you sure you want to cancel this order? This action cannot be undone.',
            confirmText: 'Yes, Cancel Order',
            cancelText: 'No, Keep Order',
            type: 'warning',
            isDanger: true,
        });

        if (!confirmed) return;

        try {
            setCancellingOrder(true);
            await apiClient.post(`/orders/${order._id}/cancel`);
            addToast('success', 'Order cancelled successfully');
            onRefresh?.() || router.refresh();
        } catch (error) {
            addToast('error', 'Failed to cancel order');
        } finally {
            setCancellingOrder(false);
        }
    };

    const handleReturnSuccess = async () => {
        onRefresh?.() || router.refresh();
    };

    const getAttributeLabel = (key: string) => {
        if (/^[a-fA-F0-9]{24}$/.test(key)) return '';
        return `${key}: `;
    };

    // Loading state
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading order details...</p>
            </div>
        );
    }

    if (!order) return null;

    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const isTerminalStatus = ['cancelled', 'refunded', 'returned'].includes(order.status);
    const showTimeline = ['pending', 'processing', 'shipped', 'delivered'].includes(order.status);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.container}>
                {/* Back Link */}
                {isAuthenticated && (
                    <Link href="/account/orders" className={styles.backLink}>
                        <ChevronLeft size={18} /> Back to My Orders
                    </Link>
                )}

                {/* Header Card */}
                <div className={styles.headerCard}>
                    <div className={styles.headerMain}>
                        <div className={styles.orderInfo}>
                            <h1>Order #{order.orderNumber}</h1>
                            <p className={styles.orderDate}>Placed on {formatDate(order.createdAt)}</p>
                            <div className={styles.badges}>
                                {order.isPOSOrder && <Chip variant="info" size="small">POS Order</Chip>}
                            </div>
                        </div>
                        <div
                            className={styles.statusBadge}
                            style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                        >
                            <statusConfig.icon size={18} className={styles.statusIcon} />
                            <span>{statusConfig.label}</span>
                        </div>
                    </div>

                    {/* Timeline */}
                    {showTimeline && (
                        <div className={styles.timeline}>
                            {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, index) => {
                                const currentStep = getStatusStep();
                                const isCompleted = index <= currentStep;
                                const isActive = index === currentStep;
                                return (
                                    <div key={step} className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}>
                                        <div className={styles.stepIcon}>
                                            {index < currentStep ? '✓' : index + 1}
                                        </div>
                                        <span className={styles.stepLabel}>{step}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Terminal Status Message */}
                    {isTerminalStatus && (
                        <div className={styles.terminalMessage} style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
                            <statusConfig.icon size={20} className={styles.terminalIcon} />
                            <span>This order has been {order.status.replace('_', ' ')}.</span>
                        </div>
                    )}
                </div>

                {/* Alert Banners */}
                {hasActiveReturn() && (
                    <div className={styles.alertBanner} style={{ borderLeftColor: RETURN_STATUS_CONFIG[order.returnStatus!]?.color }}>
                        <div className={styles.alertHeader}>
                            {order.status === 'exchange_requested' ? <ArrowLeftRight size={18} className={styles.alertIcon} /> : <RotateCcw size={18} className={styles.alertIcon} />}
                            <span className={styles.alertTitle}>
                                {order.status === 'exchange_requested' ? 'Exchange' : 'Return'} Request: <strong>{order.returnStatus?.replace(/_/g, ' ')}</strong>
                            </span>
                        </div>
                        <p className={styles.alertMessage}>{RETURN_STATUS_CONFIG[order.returnStatus!]?.message}</p>
                        {order.returnRequestId && (
                            <Link
                                href={`/account/returns/${typeof order.returnRequestId === 'string' ? order.returnRequestId : order.returnRequestId._id}`}
                                className={styles.alertLink}
                            >
                                View Return Details →
                            </Link>
                        )}
                    </div>
                )}

                {order.refundStatus && order.refundStatus !== 'none' && (
                    <div className={styles.alertBanner} style={{ borderLeftColor: order.refundStatus === 'rejected' ? '#dc2626' : '#059669' }}>
                        <div className={styles.alertHeader}>
                            <DollarSign size={18} className={styles.alertIcon} />
                            <span className={styles.alertTitle}>
                                Refund Status: <strong>{order.refundStatus.replace(/_/g, ' ')}</strong>
                            </span>
                        </div>
                        {order.refundStatus === 'rejected' && order.adminNote && (
                            <p className={styles.alertMessage} style={{ color: '#dc2626' }}>Reason: {order.adminNote}</p>
                        )}
                    </div>
                )}

                <div className={styles.grid}>
                    {/* Main Column */}
                    <div className={styles.mainColumn}>
                        {/* Order Items */}
                        <div className={styles.card}>
                            <h2>Items ({order.items.length})</h2>
                            <div className={styles.itemsList}>
                                {order.items.map((item, index) => (
                                    <div key={index} className={styles.item}>
                                        <div className={styles.itemImage}>
                                            {item.image ? (
                                                <Image width={68} height={68} src={item.image} alt={item.name} />
                                            ) : (
                                                <div className={styles.placeholder}><Package size={28} /></div>
                                            )}
                                        </div>
                                        <div className={styles.itemDetails}>
                                            <h3>{item.name}</h3>
                                            <p className={styles.sku}>SKU: {item.sku}</p>
                                            {item.hsnCode && <p className={styles.sku}>HSN: {item.hsnCode}</p>}
                                            {item.attributes && Object.keys(item.attributes).length > 0 && (
                                                <div className={styles.attributes}>
                                                    {Object.entries(item.attributes).map(([key, value]) => (
                                                        <span key={key}>{getAttributeLabel(key)}{value}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {item?.discount?.amount && (
                                                <Chip variant="discount" size="small">
                                                    -{item.discount.discountType === 'percentage' ? item.discount.amount + '%' : convertAndFormat(item.discount.amount, order.currency, order.exchangeRate)} OFF
                                                </Chip>
                                            )}
                                            {item?.manualDiscount !== undefined && item.manualDiscount > 0 && (
                                                <Chip variant="discount" size="small">
                                                    Manual Discount: -{convertAndFormat(item.manualDiscount, order.currency, order.exchangeRate)}
                                                </Chip>
                                            )}
                                        </div>
                                        <div className={styles.itemMeta}>
                                            <span className={styles.quantity}>Qty: {item.quantity}</span>
                                            <span className={styles.price}>
                                                {item?.manualDiscount !== undefined && item.manualDiscount > 0 && (
                                                    <span className={styles.originalPrice}>
                                                        {convertAndFormat((item.originalPrice || 0) * item.quantity, order.currency, order.exchangeRate)}
                                                    </span>
                                                )}
                                                {convertAndFormat(item.price * item.quantity, order.currency, order.exchangeRate)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Addresses */}
                        <div className={styles.addressGrid}>
                            <div className={styles.addressCard}>
                                <h3>Shipping Address</h3>
                                <address>
                                    <strong>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</strong>
                                    <p>{order.shippingAddress.address1}</p>
                                    {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                                    <p>{order.shippingAddress.country}</p>
                                    {order.shippingAddress.phone && <p className="flex items-center gap-1"><Phone size={14} /> {order.shippingAddress.phone}</p>}
                                </address>
                            </div>
                            <div className={styles.addressCard}>
                                <h3>Billing Address</h3>
                                <address>
                                    <strong>{order.billingAddress.firstName} {order.billingAddress.lastName}</strong>
                                    <p>{order.billingAddress.address1}</p>
                                    {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                                    <p>{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}</p>
                                    <p>{order.billingAddress.country}</p>
                                </address>
                            </div>
                        </div>

                        {/* Tracking Info */}
                        {hasTracking() && order.status !== 'delivered' && (
                            <div className={styles.card}>
                                <h2>Tracking Information</h2>
                                <div className={styles.trackingDetails}>
                                    <div className={styles.trackingRow}>
                                        <span className={styles.trackingLabel}>Courier:</span>
                                        <span className={styles.trackingValue}>{order.courierName || 'N/A'}</span>
                                    </div>
                                    <div className={styles.trackingRow}>
                                        <span className={styles.trackingLabel}>Tracking Number:</span>
                                        <span className={styles.trackingValue}>{order.trackingNumber}</span>
                                    </div>
                                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className={styles.trackButton}>
                                        <MapPin size={18} /> Track Shipment
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className={styles.sidebar}>
                        {/* Quick Actions */}
                        <div className={styles.card}>
                            <h2>Quick Actions</h2>
                            <div className={styles.actionButtons}>
                                <button className={styles.actionBtn} onClick={handleDownloadInvoice} disabled={downloading}>
                                    <FileText size={18} /> {downloading ? 'Downloading...' : 'Download Invoice'}
                                </button>

                                {hasTracking() && order.status !== 'delivered' && (
                                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.primary}`}>
                                        <MapPin size={18} /> Track Order
                                    </a>
                                )}

                                {canRequestReturn() && (
                                    <button className={styles.actionBtn} onClick={() => setShowReturnModal(true)}>
                                        <RotateCcw size={18} /> {order.returnStatus === 'rejected' ? 'Re-request Return' : 'Request Return/Exchange'}
                                    </button>
                                )}

                                {canCancelOrder() && (
                                    <button className={`${styles.actionBtn} ${styles.danger}`} onClick={handleCancelOrder} disabled={cancellingOrder}>
                                        <XCircle size={18} /> {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className={styles.card}>
                            <h2>Order Summary</h2>
                            <div className={styles.summaryRows}>
                                <div className={styles.summaryRow}>
                                    <span>Subtotal</span>
                                    <span>{convertAndFormat(order.subtotal, order.currency, order.exchangeRate)}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Shipping</span>
                                    <span>{convertAndFormat(order.shippingCost, order.currency, order.exchangeRate)}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Tax</span>
                                    <span>{convertAndFormat(order.tax, order.currency, order.exchangeRate)}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className={`${styles.summaryRow} ${styles.discount}`}>
                                        <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                                        <span>-{convertAndFormat(order.discount, order.currency, order.exchangeRate)}</span>
                                    </div>
                                )}
                                <div className={`${styles.summaryRow} ${styles.total}`}>
                                    <span>Total</span>
                                    <span>{convertAndFormat(order.total, order.currency, order.exchangeRate)}</span>
                                </div>
                                {order.returns && order.returns.some(r => r.totalRefundAmount && r.totalRefundAmount > 0) && (
                                    <div className={`${styles.summaryRow} ${styles.refunded}`}>
                                        <span>Total Refunded</span>
                                        <span>
                                            {convertAndFormat(
                                                order.returns.reduce((acc, ret) => acc + (ret.totalRefundAmount || 0), 0),
                                                order.currency,
                                                order.exchangeRate
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.paymentInfo}>
                                <div className={styles.paymentRow}>
                                    <span>Payment Method:</span>
                                    <span>{order.paymentMethod.toUpperCase()}</span>
                                </div>
                                <div className={styles.paymentRow}>
                                    <span>Payment Status:</span>
                                    <Chip variant={order.paymentStatus === 'paid' ? 'success' : 'warning'} size="small">
                                        {order.paymentStatus.toUpperCase()}
                                    </Chip>
                                </div>
                            </div>
                        </div>

                        {/* Customer Note */}
                        {order.customerNote && (
                            <div className={styles.card}>
                                <h2>Your Note</h2>
                                <p className={styles.customerNote}>"{order.customerNote}"</p>
                            </div>
                        )}

                        {/* Help */}
                        <div className={styles.helpCard}>
                            <p>Need help with this order?</p>
                            <Link href="/contact" className={styles.helpLink}>Contact Support</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Return Modal */}
            <ReturnOrderModal
                isOpen={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                order={order}
                onSuccess={handleReturnSuccess}
            />
        </div>
    );
}
