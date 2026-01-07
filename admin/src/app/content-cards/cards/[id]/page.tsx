'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import ContentCardForm from '@/components/organisms/ContentCardForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditContentCardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { showNotification } = useNotification();
    const [card, setCard] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id && id !== 'new') {
            fetchCard();
        } else {
            setLoading(false);
        }
    }, [id]);

    const fetchCard = async () => {
        try {
            const response = await api.get(`/content-cards/cards/${id}`);
            setCard(response.data.data || response.data);
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to load content card', 'error');
            router.push('/content-cards/cards');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (id === 'new') {
                await api.post('/content-cards/cards', data);
                showNotification('Content card created successfully', 'success');
            } else {
                await api.put(`/content-cards/cards/${id}`, data);
                showNotification('Content card updated successfully', 'success');
            }
            router.push('/content-cards/cards');
        } catch (error: any) {
            showNotification(error.response?.data?.message || `Failed to ${id === 'new' ? 'create' : 'update'} content card`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/content-cards/cards');
    };

    if (loading) {
        return <LoadingSpinner message="Loading content card..." />;
    }

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Content Cards
            </Button>

            <PageHeader
                title={id === 'new' ? 'Create Content Card' : 'Edit Content Card'}
                subtitle={id === 'new' ? 'Add a new content card' : `Update ${card?.title || 'content card'}`}
            />

            <ContentCardForm
                initialData={id === 'new' ? undefined : card || undefined}
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
                    form="content-card-form"
                >
                    {isSubmitting ? (id === 'new' ? 'Creating...' : 'Updating...') : (id === 'new' ? 'Create Content Card' : 'Update Content Card')}
                </Button>
            </Paper>
        </Box>
    );
}
