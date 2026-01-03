'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import MenuForm from '@/components/organisms/MenuForm';
import { useNotification } from '@/contexts/NotificationContext';
import { Menu } from '@/types';

export default function EditMenuPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { showNotification } = useNotification();
    const [menu, setMenu] = useState<Menu | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchMenu();
        }
    }, [id]);

    const fetchMenu = async () => {
        try {
            const response = await api.get(`/menus/${id}`);
            setMenu(response.data.menu || response.data);
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to load menu', 'error');
            router.push('/menus');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.put(`/menus/${id}`, data);
            showNotification('Menu updated successfully', 'success');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to update menu', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/menus');
    };

    if (loading) {
        return <LoadingSpinner message="Loading menu..." />;
    }

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Menus
            </Button>

            <PageHeader
                title="Edit Menu"
                subtitle={`Update ${menu?.name || 'menu'}`}
            />

            <MenuForm
                initialData={menu || undefined}
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
                    form="menu-form"
                >
                    {isSubmitting ? 'Updating...' : 'Update Menu'}
                </Button>
            </Paper>
        </Box>
    );
}
