'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import ProductForm from '@/components/organisms/ProductForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { showNotification } = useNotification();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await api.get(`/products/${id}`);
            setProduct(response.data.product || response.data);
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to load product', 'error');
            router.push('/products');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any, stay: boolean = false) => {
        setIsSubmitting(true);
        try {
            // Clean up data before sending
            const cleanedData = {
                ...data,
                categoryIds: data.categoryIds || [],
                tags: data.tags || [],
                images: data.images || [],
                seo: {
                    ...data.seo,
                    ogImage: data.seo?.ogImage || undefined,
                },
            };

            await api.put(`/products/${id}`, cleanedData);
            showNotification('Product updated successfully', 'success');
            if (!stay) {
                router.push('/products');
            }
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update product', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/products');
    };

    if (loading) {
        return <LoadingSpinner message="Loading product..." />;
    }

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Products
            </Button>

            <PageHeader
                title="Edit Product"
                subtitle={`Update ${product?.name || 'product'}`}
            />

            <ProductForm
                initialData={product}
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
                    form="product-form"
                >
                    {isSubmitting ? 'Updating...' : 'Update Product'}
                </Button>
            </Paper>
        </Box>
    );
}
