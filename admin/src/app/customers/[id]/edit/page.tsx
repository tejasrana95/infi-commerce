'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Button, IconButton, Typography, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { LoadingSpinner } from '@/components/atoms';
import CustomerForm, { CustomerFormData } from '@/components/organisms/CustomerForm';

export default function EditCustomerPage() {
    const router = useRouter();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialData, setInitialData] = useState<Partial<CustomerFormData> | null>(null);

    useEffect(() => {
        if (id) fetchCustomer();
    }, [id]);

    const fetchCustomer = async () => {
        try {
            const response = await api.get(`/customers/${id}`);
            const customer = response.data.data;
            setInitialData({
                email: customer.email || '',
                firstName: customer.firstName || '',
                lastName: customer.lastName || '',
                phone: customer.phone || '',
                isActive: customer.isActive ?? true,
                emailVerified: customer.emailVerified ?? false,
                addresses: customer.addresses || [],
            });
        } catch (err: any) {
            showNotification('Failed to load customer', 'error');
            router.push('/customers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: CustomerFormData) => {
        setIsSubmitting(true);
        try {
            const updateData: any = { ...data };
            if (!updateData.password) delete updateData.password;

            await api.put(`/customers/${id}`, updateData);
            showNotification('Customer updated successfully', 'success');
            router.push('/customers');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update customer', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading customer..." />;

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">Edit Customer</Typography>
            </Box>

            <CustomerForm
                initialData={initialData || undefined}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />

            <Paper sx={{ p: 2, mt: 3, display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="customer-form"
                    variant="contained"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </Paper>
        </Box>
    );
}
