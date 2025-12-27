'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/services/api-client';

export default function OrderPaymentPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { orderId } = params;
    const { isAuthenticated } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderId) {
            checkOrderStatus();
        }
    }, [orderId]);

    const checkOrderStatus = async () => {
        try {
            setLoading(true);
            const guestEmail = searchParams.get('guestEmail');
            const query = guestEmail ? `?guestEmail=${encodeURIComponent(guestEmail)}` : '';
            const response = await apiClient.get(`/orders/${orderId}${query}`);
            const order = response.data;

            if (order.paymentStatus === 'paid') {
                router.replace(`/orders/${orderId}/confirmation${query}`);
                return;
            }

            // Redirect to typical payment flow or show payment UI
            // For now, let's assume we redirect to confirmation as a placeholder
            // In a real app, this would initialize Stripe/Razorpay
            toast.info('Redirecting to payment gateway...');

            // Mock payment delay
            setTimeout(() => {
                router.replace(`/orders/${orderId}/confirmation`);
            }, 2000);

        } catch (error) {
            console.error('Error fetching order:', error);
            toast.error('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-800">Processing Payment...</h2>
                <p className="text-gray-600 mt-2">Please do not close this window.</p>
            </div>
        </div>
    );
}
