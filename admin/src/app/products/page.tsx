'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Avatar } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { Product } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

export default function ProductsPage() {
  const router = useRouter();
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStockStatus, setFilterStockStatus] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
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
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      showNotification('Product deleted successfully', 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete', 'error');
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

  const filteredRows = products.filter((product) => {
    const query = searchQuery.toLowerCase();

    // Search filter (name, SKU)
    const matchesSearch = !searchQuery || (
      (product.name && product.name.toLowerCase().includes(query)) ||
      (product.sku && product.sku.toLowerCase().includes(query))
    );

    // Store filter
    const productStoreId = typeof product.storeId === 'object' && product.storeId !== null
      ? product.storeId._id
      : product.storeId;
    const matchesStore = !filterStore || productStoreId === filterStore;

    // Category filter
    const matchesCategory = !filterCategory || (
      product.categoryIds && product.categoryIds.some(catId => {
        const id = typeof catId === 'object' && catId !== null ? catId._id : catId;
        return id === filterCategory;
      })
    );

    // Type filter
    const matchesType = !filterType || product.type === filterType;

    // Stock status filter
    const matchesStockStatus = !filterStockStatus || product.stockStatus === filterStockStatus;

    // Status filter
    const matchesStatus = !filterStatus || (
      filterStatus === 'active' ? product.isActive : !product.isActive
    );

    return matchesSearch && matchesStore && matchesCategory && matchesType && matchesStockStatus && matchesStatus;
  });

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
        <Avatar
          src={params.row.featuredImage || params.row.images?.[0]}
          alt={params.row.name}
          variant="rounded"
          sx={{ width: 50, height: 50 }}
        />
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
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'variable' ? 'primary' : params.value === 'digital' ? 'secondary' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'storeId',
      headerName: 'Store',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
      ),
    },
    {
      field: 'categoryIds',
      headerName: 'Categories',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" noWrap>{getCategoryNames(params.row.categoryIds)}</Typography>
      ),
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            ${params.row.price}
          </Typography>
          {params.row.salePrice && (
            <Typography variant="caption" color="error">
              Sale: ${params.row.salePrice}
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
        <Chip
          label={params.row.stock}
          size="small"
          color={getStockColor(params.row.stock, params.row.lowStockThreshold)}
        />
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
          <Typography variant="caption">
            {statusLabels[params.value as string] || params.value}
          </Typography>
        );
      },
    },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 100,
      renderCell: (params: GridRenderCellParams) => <StatusChip active={params.value as boolean} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleEdit(params.row._id)} size="small" color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDelete(params.row._id)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (loading) return <LoadingSpinner message="Loading products..." />;

  if (products.length === 0 && !searchQuery && !filterStore && !filterCategory && !filterType && !filterStockStatus && !filterStatus) {
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
        showStoreFilter
        storeFilterValue={filterStore}
        onStoreFilterChange={handleStoreFilterChange}
        showCategoryFilter
        categoryFilterValue={filterCategory}
        categoryFilterStoreId={filterStore}
        onCategoryFilterChange={setFilterCategory}
      />

      <Box sx={{ height: 600, width: '100%' }}>
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
