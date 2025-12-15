'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import TestimonialForm from '@/components/organisms/TestimonialForm';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';
import { Testimonial } from '@/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditTestimonialPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { showNotification } = useNotification();
    const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchTestimonial = async () => {
            try {
                const response = await api.get(`/testimonials/${id}`);
                setTestimonial(response.data.testimonial);
            } catch (error) {
                console.error('Error fetching testimonial:', error);
                showNotification('Failed to load testimonial', 'error');
                router.push('/testimonials');
            } finally {
                setLoading(false);
            }
        };
        fetchTestimonial();
    }, [id, router, showNotification]);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.put(`/testimonials/${id}`, data);
            showNotification('Testimonial updated successfully', 'success');
            router.push('/testimonials');
        } catch (error: any) {
            console.error('Error updating testimonial:', error);
            showNotification(error.response?.data?.message || 'Failed to update testimonial', 'error');
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
                title="Edit Testimonial"
                subtitle={testimonial?.customerName || 'Update testimonial details'}
                backUrl="/testimonials"
            />
            {testimonial && (
                <TestimonialForm
                    initialData={testimonial}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            )}
        </Box>
    );
}
