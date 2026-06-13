'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/molecules';
import HeroBannerForm from '@/components/organisms/HeroBannerForm';
import heroBannerService from '@/services/heroBanner.service';
import { useNotification } from '@/contexts/NotificationContext';
import { HeroBanner } from '@/types/content';
import { LoadingSpinner } from '@/components/atoms';

export default function EditHeroBannerPage() {
    const router = useRouter();
    const { id } = useParams() as { id: string };
    const { showNotification } = useNotification();
    const [heroBanner, setHeroBanner] = useState<HeroBanner | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const response = await heroBannerService.getById(id);
                if (response.data.success && response.data.heroBanner) {
                    setHeroBanner(response.data.heroBanner);
                } else {
                    showNotification('Hero banner not found', 'error');
                    router.push('/hero-banners');
                }
            } catch (error) {
                console.error('Error fetching hero banner:', error);
                showNotification('Failed to load hero banner', 'error');
                router.push('/hero-banners');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBanner();
        }
    }, [id]);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            const response = await heroBannerService.update(id, data);
            if (response.data.success) {
                showNotification('Hero Banner updated successfully', 'success');
                router.push('/hero-banners');
            } else {
                showNotification('Failed to update Hero Banner', 'error');
            }
        } catch (error) {
            console.error('Error updating hero banner:', error);
            showNotification('An error occurred while updating the banner', 'error');
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
                title="Edit Hero Banner"
                subtitle={`Edit Hero Banner: ${heroBanner?.name}`}
                backUrl="/hero-banners"
            />
            <HeroBannerForm initialData={heroBanner} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </Box>
    );
}
