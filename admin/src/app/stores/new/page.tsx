'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import StoreForm from '@/components/organisms/StoreForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewStorePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await api.post('/stores', data);
      showNotification('Store created successfully', 'success');
      router.push('/stores');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to create store', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          variant="outlined"
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Add New Store
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a new store for your platform
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <StoreForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

        <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="store-form"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Store'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
