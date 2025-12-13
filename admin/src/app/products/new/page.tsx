'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import ProductForm from '@/components/organisms/ProductForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewProductPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Clean up data before sending
      const cleanedData = {
        ...data,
        categoryIds: data.categoryIds || [],
        tags: data.tags || [],
        images: data.images || [],
        seo: {
          ...data.seo,
          ogImage: data.seo?.ogImage || undefined,
        },
      };

      await api.post('/products', cleanedData);
      showNotification('Product created successfully', 'success');
      router.push('/products');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to create product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/products');
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleCancel}
        sx={{ mb: 2 }}
      >
        Back to Products
      </Button>

      <PageHeader
        title="Add New Product"
        subtitle="Create a new product"
      />

      <ProductForm
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
          form="product-form"
        >
          {isSubmitting ? 'Creating...' : 'Create Product'}
        </Button>
      </Paper>
    </Box>
  );
}
