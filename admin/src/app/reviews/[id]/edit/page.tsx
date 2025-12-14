'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import ReviewForm from '@/components/organisms/ReviewForm';
import { LoadingSpinner } from '@/components/atoms';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditReviewPage() {
    const { id } = useParams();
    const router = useRouter();
    const { showNotification } = useNotification();

    const [review, setReview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const response = await api.get(`/reviews/${id}`);
                setReview(response.data.review);
            } catch (error: any) {
                showNotification('Failed to fetch review', 'error');
                router.push('/reviews');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchReview();
        }
    }, [id, router, showNotification]);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.put(`/reviews/${id}`, data);
            showNotification('Review updated successfully', 'success');
            router.push('/reviews');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to update review', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!review) {
        return (
            <Box p={3}>
                <Typography>Review not found</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push('/reviews')}
                    >
                        Back
                    </Button>
                    <Typography variant="h5" fontWeight={600}>
                        Edit Review
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    type="submit"
                    form="review-form"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </Box>

            <ReviewForm
                initialData={review}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </Box>
    );
}
