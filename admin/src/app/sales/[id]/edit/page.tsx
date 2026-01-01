'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import SaleForm from '@/components/organisms/SaleForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditSalePage() {
    const router = useRouter();
    const params = useParams();
    const { showNotification } = useNotification();
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchSale();
    }, []);

    const fetchSale = async () => {
        try {
            const response = await api.get(`/sales/${params.id}`);
            setSale(response.data.sale || response.data.data);
        } catch (err) {
            showNotification('Failed to load sale', 'error');
            router.push('/sales');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.put(`/sales/${params.id}`, data);
            showNotification('Sale updated successfully', 'success');
            router.push('/sales');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update sale', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/sales');
    };

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mb: 2 }}
            >
                Back to Sales
            </Button>

            <PageHeader
                title={`Edit: ${sale?.name || 'Sale'}`}
                subtitle="Update sale configuration"
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
                <SaleForm
                    initialData={sale}
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
                    form="sale-form"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </Paper>
        </Box>
    );
}
