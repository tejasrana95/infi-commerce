'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import api from '@/lib/api';
import BlogCategoryForm from '@/components/organisms/BlogCategoryForm';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { BlogCategory } from '@/types';

export default function EditBlogCategoryPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [category, setCategory] = useState<BlogCategory | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCategory();
    }, [params.id]);

    const fetchCategory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/blog/categories/${params.id}`);
            setCategory(response.data.category);
        } catch (error: any) {
            console.error('Failed to load blog category', error);
            showNotification(error.response?.data?.message || 'Failed to load category', 'error');
            router.push('/blog/categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.put(`/blog/categories/${params.id}`, data);
            showNotification('Category updated successfully', 'success');
            router.push('/blog/categories');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to update category', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading category..." />;
    if (!category) return null;

    return (
        <Box>
            <PageHeader
                title={`Edit Category: ${category.name}`}
                subtitle="Manage blog category details"
                backUrl="/blog/categories"
            />
            <Box sx={{ mt: 3, maxWidth: 1000 }}>
                <BlogCategoryForm initialData={category} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </Box>
        </Box>
    );
}
