'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/molecules';
import HeroBannerForm from '@/components/organisms/HeroBannerForm';
import heroBannerService from '@/services/heroBanner.service';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewHeroBannerPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            const response = await heroBannerService.create(data);
            if (response.data.success) {
                showNotification('Hero Banner created successfully', 'success');
                router.push('/hero-banners');
            } else {
                showNotification('Failed to create Hero Banner', 'error');
            }
        } catch (error) {
            console.error('Error creating hero banner:', error);
            showNotification('An error occurred while creating the banner', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <PageHeader
                title="New Hero Banner"
                subtitle="Add a new hero banner for your storefront"
                backUrl="/hero-banners"
            />
            <HeroBannerForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </Box>
    );
}
