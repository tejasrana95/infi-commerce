'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import PageForm from '@/components/organisms/PageForm';
import { useNotification } from '@/contexts/NotificationContext';
import { Page } from '@/types';

export default function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { showNotification } = useNotification();
    const [page, setPage] = useState<Page | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchPage();
        }
    }, [id]);

    const fetchPage = async () => {
        try {
            const response = await api.get(`/pages/${id}`);
            setPage(response.data.page || response.data);
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to load page', 'error');
            router.push('/pages');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.put(`/pages/${id}`, data);
            showNotification('Page updated successfully', 'success');
            router.push('/pages');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to update page', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/pages');
    };

    if (loading) {
        return <LoadingSpinner message="Loading page..." />;
    }

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
                title="Edit Page"
                subtitle={`Update ${page?.title || 'page'}`}
            />

            <PageForm
                initialData={page || undefined}
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
                    {isSubmitting ? 'Updating...' : 'Update Page'}
                </Button>
            </Paper>
        </Box>
    );
}
