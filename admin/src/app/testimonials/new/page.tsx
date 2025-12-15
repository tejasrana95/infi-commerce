'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/molecules';
import TestimonialForm from '@/components/organisms/TestimonialForm';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';

export default function NewTestimonialPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.post('/testimonials', data);
            showNotification('Testimonial created successfully', 'success');
            router.push('/testimonials');
        } catch (error: any) {
            console.error('Error creating testimonial:', error);
            showNotification(error.response?.data?.message || 'Failed to create testimonial', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <PageHeader
                title="Add Testimonial"
                subtitle="Create a new customer testimonial"
                backHref="/testimonials"
            />
            <TestimonialForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </Box>
    );
}
