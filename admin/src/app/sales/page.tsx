'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Switch } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, PermissionGuard } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { createDataGridStyles } from '@/utils/styles';

interface Sale {
  _id: string;
  storeId: { _id: string; name: string } | string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  applyTo: 'categories' | 'products' | 'all';
  categoryIds?: { _id: string; title: string }[];
  productIds?: { _id: string; name: string }[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
}

export default function SalesPage() {
  const router = useRouter();
  const theme = useTheme();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const { formatPrice, baseCurrency } = useCurrency();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data.sales || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch sales');
      showNotification('Failed to load sales', 'error');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Delete Sale', message: 'Are you sure you want to delete this sale?', severity: 'error' })) return;
    try {
      await api.delete(`/sales/${id}`);
      setSales(sales.filter(s => s._id !== id));
      showNotification('Sale deleted successfully', 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/sales/${id}`, { isActive: !currentStatus });
      setSales(sales.map(s => s._id === id ? { ...s, isActive: !currentStatus } : s));
      showNotification(`Sale ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/sales/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/sales/new');
  };

  const getSaleStatus = (sale: Sale): { label: string; color: 'success' | 'warning' | 'default' | 'error' } => {
    const now = new Date();
    const start = new Date(sale.startDate);
    const end = new Date(sale.endDate);

    if (!sale.isActive) return { label: 'Inactive', color: 'default' };
    if (now < start) return { label: 'Scheduled', color: 'warning' };
    if (now > end) return { label: 'Expired', color: 'error' };
    return { label: 'Active', color: 'success' };
  };

  const filteredRows = sales.filter((sale) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      sale.name.toLowerCase().includes(query) ||
      sale.description?.toLowerCase().includes(query);
    const saleStoreId = typeof sale.storeId === 'object' ? sale.storeId._id : sale.storeId;
    const matchesStore = !filterStore || saleStoreId === filterStore;

    // Status filter
    let matchesStatus = true;
    if (filterStatus) {
      const status = getSaleStatus(sale);
      matchesStatus = status.label.toLowerCase() === filterStatus.toLowerCase();
    }

    return matchesSearch && matchesStore && matchesStatus;
  });

  const getStoreName = (storeId: any) => {
    if (typeof storeId === 'object' && storeId !== null) return storeId.name;
    return '-';
  };

  const formatDiscount = (sale: Sale) => {
    if (sale.type === 'percentage') {
      return `${sale.value}% OFF`;
    }
    return `${baseCurrency?.symbol || '$'}${sale.value} OFF`;
  };

  const formatApplyTo = (sale: Sale) => {
    switch (sale.applyTo) {
      case 'all': return 'All Products';
      case 'categories':
        const catCount = sale.categoryIds?.length || 0;
        return `${catCount} ${catCount === 1 ? 'Category' : 'Categories'}`;
      case 'products':
        const prodCount = sale.productIds?.length || 0;
        return `${prodCount} ${prodCount === 1 ? 'Product' : 'Products'}`;
      default: return sale.applyTo;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Sale',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2" fontWeight={600}>{params.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.description || formatApplyTo(params.row)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'value',
      headerName: 'Discount',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={formatDiscount(params.row)}
          size="small"
          color={params.row.type === 'percentage' ? 'primary' : 'secondary'}
          variant="filled"
        />
      ),
    },
    {
      field: 'applyTo',
      headerName: 'Applies To',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">{formatApplyTo(params.row)}</Typography>
      ),
    },
    {
      field: 'dateRange',
      headerName: 'Date Range',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {formatDate(params.row.startDate)} - {formatDate(params.row.endDate)}
        </Typography>
      ),
    },
    {
      field: 'storeId',
      headerName: 'Store',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const status = getSaleStatus(params.row);
        return <Chip label={status.label} size="small" color={status.color} variant="outlined" />;
      },
    },
    {
      field: 'isActive',
      headerName: 'Enabled',
      width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Switch
          checked={params.value}
          size="small"
          onChange={() => handleToggleActive(params.row._id, params.value)}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
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

  if (loading) return <LoadingSpinner message="Loading sales..." />;

  if (sales.length === 0 && !searchQuery && !filterStore && !filterStatus) {
    return (
      <Box>
        <PageHeader title="Sales & Promotions" subtitle="Create and manage discount campaigns" />
        <EmptyState
          message="No sales campaigns found. Create your first sale!"
          actionLabel="Create Sale"
          onAction={handleCreate}
        />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Sales & Promotions"
        subtitle="Create and manage discount campaigns"
        actionLabel="Create Sale"
        onAction={handleCreate}
      />

      <SearchFilterBar
        searchPlaceholder="Search sales..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'expired', label: 'Expired' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
        ]}
        activeFilters={{ status: filterStatus }}
        onFilterChange={(filters) => setFilterStatus(filters.status as string || '')}
        showStoreFilter={user?.role !== 'store_admin'}
        storeFilterValue={filterStore}
        onStoreFilterChange={setFilterStore}
      />

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row._id}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          sx={dataGridStyles}
        />
      </Box>
    </Box>
  );
}
