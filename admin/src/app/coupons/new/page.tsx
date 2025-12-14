'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import CouponForm from '@/components/organisms/CouponForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewCouponPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/coupons', data);
            showNotification('Coupon created successfully', 'success');
            router.push('/coupons');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to create coupon', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/coupons');
    };

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Coupons
            </Button>

            <PageHeader
                title="Create Coupon"
                subtitle="Set up a new discount code"
            />

            <CouponForm
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
                    form="coupon-form"
                >
                    {isSubmitting ? 'Creating...' : 'Create Coupon'}
                </Button>
            </Paper>
        </Box>
    );
}
