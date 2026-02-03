'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../pos-confirmation.module.scss';
import { ShoppingBag, X, XCircle } from 'lucide-react';

export default function POSPaymentCancelledPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleNewOrder = () => {
        router.push('/');
    };

    return (
        <div className={styles.confirmationPage}>
            <div className={styles.container}>
                <div className={styles.receiptCard}>
                    {/* Header */}
                    <div className={`${styles.header} ${styles.cancelled}`}>
                        <div className={styles.iconWrapper}>
                            <X className={`${styles.icon} ${styles.error}`} size={40} />
                        </div>
                        <h1 className={styles.title}>
                            Payment Failed
                        </h1>
                        <p className={styles.subtitle}>
                            Your payment was cancelled and no charges were made.
                        </p>
                    </div>

                    {/* Body */}
                    <div className={styles.receiptBody}>
                        <div className={styles.cancelledMessage}>
                            <h3>What happened?</h3>
                            <p>
                                You cancelled the payment process before it was completed. No payment has been processed
                                and no order has been created.
                            </p>

                            <p className={styles.emailNote}>
                                If you experienced any issues during checkout, please contact our Store Support/Manager for assistance.
                            </p>
                        </div>

                        <div className={styles.actions} style={{ marginTop: '2rem' }}>
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
