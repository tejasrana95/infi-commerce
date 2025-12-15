'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import BannerForm from '@/components/organisms/BannerForm';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';
import { Banner } from '@/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditBannerPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { showNotification } = useNotification();
    const [banner, setBanner] = useState<Banner | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const response = await api.get(`/banners/${id}`);
                setBanner(response.data.banner);
            } catch (error) {
                console.error('Error fetching banner:', error);
                showNotification('Failed to load banner', 'error');
                router.push('/banners');
            } finally {
                setLoading(false);
            }
        };
        fetchBanner();
    }, [id, router, showNotification]);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.put(`/banners/${id}`, data);
            showNotification('Banner updated successfully', 'success');
            router.push('/banners');
        } catch (error: any) {
            console.error('Error updating banner:', error);
            showNotification(error.response?.data?.message || 'Failed to update banner', 'error');
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
                title="Edit Banner"
                subtitle={banner?.name || 'Update banner details'}
                backHref="/banners"
            />
            {banner && (
                <BannerForm
                    initialData={banner}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            )}
        </Box>
    );
}
