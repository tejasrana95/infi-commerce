'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { LoadingSpinner } from '@/components/atoms';
import AdminUserForm from '@/components/AdminUserForm';
import { useAuth } from '@/contexts/AuthContext';

export default function EditAdminPage() {
    const router = useRouter();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [adminData, setAdminData] = useState<any>(null);

    useEffect(() => {
        if (id) fetchAdmin();
    }, [id]);

    const fetchAdmin = async () => {
        try {
            const response = await api.get(`/admins/${id}`);
            const admin = response.data.data;
            setAdminData({
                email: admin.email || '',
                password: '',
                firstName: admin.firstName || '',
                lastName: admin.lastName || '',
                phone: admin.phone || '',
                role: admin.role || 'admin',
                storeId: admin.storeIds?.[0]?._id || admin.storeIds?.[0] || admin.storeId?._id || admin.storeId || '',
                isActive: admin.isActive ?? true,
                posPermissions: admin.posPermissions || {
                    canOverridePrice: false,
                    canApplyDiscount: false,
                },
            });
        } catch (err: any) {
            showNotification('Failed to load admin user', 'error');
            router.push('/admins');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (formData: any) => {
        setSaving(true);
        try {
            const updateData: any = { ...formData };
            if (!updateData.password) delete updateData.password;
            if (!updateData.storeId) delete updateData.storeId;

            await api.put(`/admins/${id}`, updateData);
            showNotification('Admin user updated successfully', 'success');
            router.push('/admins');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update admin', 'error');
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const isSuperAdmin = adminData?.role === 'super_admin' || user?.role === 'super_admin';

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <LoadingSpinner />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">
                    Edit Admin User
                </Typography>
            </Box>

            <AdminUserForm
                mode="edit"
                initialData={adminData}
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
                loading={saving}
                isSuperAdmin={isSuperAdmin}
            />
        </Box>
    );
}
