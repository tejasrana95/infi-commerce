'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import MenuForm from '@/components/organisms/MenuForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewMenuPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/menus', data);
            showNotification('Menu created successfully', 'success');
            router.push('/menus');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to create menu', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/menus');
    };

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
                title="Create Menu"
                subtitle="Add a new navigation menu"
            />

            <MenuForm
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
                    {isSubmitting ? 'Creating...' : 'Create Menu'}
                </Button>
            </Paper>
        </Box>
    );
}
