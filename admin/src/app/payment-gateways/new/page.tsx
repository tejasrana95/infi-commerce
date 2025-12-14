'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import PaymentGatewayForm from '@/components/organisms/PaymentGatewayForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewPaymentGatewayPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/payment-gateways', data);
            showNotification('Payment gateway created successfully', 'success');
            router.push('/payment-gateways');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to create payment gateway', 'error');
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
                title="Add Payment Gateway"
                subtitle="Configure a new payment gateway for your store"
            />

            <PaymentGatewayForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />

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
                    {isSubmitting ? 'Creating...' : 'Create Gateway'}
                </Button>
            </Paper>
        </Box>
    );
}
