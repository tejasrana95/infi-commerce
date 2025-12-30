'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/services/api-client';
import OrderDetailsTemplate, { OrderDetails } from '@/components/templates/order/OrderDetails';

export default function OrderPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const toast = useToast();

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const orderId = params.orderId as string;
    const guestEmail = searchParams.get('guestEmail');

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId, isAuthenticated]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const query = guestEmail ? `?guestEmail=${encodeURIComponent(guestEmail)}` : '';
            const response = await apiClient.get(`/orders/${orderId}${query}`);
            setOrder(response.data);
        } catch (error: any) {
            console.error('Error fetching order:', error);
            const message = error.response?.data?.message || 'Failed to load order';
            toast.error(message);

            // Redirect logic
            if (error.response?.status === 403 || error.response?.status === 401) {
                if (!isAuthenticated && !guestEmail) {
                    // Redirect to login if not authenticated and no guest email provided
                    router.push(`/auth/login?redirect=/orders/${orderId}`);
                } else {
                    router.push('/');
                }
            } else {
                router.push('/');
            }
        } finally {
            setLoading(false);
        }
    };

    return <OrderDetailsTemplate order={order as OrderDetails} loading={loading} onRefresh={fetchOrder} />;
}
