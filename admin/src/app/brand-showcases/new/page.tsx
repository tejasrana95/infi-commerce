'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/molecules';
import BrandShowcaseForm from '@/components/organisms/BrandShowcaseForm';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';

export default function NewBrandShowcasePage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.post('/brand-showcases', data);
            showNotification('Brand showcase created successfully', 'success');
            router.push('/brand-showcases');
        } catch (error: any) {
            console.error('Error creating showcase:', error);
            showNotification(error.response?.data?.message || 'Failed to create showcase', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <PageHeader
                title="Create Brand Showcase"
                subtitle="Add a new brand logo collection"
                backUrl="/brand-showcases"
            />
            <BrandShowcaseForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </Box>
    );
}
