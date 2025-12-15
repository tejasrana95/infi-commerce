'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import BlogCategoryForm from '@/components/organisms/BlogCategoryForm';
import { useNotification } from '@/contexts/NotificationContext';
import { BlogCategory } from '@/types';

export default function EditBlogCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { showNotification } = useNotification();
    const [category, setCategory] = useState<BlogCategory | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchCategory();
        }
    }, [id]);

    const fetchCategory = async () => {
        try {
            const response = await api.get(`/blog/categories/${id}`);
            setCategory(response.data.category || response.data);
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to load category', 'error');
            router.push('/blog/categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.put(`/blog/categories/${id}`, data);
            showNotification('Category updated successfully', 'success');
            router.push('/blog/categories');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to update category', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/blog/categories');
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
                title="Edit Blog Category"
                subtitle={`Update ${category?.name || 'category'}`}
            />

            <BlogCategoryForm
                initialData={category || undefined}
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
                    form="blog-category-form"
                >
                    {isSubmitting ? 'Updating...' : 'Update Category'}
                </Button>
            </Paper>
        </Box>
    );
}
