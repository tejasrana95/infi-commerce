'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import AttributeForm from '@/components/organisms/AttributeForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditAttributePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { showNotification } = useNotification();
    const [attribute, setAttribute] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchAttribute();
        }
    }, [id]);

    const fetchAttribute = async () => {
        try {
            const response = await api.get(`/attributes/${id}`);
            setAttribute(response.data.attribute || response.data);
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to load attribute', 'error');
            router.push('/attributes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.put(`/attributes/${id}`, data);
            showNotification('Attribute updated successfully', 'success');
            router.push('/attributes');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update attribute', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/attributes');
    };

    if (loading) {
        return <LoadingSpinner message="Loading attribute..." />;
    }

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Attributes
            </Button>

            <PageHeader
                title="Edit Attribute"
                subtitle={`Update ${attribute?.name || 'attribute'}`}
            />

            <AttributeForm
                initialData={attribute}
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
                    form="attribute-form"
                >
                    {isSubmitting ? 'Updating...' : 'Update Attribute'}
                </Button>
            </Paper>
        </Box>
    );
}
