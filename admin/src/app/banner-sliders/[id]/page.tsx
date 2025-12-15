'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import BannerSliderForm from '@/components/organisms/BannerSliderForm';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';
import { BannerSlider } from '@/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditBannerSliderPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { showNotification } = useNotification();
    const [slider, setSlider] = useState<BannerSlider | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchSlider = async () => {
            try {
                const response = await api.get(`/banner-sliders/${id}`);
                setSlider(response.data.slider);
            } catch (error) {
                console.error('Error fetching slider:', error);
                showNotification('Failed to load banner slider', 'error');
                router.push('/banner-sliders');
            } finally {
                setLoading(false);
            }
        };
        fetchSlider();
    }, [id, router, showNotification]);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.put(`/banner-sliders/${id}`, data);
            showNotification('Banner slider updated successfully', 'success');
            router.push('/banner-sliders');
        } catch (error: any) {
            console.error('Error updating slider:', error);
            showNotification(error.response?.data?.message || 'Failed to update slider', 'error');
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
                title="Edit Banner Slider"
                subtitle={slider?.name || 'Update slider details'}
                backUrl="/banner-sliders"
            />
            {slider && (
                <BannerSliderForm
                    initialData={slider}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            )}
        </Box>
    );
}
