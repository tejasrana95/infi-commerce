'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import AdminUserForm from '@/components/AdminUserForm';

export default function NewAdminPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: any) => {
        setLoading(true);
        try {
            const submitData = { ...formData };
            if (!submitData.storeId) delete submitData.storeId;
            if (!submitData.password) delete submitData.password;

            await api.post('/admins', submitData);
            showNotification('Admin user created successfully', 'success');
            router.push('/admins');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to create admin', 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">
                    Add Admin User
                </Typography>
            </Box>

            <AdminUserForm
                mode="create"
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
                loading={loading}
            />
        </Box>
    );
}
