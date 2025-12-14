'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, IconButton, Typography, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import CustomerForm, { CustomerFormData } from '@/components/organisms/CustomerForm';

export default function NewCustomerPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: CustomerFormData) => {
        setIsSubmitting(true);
        try {
            await api.post('/customers', data);
            showNotification('Customer created successfully', 'success');
            router.push('/customers');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to create customer', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">Add Customer</Typography>
            </Box>

            <CustomerForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isNew
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
                    {isSubmitting ? 'Creating...' : 'Create Customer'}
                </Button>
            </Paper>
        </Box>
    );
}
