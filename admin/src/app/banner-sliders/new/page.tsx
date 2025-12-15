'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/molecules';
import BannerSliderForm from '@/components/organisms/BannerSliderForm';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';

export default function NewBannerSliderPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.post('/banner-sliders', data);
            showNotification('Banner slider created successfully', 'success');
            router.push('/banner-sliders');
        } catch (error: any) {
            console.error('Error creating slider:', error);
            showNotification(error.response?.data?.message || 'Failed to create slider', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <PageHeader
                title="Create Banner Slider"
                subtitle="Create a rotating banner carousel"
                backUrl="/banner-sliders"
            />
            <BannerSliderForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </Box>
    );
}
