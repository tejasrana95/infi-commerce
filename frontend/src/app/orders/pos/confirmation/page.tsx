'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/providers/ToastProvider';
import { useInterest } from '@/providers/InterestProvider';
// Removed generic styles import
import styles from '../pos-confirmation.module.scss';
import { apiClient } from '@/services/api-client';
import { useCurrency } from '@/hooks/useCurrency';
import { Check, X, Download, ShoppingBag } from 'lucide-react';

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
    shippingAddress?: {
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
    discount: number;
    couponCode?: string;
    total: number;
    currency: string;
    exchangeRate: number;
    customerNote?: string;
    createdAt: string;
    guestEmail?: string;
    isPOSOrder?: boolean;
}

export default function POSOrderConfirmationPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const toast = useToast();
    const { trackPurchase } = useInterest();
    const { convertAndFormat } = useCurrency();

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const trackedRef = useRef(false);

    const customerEmail = searchParams.get('customer');
    const posSessionId = searchParams.get('posSessionId');
    const customerId = searchParams.get('customerId');

    useEffect(() => {
        loadOrderDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerEmail, posSessionId]);

    // Track purchase for personalized recommendations (only once per page load)
    useEffect(() => {
        if (order && order.paymentStatus === 'paid' && !trackedRef.current) {
            trackedRef.current = true;
            const products = order.items.map(item => {
                const itemAny = item as any;
                const productId = itemAny.productId?._id || itemAny.productId || itemAny._id || '';
                const categoryIds = itemAny.productId?.categoryIds || itemAny.categoryIds || [];

                return {
                    productId: typeof productId === 'string' ? productId : productId.toString(),
                    categoryIds: categoryIds.map((id: any) => typeof id === 'string' ? id : id.toString()),
                };
            }).filter(p => p.productId);

            if (products.length > 0) {
                trackPurchase(products);
            }
        }
    }, [order, trackPurchase]);

    const loadOrderDetails = async () => {
        try {
            setLoading(true);

            // If no customer email provided, show generic success message
            if (!customerEmail) {
                setOrder(null);
                setLoading(false);
                return;
            }

            // Fetch latest order matching customer email and posSessionId
            const query = new URLSearchParams();
            query.set('customerEmail', customerEmail);
            if (posSessionId) {
                query.set('posSessionId', posSessionId);
            }
            if (customerId) {
                query.set('customerId', customerId);
            }

            const response = await apiClient.get(`/orders/pos/latest?${query.toString()}`);
            setOrder(response.data);
        } catch (error: any) {
            setOrder(null);
        } finally {
           setLoading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        if (!order) return;

        try {
            const blob = await apiClient.getBlob(`orders/${order._id}/invoice`);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${order.orderNumber}.pdf`);
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

    const handleNewOrder = () => {
        router.push('/');
    };

    if (loading) {
        return (
            <div className={styles.confirmationPage}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Processing Transaction...</p>
                </div>
            </div>
        );
    }

    // Generic success message when no order data available
    if (!order) {
        return (
            <div className={styles.confirmationPage}>
                <div className={styles.container}>
                   
                      <div className={styles.receiptCard}>
                    {/* Header */}
                    <div className={`${styles.header}`}>
                        <div className={styles.iconWrapper}>
                             <Check className={styles.icon} size={40} />
                        </div>
                        <h1 className={styles.title}>
                          Payment Success
                        </h1>
                        <p className={styles.subtitle}>
                           Thank you for your purchase
                        </p>
                    </div>

                    {/* Body */}
                    <div className={styles.receiptBody}>
                        <div className={styles.actions} style={{ marginTop: '6rem' }}>
                            <button onClick={handleNewOrder} className={styles.btnPrimary}>
                                <ShoppingBag size={20} />
                                Start New Order
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        );
    }

    const isCancelled = order.status === 'cancelled' || order.paymentStatus === 'failed';

    return (
        <div className={styles.confirmationPage}>
            <div className={styles.container}>
                <div className={styles.receiptCard}>
                    {/* Header */}
                    <div className={`${styles.header} ${isCancelled ? styles.cancelled : ''}`}>
                        <div className={styles.iconWrapper}>
                            {isCancelled ? (
                                <X className={`${styles.icon} ${styles.error}`} size={40} />
                            ) : (
                                <Check className={styles.icon} size={40} />
                            )}
                        </div>
                        <h1 className={styles.title}>
                            {isCancelled ? 'Payment Failed' : 'Payment Success!'}
                        </h1>
                        <p className={styles.subtitle}>
                            {isCancelled ? 'Please try again' : 'Thank you for your purchase'}
                        </p>
                    </div>

                    {/* Body */}
                    <div className={styles.receiptBody}>
                        {/* Order Info Card */}
                        <div className={styles.orderInfoCard}>
                            <div className={styles.orderNumber}>Order #{order.orderNumber}</div>
                            <div className={styles.orderDate}>
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>

                        {/* Items List - styled like a receipt */}
                        <div className={styles.itemsList}>
                            {order.items.map((item, index) => (
                                <div key={index} className={styles.item}>
                                    <div className={styles.itemInfo}>
                                        <span className={styles.itemQty}>{item.quantity}</span>
                                        <span className={styles.itemName}>{item.name}</span>
                                    </div>
                                    <div className={styles.itemPrice}>
                                        {convertAndFormat(item.price * item.quantity, order.currency, order.exchangeRate)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className={styles.totals}>
                            <div className={styles.row}>
                                <span>Subtotal</span>
                                <span>{convertAndFormat(order.subtotal, order.currency, order.exchangeRate)}</span>
                            </div>

                            {order.tax > 0 && (
                                <div className={styles.row}>
                                    <span>Tax</span>
                                    <span>{convertAndFormat(order.tax, order.currency, order.exchangeRate)}</span>
                                </div>
                            )}

                            {order.discount > 0 && (
                                <div className={`${styles.row} ${styles.discount}`}>
                                    <span>Discount</span>
                                    <span>-{convertAndFormat(order.discount, order.currency, order.exchangeRate)}</span>
                                </div>
                            )}

                            <div className={`${styles.row} ${styles.total}`}>
                                <span>Total</span>
                                <span>{convertAndFormat(order.total, order.currency, order.exchangeRate)}</span>
                            </div>
                        </div>

                        <div className={styles.actions} style={{ marginTop: '2rem' }}>
                            <button onClick={handleNewOrder} className={styles.btnPrimary}>
                                <ShoppingBag size={20} />
                                Start New Order
                            </button>

                            <button onClick={handleDownloadInvoice} className={styles.btnSecondary}>
                                <Download size={18} />
                                Download Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
