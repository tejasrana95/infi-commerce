'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import api from '@/lib/api';
import BlogPostForm from '@/components/organisms/BlogPostForm';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { BlogPost } from '@/types';

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPost();
    }, [params.id]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/blog/posts/${params.id}`);
            setPost(response.data.post);
        } catch (error: any) {
            console.error('Failed to load blog post', error);
            showNotification(error.response?.data?.message || 'Failed to load post', 'error');
            router.push('/blog/posts');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.put(`/blog/posts/${params.id}`, data);
            showNotification('Post updated successfully', 'success');
            router.push('/blog/posts');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to update post', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading post..." />;
    if (!post) return null;

    return (
        <Box>
            <PageHeader
                title={`Edit Post: ${post.title}`}
                subtitle="Update article content"
                backUrl="/blog/posts"
            />
            <Box sx={{ mt: 3, maxWidth: 1200 }}>
                <BlogPostForm initialData={post} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </Box>
        </Box>
    );
}
