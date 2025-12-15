'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import BlogPostForm from '@/components/organisms/BlogPostForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewBlogPostPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/blog/posts', data);
            showNotification('Blog post created successfully', 'success');
            router.push('/blog/posts');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to create post', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/blog/posts');
    };

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Posts
            </Button>

            <PageHeader
                title="Create Blog Post"
                subtitle="Write a new article for your blog"
            />

            <BlogPostForm
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
                    form="blog-post-form"
                >
                    {isSubmitting ? 'Creating...' : 'Create Post'}
                </Button>
            </Paper>
        </Box>
    );
}
