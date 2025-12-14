'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import ProductOptionForm from '@/components/organisms/ProductOptionForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewProductOptionPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/product-options', data);
            showNotification('Product option created successfully', 'success');
            router.push('/product-options');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to create product option', 'error');
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
                title="Add Product Option"
                subtitle="Create a new option for product variants (e.g., Color, Size, RAM)"
            />

            <ProductOptionForm
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
                    form="product-option-form"
                >
                    {isSubmitting ? 'Creating...' : 'Create Product Option'}
                </Button>
            </Paper>
        </Box>
    );
}
