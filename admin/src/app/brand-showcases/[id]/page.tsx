'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import BrandShowcaseForm from '@/components/organisms/BrandShowcaseForm';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';
import { BrandShowcase } from '@/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditBrandShowcasePage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { showNotification } = useNotification();
    const [showcase, setShowcase] = useState<BrandShowcase | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchShowcase = async () => {
            try {
                const response = await api.get(`/brand-showcases/${id}`);
                setShowcase(response.data.showcase);
            } catch (error) {
                console.error('Error fetching showcase:', error);
                showNotification('Failed to load brand showcase', 'error');
                router.push('/brand-showcases');
            } finally {
                setLoading(false);
            }
        };
        fetchShowcase();
    }, [id, router, showNotification]);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.put(`/brand-showcases/${id}`, data);
            showNotification('Brand showcase updated successfully', 'success');
            router.push('/brand-showcases');
        } catch (error: any) {
            console.error('Error updating showcase:', error);
            showNotification(error.response?.data?.message || 'Failed to update showcase', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Box>
            <PageHeader
                title="Edit Brand Showcase"
                subtitle={showcase?.name || 'Update showcase details'}
                backHref="/brand-showcases"
            />
            {showcase && (
                <BrandShowcaseForm
                    initialData={showcase}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            )}
        </Box>
    );
}
