'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Paper, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import CategoryForm from '@/components/organisms/CategoryForm';
import { useNotification } from '@/contexts/NotificationContext';

export default function NewCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Clean up empty optional fields
      const cleanedData = {
        ...data,
        parentCategory: data.parentCategory || undefined,
        image: data.image || undefined,
        seo: {
          ...data.seo,
          ogImage: data.seo?.ogImage || undefined,
        },
      };

      await api.post('/categories', cleanedData);
      showNotification('Category created successfully', 'success');
      router.push('/categories');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to create category', 'error');
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
            Add New Category
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a new product category
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <CategoryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

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
            form="category-form"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Category'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
