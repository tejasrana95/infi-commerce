'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Button, Paper, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import CategoryForm from '@/components/organisms/CategoryForm';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { Category } from '@/types';

export default function EditCategoryPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchCategory();
    }, [id]);

    const fetchCategory = async () => {
        try {
            const response = await api.get(`/categories/${id}`);
            setCategory(response.data.category || response.data.data);
        } catch (err) {
            showNotification('Failed to load category', 'error');
            router.push('/categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            // Clean up empty optional fields
            const cleanedData = {
                ...data,
                parentCategory: data.parentCategory || undefined,
                image: data.image || undefined,
                seo: {
                    ...data.seo,
                    ogImage: data.seo?.ogImage || undefined,
                },
            };

            await api.put(`/categories/${id}`, cleanedData);
            showNotification('Category updated successfully', 'success');
            router.push('/categories');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update category', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading category..." />;

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.back()}
                    variant="outlined"
                >
                    Back
                </Button>
                <Box>
                    <Typography variant="h4" fontWeight={600}>
                        Edit Category
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Update category information
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ p: 3 }}>
                <CategoryForm
                    initialData={category || undefined}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />

                <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                    <Button
                        variant="outlined"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="category-form"
                        variant="contained"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Updating...' : 'Update Category'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
