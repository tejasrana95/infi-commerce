'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import api from '@/lib/api';
import { Product } from '@/types';
import { PageHeader, DataTable, EmptyState } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data.data || response.data);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading products..." />;
  }

  if (products.length === 0) {
    return (
      <Box>
        <PageHeader title="Products" subtitle="Manage your product catalog" />
        <EmptyState
          message="No products found. Create your first product to get started!"
          actionLabel="Add Product"
          actionHref="/products/new"
        />
      </Box>
    );
  }

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'sku', label: 'SKU' },
    {
      id: 'price',
      label: 'Price',
      render: (row: Product) => `$${row.price.toFixed(2)}`,
    },
    {
      id: 'stock',
      label: 'Stock',
      render: (row: Product) => (
        <Box component="span" color={row.stock > 0 ? 'success.main' : 'error.main'}>
          {row.stock}
        </Box>
      ),
    },
    {
      id: 'isActive',
      label: 'Status',
      render: (row: Product) => <StatusChip active={row.isActive} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog"
        actionLabel="Add Product"
        actionHref="/products/new"
      />
      <DataTable
        columns={columns}
        data={products}
        editPath="/products"
        onDelete={handleDelete}
      />
    </Box>
  );
}
