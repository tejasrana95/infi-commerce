'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import api from '@/lib/api';
import BlogCategoryForm from '@/components/organisms/BlogCategoryForm';
import { PageHeader } from '@/components/molecules';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewBlogCategoryPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.post('/blog/categories', data);
            showNotification('Blog category created successfully', 'success');
            router.push('/blog/categories');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to create category', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <PageHeader
                title="Create Blog Category"
                subtitle="Add a new category to your blog"
                backUrl="/blog/categories"
            />
            <Box sx={{ mt: 3, maxWidth: 1000 }}>
                <BlogCategoryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </Box>
        </Box>
    );
}
