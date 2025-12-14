'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import api from '@/lib/api';
import BlogPostForm from '@/components/organisms/BlogPostForm';
import { PageHeader } from '@/components/molecules';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewBlogPostPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.post('/blog/posts', data);
            showNotification('Blog post created successfully', 'success');
            router.push('/blog/posts');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to create post', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <PageHeader
                title="Create Blog Post"
                subtitle="Write a new article"
                backUrl="/blog/posts"
            />
            <Box sx={{ mt: 3, maxWidth: 1200 }}>
                <BlogPostForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </Box>
        </Box>
    );
}
