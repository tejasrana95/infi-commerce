'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import BlogCategoryForm from '@/components/organisms/BlogCategoryForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewBlogCategoryPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/blog/categories', data);
            showNotification('Blog category created successfully', 'success');
            router.push('/blog/categories');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to create category', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/blog/categories');
    };

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
                title="Create Blog Category"
                subtitle="Add a new category to organize your blog posts"
            />

            <BlogCategoryForm
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
                    {isSubmitting ? 'Creating...' : 'Create Category'}
                </Button>
            </Paper>
        </Box>
    );
}
