'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import api from '@/lib/api';
import { Category } from '@/types';
import { PageHeader, DataTable, EmptyState } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data.categories || response.data);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  if (categories.length === 0) {
    return (
      <Box>
        <PageHeader title="Categories" subtitle="Manage product categories" />
        <EmptyState
          message="No categories found. Create your first category!"
          actionLabel="Add Category"
          actionHref="/categories/new"
        />
      </Box>
    );
  }

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'slug', label: 'Slug' },
    {
      id: 'description',
      label: 'Description',
      render: (row: Category) => row.description || '-',
    },
    {
      id: 'isActive',
      label: 'Status',
      render: (row: Category) => <StatusChip active={row.isActive} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Categories"
        subtitle="Manage product categories"
        actionLabel="Add Category"
        actionHref="/categories/new"
      />
      <DataTable
        columns={columns}
        data={categories}
        editPath="/categories"
        onDelete={handleDelete}
      />
    </Box>
  );
}
