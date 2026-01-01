'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import PaymentGatewayForm from '@/components/organisms/PaymentGatewayForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditPaymentGatewayPage() {
    const router = useRouter();
    const params = useParams();
    const { showNotification } = useNotification();
    const [gateway, setGateway] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchGateway();
    }, []);

    const fetchGateway = async () => {
        try {
            const response = await api.get(`/payment-gateways/${params.id}`);
            setGateway(response.data.data);
        } catch (err) {
            showNotification('Failed to load payment gateway', 'error');
            router.push('/payment-gateways');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.put(`/payment-gateways/${params.id}`, data);
            showNotification('Payment gateway updated successfully', 'success');
            router.push('/payment-gateways');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update payment gateway', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/payment-gateways');
    };

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Payment Gateways
            </Button>

            <PageHeader
                title={`Edit: ${gateway?.gatewayName || 'Payment Gateway'}`}
                subtitle="Update payment gateway configuration"
            />

            <Box sx={{ position: 'relative' }}>
                {loading && (
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: 1,
                    }}>
                        <LoadingSpinner />
                    </Box>
                )}
                <PaymentGatewayForm
                    initialData={gateway}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </Box>

            <Paper sx={{ p: 2, mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    form="payment-gateway-form"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </Paper>
        </Box>
    );
}
