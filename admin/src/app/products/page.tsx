'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import api from '@/lib/api';
import { Product } from '@/types';
import { PageHeader, DataTable, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('name-asc');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      const data = response.data.data || response.data;
      setProducts(data);
      setFilteredProducts(data);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Apply search, filter, and sort
  useEffect(() => {
    let result = [...products];

    // Search
    if (searchTerm) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status) {
      result = result.filter((p) =>
        filters.status === 'active' ? p.isActive : !p.isActive
      );
    }

    // Sort
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'stock-asc':
        result.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock-desc':
        result.sort((a, b) => b.stock - a.stock);
        break;
    }

    setFilteredProducts(result);
  }, [products, searchTerm, filters, sortBy]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  }, []);

  const handleExport = useCallback(() => {
    // TODO: Implement export functionality
    console.log('Exporting products...');
  }, []);

  const columns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Product Name',
        width: '30%',
      },
      {
        id: 'sku',
        label: 'SKU',
        width: '15%',
      },
      {
        id: 'price',
        label: 'Price',
        align: 'right' as const,
        width: '12%',
        render: (row: unknown) => {
          const product = row as Product;
          return `$${product.price.toFixed(2)}`;
        },
      },
      {
        id: 'stock',
        label: 'Stock',
        align: 'right' as const,
        width: '10%',
        render: (row: unknown) => {
          const product = row as Product;
          return (
            <Box
              component="span"
              sx={{
                color: product.stock > 0 ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {product.stock}
            </Box>
          );
        },
      },
      {
        id: 'isActive',
        label: 'Status',
        align: 'center' as const,
        width: '12%',
        render: (row: unknown) => {
          const product = row as Product;
          return <StatusChip active={product.isActive} />;
        },
      },
    ],
    []
  );

  if (loading) {
    return <LoadingSpinner message="Loading products..." fullHeight />;
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

  return (
    <Box>
      <PageHeader
        title="Products"
        subtitle={`${filteredProducts.length} of ${products.length} products`}
        actionLabel="Add Product"
        actionHref="/products/new"
      />

      <SearchFilterBar
        searchPlaceholder="Search products by name or SKU..."
        onSearchChange={setSearchTerm}
        filters={[
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
        ]}
        activeFilters={filters}
        onFilterChange={setFilters}
        sortOptions={[
          { value: 'name-asc', label: 'Name (A-Z)' },
          { value: 'name-desc', label: 'Name (Z-A)' },
          { value: 'price-asc', label: 'Price (Low-High)' },
          { value: 'price-desc', label: 'Price (High-Low)' },
          { value: 'stock-asc', label: 'Stock (Low-High)' },
          { value: 'stock-desc', label: 'Stock (High-Low)' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        showExport
        onExport={handleExport}
      />

      <DataTable
        columns={columns}
        data={filteredProducts}
        editPath="/products"
        onDelete={handleDelete}
        dense
      />
    </Box>
  );
}
