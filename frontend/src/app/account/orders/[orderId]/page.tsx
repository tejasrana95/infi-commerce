'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/services/api-client';
import OrderDetailsTemplate, { OrderDetails } from '@/components/templates/order/OrderDetails';

export default function AccountOrderPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const toast = useToast();

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const orderId = params.orderId as string;

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]); // isAuthenticated check handled by higher level layout usually, or we can add it

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/orders/${orderId}`);
            setOrder(response.data);
        } catch (error: any) {
            console.error('Error fetching order:', error);
            const message = error.response?.data?.message || 'Failed to load order';
            toast.error(message);

            if (error.response?.status === 403 || error.response?.status === 401) {
                router.push('/auth/login');
            } else {
                router.push('/account/orders');
            }
        } finally {
            setLoading(false);
        }
    };

    return <OrderDetailsTemplate order={order as OrderDetails} loading={loading} />;
}
