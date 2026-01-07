'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import ContentCardCategoryForm from '@/components/organisms/ContentCardCategoryForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditContentCardCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { showNotification } = useNotification();
    const [category, setCategory] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id && id !== 'new') {
            fetchCategory();
        } else {
            setLoading(false);
        }
    }, [id]);

    const fetchCategory = async () => {
        try {
            const response = await api.get(`/content-cards/categories/${id}`);
            setCategory(response.data.data || response.data);
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to load category', 'error');
            router.push('/content-cards/categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (id === 'new') {
                await api.post('/content-cards/categories', data);
                showNotification('Category created successfully', 'success');
            } else {
                await api.put(`/content-cards/categories/${id}`, data);
                showNotification('Category updated successfully', 'success');
            }
            router.push('/content-cards/categories');
        } catch (error: any) {
            showNotification(error.response?.data?.message || `Failed to ${id === 'new' ? 'create' : 'update'} category`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/content-cards/categories');
    };

    if (loading) {
        return <LoadingSpinner message="Loading category..." />;
    }

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Categories
            </Button>

            <PageHeader
                title={id === 'new' ? 'Create Content Card Category' : 'Edit Content Card Category'}
                subtitle={id === 'new' ? 'Add a new category' : `Update ${category?.name || 'category'}`}
            />

            <ContentCardCategoryForm
                initialData={id === 'new' ? undefined : category || undefined}
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
                    form="content-card-category-form"
                >
                    {isSubmitting ? (id === 'new' ? 'Creating...' : 'Updating...') : (id === 'new' ? 'Create Category' : 'Update Category')}
                </Button>
            </Paper>
        </Box>
    );
}
