'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import BlogPostForm from '@/components/organisms/BlogPostForm';
import { useNotification } from '@/contexts/NotificationContext';
import { BlogPost } from '@/types';

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { showNotification } = useNotification();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchPost();
        }
    }, [id]);

    const fetchPost = async () => {
        try {
            const response = await api.get(`/blog/posts/${id}`);
            setPost(response.data.post || response.data);
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to load post', 'error');
            router.push('/blog/posts');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.put(`/blog/posts/${id}`, data);
            showNotification('Post updated successfully', 'success');
            router.push('/blog/posts');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to update post', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/blog/posts');
    };

    if (loading) {
        return <LoadingSpinner message="Loading post..." />;
    }

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
                title="Edit Blog Post"
                subtitle={`Update ${post?.title || 'post'}`}
            />

            <BlogPostForm
                initialData={post || undefined}
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
                    {isSubmitting ? 'Updating...' : 'Update Post'}
                </Button>
            </Paper>
        </Box>
    );
}
