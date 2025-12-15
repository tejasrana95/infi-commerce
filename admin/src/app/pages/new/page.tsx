'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import PageForm from '@/components/organisms/PageForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewPagePage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/pages', data);
            showNotification('Page created successfully', 'success');
            router.push('/pages');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to create page', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/pages');
    };

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Pages
            </Button>

            <PageHeader
                title="Create Page"
                subtitle="Add a new static page to your store"
            />

            <PageForm
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
                    form="page-form"
                >
                    {isSubmitting ? 'Creating...' : 'Create Page'}
                </Button>
            </Paper>
        </Box>
    );
}
