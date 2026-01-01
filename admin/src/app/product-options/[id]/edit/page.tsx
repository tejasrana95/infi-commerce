'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import ProductOptionForm from '@/components/organisms/ProductOptionForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditProductOptionPage() {
    const router = useRouter();
    const params = useParams();
    const { showNotification } = useNotification();
    const [productOption, setProductOption] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchProductOption();
    }, []);

    const fetchProductOption = async () => {
        try {
            const response = await api.get(`/product-options/${params.id}`);
            setProductOption(response.data.productOption || response.data.data);
        } catch (err) {
            showNotification('Failed to load product option', 'error');
            router.push('/product-options');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.put(`/product-options/${params.id}`, data);
            showNotification('Product option updated successfully', 'success');
            router.push('/product-options');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update product option', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/product-options');
    };

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Product Options
            </Button>

            <PageHeader
                title={`Edit: ${productOption?.name || 'Product Option'}`}
                subtitle="Update product variant option"
            />

            <Box sx={{ position: 'relative' }}>
                {loading && (
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: 1,
                    }}>
                        <LoadingSpinner />
                    </Box>
                )}
                <ProductOptionForm
                    initialData={productOption}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </Box>

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
                    form="product-option-form"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </Paper>
        </Box>
    );
}
