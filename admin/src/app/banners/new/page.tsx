'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/molecules';
import BannerForm from '@/components/organisms/BannerForm';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';

export default function NewBannerPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.post('/banners', data);
            showNotification('Banner created successfully', 'success');
            router.push('/banners');
        } catch (error: any) {
            console.error('Error creating banner:', error);
            showNotification(error.response?.data?.message || 'Failed to create banner', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <PageHeader
                title="Create Banner"
                subtitle="Add a new hero banner for your storefront"
                backHref="/banners"
            />
            <BannerForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </Box>
    );
}
