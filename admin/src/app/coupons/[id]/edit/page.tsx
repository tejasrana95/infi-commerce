'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import CouponForm from '@/components/organisms/CouponForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditCouponPage() {
    const router = useRouter();
    const params = useParams();
    const { showNotification } = useNotification();
    const [coupon, setCoupon] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCoupon();
    }, []);

    const fetchCoupon = async () => {
        try {
            const response = await api.get(`/coupons/${params.id}`);
            setCoupon(response.data.data);
        } catch (err) {
            showNotification('Failed to load coupon', 'error');
            router.push('/coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.put(`/coupons/${params.id}`, data);
            showNotification('Coupon updated successfully', 'success');
            router.push('/coupons');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update coupon', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/coupons');
    };

    if (loading) return <LoadingSpinner message="Loading coupon..." />;

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
                title={`Edit: ${coupon?.code || 'Coupon'}`}
                subtitle="Update coupon settings"
            />

            <CouponForm
                initialData={coupon}
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
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </Paper>
        </Box>
    );
}
