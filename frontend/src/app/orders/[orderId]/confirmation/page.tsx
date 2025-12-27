'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/providers/ToastProvider';
import { useDialog } from '@/providers/DialogProvider';
import styles from './page.module.scss';
import { apiClient } from '@/services/api-client';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';

interface OrderDetails {
    _id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    items: Array<{
        name: string;
        sku: string;
        price: number;
        quantity: number;
        image?: string;
    }>;
    shippingAddress: {
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        phone: string;
    };
    subtotal: number;
    shippingCost: number;
    tax: number;
    taxBreakdown?: Array<{
        name: string;
        rate: number;
        amount: number;
    }>;
    discount: number;
    couponCode?: string;
    total: number;
    currency: string;
    customerNote?: string;
    createdAt: string;
    guestEmail?: string;
}

export default function OrderConfirmationPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const toast = useToast();
    const { showConfirm } = useDialog();
    const currency = useCurrency();
    const orderId = params.orderId as string;

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<OrderDetails | null>(null);

    useEffect(() => {
        if (orderId) {
            loadOrderDetails();
        }
    }, [orderId]);

    const loadOrderDetails = async () => {
        try {
            setLoading(true);
            const guestEmail = searchParams.get('guestEmail');
            const query = guestEmail ? `?guestEmail=${encodeURIComponent(guestEmail)}` : '';
            const response = await apiClient.get(`/orders/${orderId}${query}`);
            setOrder(response.data);
        } catch (error: any) {
            console.error('Failed to load order:', error);
            toast.error('Failed to load order details');
            // Redirect to home after 3 seconds
            setTimeout(() => router.push('/'), 3000);
        } finally {
            setLoading(false);
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

        if (!confirmed) {
            return;
        }

        try {
            const guestEmail = searchParams.get('guestEmail');
            const query = guestEmail ? `?guestEmail=${encodeURIComponent(guestEmail)}` : '';
            await apiClient.put(`/orders/${orderId}/cancel${query}`);
            toast.success('Order cancelled successfully');
            loadOrderDetails(); // Reload to show updated status
        } catch (error: any) {
            console.error('Failed to cancel order:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        }
    };

    const handlePayNow = () => {
        const guestEmail = searchParams.get('guestEmail');
        const query = guestEmail ? `?guestEmail=${encodeURIComponent(guestEmail)}` : '';
        router.push(`/orders/${orderId}/payment${query}`);
    };

    const handleDownloadInvoice = async () => {
        try {
            const guestEmail = searchParams.get('guestEmail');
            const query = guestEmail ? `?guestEmail=${encodeURIComponent(guestEmail)}` : '';

            // Use getBlob which handles binary response correctly
            const blob = await apiClient.getBlob(`orders/${orderId}/invoice${query}`);

            // Create blob link to download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${order?.orderNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Invoice downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download invoice');
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading order details...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={styles.error}>
                <h2>Order Not Found</h2>
                <p>We couldn't find the order you're looking for.</p>
                <button onClick={() => router.push('/')}>Return to Home</button>
            </div>
        );
    }

    return (
        <div className={styles.confirmationPage}>
            <div className={styles.container}>
                {/* Success Header */}
                <div className={styles.successHeader}>
                    <div className={styles.checkmark}>
                        <svg viewBox="0 0 52 52">
                            <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
                            <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                        </svg>
                    </div>
                    <h1>Order Confirmed!</h1>
                    <p className={styles.orderNumber}>Order #{order.orderNumber}</p>
                    <p className={styles.thankYou}>
                        Thank you for your order. We've sent a confirmation email to{' '}
                        <strong>{order.guestEmail || 'your email'}</strong>
                    </p>
                </div>

                <div className={styles.contentGrid}>
                    {/* Order Details */}
                    <div className={styles.mainContent}>
                        {/* Order Items */}
                        <div className={styles.section}>
                            <h2>Order Items</h2>
                            <div className={styles.itemsList}>
                                {order.items.map((item, index) => (
                                    <div key={index} className={styles.orderItem}>
                                        {item.image && (
                                            <div className={styles.itemImage}>
                                                <img src={item.image} alt={item.name} />
                                            </div>
                                        )}
                                        <div className={styles.itemDetails}>
                                            <h3>{item.name}</h3>
                                            <p className={styles.sku}>SKU: {item.sku}</p>
                                            <p className={styles.quantity}>Quantity: {item.quantity}</p>
                                        </div>
                                        <div className={styles.itemPrice}>
                                            {formatPrice(item.price * item.quantity, currency)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className={styles.section}>
                            <h2>Shipping Address</h2>
                            <div className={styles.address}>
                                <p><strong>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</strong></p>
                                <p>{order.shippingAddress.address1}</p>
                                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                                <p>{order.shippingAddress.country}</p>
                                <p>Phone: {order.shippingAddress.phone}</p>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className={styles.section}>
                            <h2>Payment Method</h2>
                            <div className={styles.paymentInfo}>
                                <p className={styles.paymentMethod}>
                                    {order.paymentMethod.toUpperCase()}
                                </p>
                                <p className={`${styles.paymentStatus} ${styles[order.paymentStatus]}`}>
                                    Status: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                </p>
                            </div>
                        </div>

                        {order.customerNote && (
                            <div className={styles.section}>
                                <h2>Order Notes</h2>
                                <p className={styles.note}>{order.customerNote}</p>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className={styles.sidebar}>
                        <div className={styles.orderSummary}>
                            <h2>Order Summary</h2>

                            <div className={styles.summaryItems}>
                                <div className={styles.summaryRow}>
                                    <span>Subtotal</span>
                                    <span>{formatPrice(order.subtotal, currency)}</span>
                                </div>

                                {order.shippingCost > 0 && (
                                    <div className={styles.summaryRow}>
                                        <span>Shipping</span>
                                        <span>{formatPrice(order.shippingCost, currency)}</span>
                                    </div>
                                )}

                                <div className={styles.summaryRow}>
                                    <span>Tax</span>
                                    <span>{formatPrice(order.tax, currency)}</span>
                                </div>

                                {order.taxBreakdown && order.taxBreakdown.length > 0 && (
                                    <div className={styles.taxBreakdown}>
                                        {order.taxBreakdown.map((tax, index) => (
                                            <div key={index} className={styles.taxRow}>
                                                <span>{tax.name} ({tax.rate}%)</span>
                                                <span>{formatPrice(tax.amount, currency)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {order.discount > 0 && (
                                    <div className={`${styles.summaryRow} ${styles.discount}`}>
                                        <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                                        <span>-{formatPrice(order.discount, currency)}</span>
                                    </div>
                                )}

                                <div className={`${styles.summaryRow} ${styles.total}`}>
                                    <strong>Total</strong>
                                    <strong>{formatPrice(order.total, currency)}</strong>
                                </div>
                            </div>

                            <div className={styles.orderInfo}>
                                <p><strong>Order Date:</strong></p>
                                <p>{new Date(order.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                            </div>

                            <div className={styles.actions}>
                                {/* Pay Now button - only show if payment is pending */}
                                {order.paymentStatus === 'pending' && (
                                    <button
                                        className={styles.btnPrimary}
                                        onClick={handlePayNow}
                                    >
                                        Pay Now
                                    </button>
                                )}

                                {/* Cancel Order button - only show if order is not shipped or completed */}
                                {!['shipped', 'delivered', 'completed', 'cancelled'].includes(order.status) && (
                                    <button
                                        className={styles.btnDanger}
                                        onClick={handleCancelOrder}
                                    >
                                        Cancel Order
                                    </button>
                                )}

                                <button
                                    className={styles.btnPrimary}
                                    onClick={() => router.push('/')}
                                >
                                    Continue Shopping
                                </button>
                                <button
                                    className={styles.btnSecondary}
                                    onClick={handleDownloadInvoice}
                                >
                                    Download Invoice
                                </button>
                            </div>
                        </div>

                        {/* What's Next */}
                        <div className={styles.nextSteps}>
                            <h3>What's Next?</h3>
                            <ul>
                                <li>
                                    <span className={styles.stepIcon}>📧</span>
                                    <span>You'll receive an email confirmation shortly</span>
                                </li>
                                <li>
                                    <span className={styles.stepIcon}>📦</span>
                                    <span>We'll notify you when your order ships</span>
                                </li>
                                <li>
                                    <span className={styles.stepIcon}>🚚</span>
                                    <span>Track your order status in your account</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
