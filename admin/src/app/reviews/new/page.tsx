'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import ReviewForm from '@/components/organisms/ReviewForm';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewReviewPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.post('/reviews', data);
            showNotification('Review created successfully', 'success');
            router.push('/reviews');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to create review', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        Add Review
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    type="submit"
                    form="review-form"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save Review'}
                </Button>
            </Box>

            <ReviewForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </Box>
    );
}
