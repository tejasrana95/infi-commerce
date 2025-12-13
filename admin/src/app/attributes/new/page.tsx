'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import AttributeForm from '@/components/organisms/AttributeForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewAttributePage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await api.post('/attributes', data);
      showNotification('Attribute created successfully', 'success');
      router.push('/attributes');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to create attribute', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/attributes');
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleCancel}
        sx={{ mb: 2 }}
      >
        Back to Attributes
      </Button>

      <PageHeader
        title="Add New Attribute"
        subtitle="Create a new product attribute"
      />

      <AttributeForm
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
          form="attribute-form"
        >
          {isSubmitting ? 'Creating...' : 'Create Attribute'}
        </Button>
      </Paper>
    </Box>
  );
}
