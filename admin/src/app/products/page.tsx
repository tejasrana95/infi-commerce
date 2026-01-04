'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Avatar } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '@/lib/api';
import { Product } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip, PermissionGuard, SeoScoreBadge } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';

export default function ProductsPage() {
  const router = useRouter();
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStockStatus, setFilterStockStatus] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Debounced search query for API calls
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, filterStore, filterCategory, filterType, filterStockStatus, filterStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filterStore) params.append('storeId', filterStore);
      if (filterCategory) params.append('categoryId', filterCategory);
      if (filterType) params.append('type', filterType);
      if (filterStockStatus) params.append('stockStatus', filterStockStatus);
      if (filterStatus) {
        params.append('isActive', filterStatus === 'active' ? 'true' : 'false');
      } else {
        params.append('isActive', 'all');
      }

      const queryString = params.toString();
      const url = queryString ? `/products?${queryString}` : '/products';

      const response = await api.get(url);
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Failed to fetch products');
      showNotification('Failed to load products', 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Delete Product', message: 'Are you sure you want to delete this product?', severity: 'error' })) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      showNotification('Product deleted successfully', 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleClone = async (id: string) => {
    if (!await confirm({ title: 'Clone Product', message: 'Are you sure you want to clone this product?', confirmLabel: 'Clone', severity: 'info' })) return;
    try {
      await api.post(`/products/${id}/clone`);
      showNotification('Product cloned successfully', 'success');
      fetchProducts(); // Refresh list to show new clone
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to clone product', 'error');
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/products/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/products/new');
  };

  const handleStoreFilterChange = (value: string) => {
    setFilterStore(value);
    setFilterCategory(''); // Reset category when store changes
  };

  // Note: We no longer filter client-side since filtering is done server-side
  const filteredRows = products;

  const getStoreName = (storeId: any) => {
    if (typeof storeId === 'object' && storeId !== null) {
      return storeId.name;
    }
    return '-';
  };

  const getCategoryNames = (categoryIds: any[]) => {
    if (!categoryIds || categoryIds.length === 0) return '-';
    return categoryIds.map(cat => {
      if (typeof cat === 'object' && cat !== null) {
        return cat.title || cat.name;
      }
      return '';
    }).filter(Boolean).join(', ') || '-';
  };

  const getStockColor = (stock: number, lowThreshold: number = 5) => {
    if (stock === 0) return 'error';
    if (stock <= lowThreshold) return 'warning';
    return 'success';
  };

  const columns: GridColDef[] = [
    {
      field: 'image',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Avatar
            src={params.row.featuredImage || params.row.images?.[0]}
            alt={params.row.name}
            variant="rounded"
            sx={{ width: 50, height: 50 }}
          />
        </Box >
      ),
    },
    {
      field: 'name',
      headerName: 'Product',
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2" fontWeight={600}>{params.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">SKU: {params.row.sku}</Typography>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Chip
            label={params.value}
            size="small"
            color={params.value === 'variable' ? 'primary' : params.value === 'digital' ? 'secondary' : 'default'}
            variant="outlined"
          />
        </Box>
      ),
    },
    {
      field: 'storeId',
      headerName: 'Store',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
        </Box>
      ),
    },
    {
      field: 'categoryIds',
      headerName: 'Categories',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="caption" noWrap>{getCategoryNames(params.row.categoryIds)}</Typography>
        </Box>
      ),
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2" fontWeight={600}>
            {formatPrice(params.row.price)}
          </Typography>
          {params.row.salePrice && (
            <Typography variant="caption" color="error">
              Sale: {formatPrice(params.row.salePrice)}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'stock',
      headerName: 'Stock',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Chip
            label={params.row.stock}
            size="small"
            color={getStockColor(params.row.stock, params.row.lowStockThreshold)}
          />
        </Box>
      ),
    },
    {
      field: 'stockStatus',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const statusLabels: Record<string, string> = {
          in_stock: 'In Stock',
          out_of_stock: 'Out of Stock',
          on_backorder: 'Backorder',
          made_to_order: 'Made to Order',
        };
        return (
          <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
            <Typography variant="caption">
              {statusLabels[params.value as string] || params.value}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <StatusChip active={params.value as boolean} />
        </Box>
      ),
    },
    {
      field: 'seo',
      headerName: 'SEO Score',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <SeoScoreBadge score={params.row.seo?.score} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="row" justifyContent="center" height="100%">
          <Tooltip title="Clone">
            <IconButton onClick={() => handleClone(params.row._id)} size="small" color="info">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleEdit(params.row._id)} size="small" color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <PermissionGuard deniedRoles={['store_admin']}>
            <Tooltip title="Delete">
              <IconButton onClick={() => handleDelete(params.row._id)} size="small" color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </PermissionGuard>
        </Box>
      ),
    },
  ];

  if (!loading && products.length === 0 && !searchQuery && !filterStore && !filterCategory && !filterType && !filterStockStatus && !filterStatus) {
    return (
      <Box>
        <PageHeader title="Products" subtitle="Manage your products" />
        <EmptyState
          message="No products found. Create your first product!"
          actionLabel="Add Product"
          onAction={handleCreate}
        />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Products"
        subtitle="Manage your products"
        actionLabel="Add Product"
        onAction={handleCreate}
      />

      <SearchFilterBar
        searchPlaceholder="Search products by name or SKU..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'type',
            label: 'Type',
            type: 'select',
            options: [
              { value: 'simple', label: 'Simple' },
              { value: 'variable', label: 'Variable' },
              { value: 'digital', label: 'Digital' },
            ],
          },
          {
            id: 'stockStatus',
            label: 'Stock Status',
            type: 'select',
            options: [
              { value: 'in_stock', label: 'In Stock' },
              { value: 'out_of_stock', label: 'Out of Stock' },
              { value: 'on_backorder', label: 'On Backorder' },
              { value: 'made_to_order', label: 'Made to Order' },
            ],
          },
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
        activeFilters={{
          type: filterType,
          stockStatus: filterStockStatus,
          status: filterStatus,
        }}
        onFilterChange={(filters) => {
          setFilterType(filters.type as string || '');
          setFilterStockStatus(filters.stockStatus as string || '');
          setFilterStatus(filters.status as string || '');
        }}
        showStoreFilter={user?.role !== 'store_admin'}
        storeFilterValue={filterStore}
        onStoreFilterChange={handleStoreFilterChange}
        showCategoryFilter
        categoryFilterValue={filterCategory}
        categoryFilterStoreId={filterStore}
        onCategoryFilterChange={setFilterCategory}
      />


      <Box sx={{ width: '100%', position: 'relative' }}>
        {loading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
          }}>
            <LoadingSpinner message="Loading products..." />
          </Box>
        )}
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row._id}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          sx={dataGridStyles}
          rowHeight={80}
        />
      </Box>
    </Box>
  );
}
