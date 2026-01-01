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
    const { showNotification } = useNotification();
    const [attribute, setAttribute] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAttribute();
    }, []);

    const fetchAttribute = async () => {
        try {
            const response = await api.get(`/attributes/${params.id}`);
            setAttribute(response.data.data || response.data.attribute);
        } catch (err) {
            showNotification('Failed to load specification', 'error');
            router.push('/attributes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.put(`/attributes/${params.id}`, data);
            showNotification('Specification updated successfully', 'success');
            router.push('/attributes');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update specification', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/attributes');
    };

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Specifications
            </Button>

            <PageHeader
                title={`Edit: ${attribute?.name || 'Specification'}`}
                subtitle="Update product specification"
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
                <AttributeForm
                    initialData={attribute}
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
                    form="attribute-form"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </Paper>
        </Box>
    );
}
