'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, Alert } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel, GridPaginationModel } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import TuneIcon from '@mui/icons-material/Tune';
import api from '@/lib/api';
import { Product } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar, BulkActionBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip, PermissionGuard, SeoScoreBadge } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { showNotification } = useNotification();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set<string>() });
  const [bulkOpModalOpen, setBulkOpModalOpen] = useState(false);
  const [bulkOpLoading, setBulkOpLoading] = useState(false);
  const [bulkOpData, setBulkOpData] = useState({
    pricePercent: '',
    priceNormalizer: '0',
    priceRoundDirection: 'up',
    stockQty: '',
    weightPercent: '',
  });

  const getSelectedIds = (): string[] => {
    if (selectionModel.type === 'include') return Array.from(selectionModel.ids) as string[];
    return products.map(p => p._id).filter(id => !selectionModel.ids.has(id));
  };

  // Get initial values from URL
  const getInitialValue = (key: string, defaultValue: string = '') => {
    return searchParams.get(key) || defaultValue;
  };

  // Filter states - initialized from URL
  const [searchQuery, setSearchQuery] = useState(getInitialValue('search'));
  const [filterStore, setFilterStore] = useState<string>(getInitialValue('storeId'));
  const [filterCategory, setFilterCategory] = useState<string>(getInitialValue('categoryId'));
  const [filterType, setFilterType] = useState<string>(getInitialValue('type'));
  const [filterStockStatus, setFilterStockStatus] = useState<string>(getInitialValue('stockStatus'));
  const [filterStatus, setFilterStatus] = useState<string>(getInitialValue('status'));
  
  // Pagination state - initialized from URL
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: parseInt(getInitialValue('page', '0')),
    pageSize: parseInt(getInitialValue('limit', '25')),
  });

  // Debounced search query for API calls
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Update URL when filters or pagination change
  const updateURL = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      updateURL({ search: searchQuery, page: '0' }); // Reset to page 0 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when filters change
  useEffect(() => {
    updateURL({
      storeId: filterStore,
      categoryId: filterCategory,
      type: filterType,
      stockStatus: filterStockStatus,
      status: filterStatus,
      page: '0', // Reset to page 0 when filters change
    });
  }, [filterStore, filterCategory, filterType, filterStockStatus, filterStatus]);

  // Update URL when pagination changes
  useEffect(() => {
    updateURL({
      page: String(paginationModel.page),
      limit: String(paginationModel.pageSize),
      type: filterType,
      stockStatus: filterStockStatus,
      storeId: filterStore,
      search: debouncedSearch,
      categoryId: filterCategory,
      status: filterStatus,
    });
  }, [debouncedSearch, filterCategory, filterStatus, filterStockStatus, filterStore, filterType, paginationModel]);

  // Fetch products when URL params change
  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, filterStore, filterCategory, filterType, filterStockStatus, filterStatus, paginationModel]);

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
      
      // Add pagination params
      params.append('page', String(paginationModel.page + 1)); // API expects 1-based page
      params.append('limit', String(paginationModel.pageSize));

      const queryString = params.toString();
      const url = `/products?${queryString}`;

      const response = await api.get(url);
      setProducts(response.data.products || []);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch products');
      showNotification('Failed to load products', 'error');
      setProducts([]);
      setTotalCount(0);
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

  const handleBulkAction = async (action: string) => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    
    // Open bulk operation modal for special actions
    if (action === 'operation') {
      setBulkOpModalOpen(true);
      return;
    }
    
    const actionLabels: Record<string, string> = { delete: 'delete', activate: 'activate', deactivate: 'deactivate' };
    if (!await confirm({ title: `Bulk ${actionLabels[action]}`, message: `Are you sure you want to ${actionLabels[action]} ${ids.length} product(s)?`, severity: action === 'delete' ? 'error' : 'warning' })) return;
    try {
      await api.post('/products/bulk-action', { ids, action });
      showNotification(`Bulk ${action} completed`, 'success');
      setSelectionModel({ type: 'include', ids: new Set<string>() });
      fetchProducts();
    } catch (err: any) {
      showNotification(err.response?.data?.message || `Bulk ${action} failed`, 'error');
    }
  };

  const handleBulkOperation = async () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;

    if (!bulkOpData.pricePercent && !bulkOpData.stockQty && !bulkOpData.weightPercent) {
      showNotification('Please select at least one operation', 'warning');
      return;
    }

    if (!await confirm({ title: 'Bulk Operation', message: `Apply operations to ${ids.length} product(s) and their variants?`, severity: 'warning' })) return;

    setBulkOpLoading(true);
    try {
      await api.post('/products/bulk-operation', {
        ids,
        pricePercent: bulkOpData.pricePercent ? parseFloat(bulkOpData.pricePercent) : null,
        priceNormalizer: (bulkOpData.pricePercent && bulkOpData.priceNormalizer && bulkOpData.priceNormalizer !== '0') ? parseInt(bulkOpData.priceNormalizer) : null,
        priceRoundDirection: (bulkOpData.priceNormalizer && bulkOpData.priceNormalizer !== '0') ? bulkOpData.priceRoundDirection : null,
        stockQty: bulkOpData.stockQty ? parseInt(bulkOpData.stockQty) : null,
        weightPercent: bulkOpData.weightPercent ? parseFloat(bulkOpData.weightPercent) : null,
      });
      showNotification('Bulk operation completed successfully', 'success');
      setBulkOpModalOpen(false);
      setBulkOpData({ pricePercent: '', priceNormalizer: '0', priceRoundDirection: 'up', stockQty: '', weightPercent: '' });
      setSelectionModel({ type: 'include', ids: new Set<string>() });
      fetchProducts();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Bulk operation failed', 'error');
    } finally {
      setBulkOpLoading(false);
    }
  };

  const handleCreate = () => {
    router.push('/products/new');
  };

  const handleStoreFilterChange = (value: string) => {
    setFilterStore(value);
    setFilterCategory(''); // Reset category when store changes
    setPaginationModel({ ...paginationModel, page: 0 }); // Reset to first page
  };

  // Handle filter changes with pagination reset
  const handleFilterChange = (filters: Record<string, string>) => {
    setFilterType(filters.type as string || '');
    setFilterStockStatus(filters.stockStatus as string || '');
    setFilterStatus(filters.status as string || '');
    setPaginationModel({ ...paginationModel, page: 0 }); // Reset to first page
  };

  const handleCategoryFilterChange = (value: string) => {
    setFilterCategory(value);
    setPaginationModel({ ...paginationModel, page: 0 }); // Reset to first page
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
            <IconButton href={`/products/${params.row._id}/edit`} size="small" color="primary">
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
        onFilterChange={handleFilterChange}
        showStoreFilter={user?.role !== 'store_admin'}
        storeFilterValue={filterStore}
        onStoreFilterChange={handleStoreFilterChange}
        showCategoryFilter
        categoryFilterValue={filterCategory}
        categoryFilterStoreId={filterStore}
        onCategoryFilterChange={handleCategoryFilterChange}
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
          paginationMode="server"
          rowCount={totalCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          checkboxSelection
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={setSelectionModel}
          sx={dataGridStyles}
          rowHeight={80}
        />
        <BulkActionBar
          selectedCount={getSelectedIds().length}
          onClear={() => setSelectionModel({ type: 'include', ids: new Set<string>() })}
          actions={[
            { label: 'Bulk Operation', icon: <TuneIcon />, color: 'info', onClick: () => handleBulkAction('operation') },
            { label: 'Delete', icon: <DeleteIcon />, color: 'error', onClick: () => handleBulkAction('delete') },
            { label: 'Activate', icon: <CheckCircleIcon />, color: 'success', onClick: () => handleBulkAction('activate') },
            { label: 'Deactivate', icon: <BlockIcon />, color: 'warning', onClick: () => handleBulkAction('deactivate') },
          ]}
        />
      </Box>

      {/* Bulk Operation Modal */}
      <Dialog open={bulkOpModalOpen} onClose={() => setBulkOpModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Operation</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Selected: {getSelectedIds().length} product(s) (including all variants)
          </Alert>

          <Grid container spacing={2}>
            {/* Price Operation */}
            <Grid size={12}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Price Adjustment</Typography>
              <TextField
                fullWidth
                label="Price Change %"
                placeholder="e.g., 10 for +10%, -10 for -10%"
                value={bulkOpData.pricePercent}
                onChange={(e) => setBulkOpData({ ...bulkOpData, pricePercent: e.target.value })}
                type="number"
                inputProps={{ step: '0.01' }}
                size="small"
              />
            </Grid>

            {/* Price Normalizer */}
            {bulkOpData.pricePercent && (
              <>
                <Grid size={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Round prices after adjustment (e.g., 141.9 → 145 with round to 5, up)
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Round To Nearest"
                    placeholder="e.g., 5, 9, 10 (0 = no rounding)"
                    value={bulkOpData.priceNormalizer}
                    onChange={(e) => setBulkOpData({ ...bulkOpData, priceNormalizer: e.target.value })}
                    type="number"
                    inputProps={{ step: '1', min: '0' }}
                    size="small"
                    helperText="Examples: 141→(5)→145/140, (9)→149/141, (10)→150/140"
                  />
                </Grid>
                <Grid size={6}>
                  {bulkOpData.priceNormalizer !== '0' && bulkOpData.priceNormalizer !== '' && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Direction</InputLabel>
                      <Select
                        value={bulkOpData.priceRoundDirection}
                        label="Direction"
                        onChange={(e) => setBulkOpData({ ...bulkOpData, priceRoundDirection: e.target.value })}
                      >
                        <MenuItem value="up">Round Up</MenuItem>
                        <MenuItem value="down">Round Down</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Grid>
              </>
            )}

            {/* Stock Qty */}
            <Grid size={12}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Stock Quantity</Typography>
              <TextField
                fullWidth
                label="Set Stock Quantity"
                placeholder="e.g., 100 (sets all selected to 100)"
                value={bulkOpData.stockQty}
                onChange={(e) => setBulkOpData({ ...bulkOpData, stockQty: e.target.value })}
                type="number"
                inputProps={{ step: '1', min: '0' }}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">Sets stock for all selected products and variants to this quantity</Typography>
            </Grid>

            {/* Weight */}
            <Grid size={12}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Weight Adjustment</Typography>
              <TextField
                fullWidth
                label="Weight Change %"
                placeholder="e.g., 10 for +10%, -10 for -10%"
                value={bulkOpData.weightPercent}
                onChange={(e) => setBulkOpData({ ...bulkOpData, weightPercent: e.target.value })}
                type="number"
                inputProps={{ step: '0.01' }}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">Increases/decreases weight by percentage for all selected products and variants</Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkOpModalOpen(false)} disabled={bulkOpLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkOperation} disabled={bulkOpLoading}>
            {bulkOpLoading ? 'Processing...' : 'Apply Operations'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
