'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import SaleForm from '@/components/organisms/SaleForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewSalePage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await api.post('/sales', data);
      showNotification('Sale created successfully', 'success');
      router.push('/sales');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to create sale', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/sales');
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleCancel}
        sx={{ mb: 2 }}
      >
        Back to Sales
      </Button>

      <PageHeader
        title="Create Sale"
        subtitle="Set up a new discount campaign"
      />

      <SaleForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <Paper sx={{ p: 2, mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          form="sale-form"
        >
          {isSubmitting ? 'Creating...' : 'Create Sale'}
        </Button>
      </Paper>
    </Box>
  );
}
