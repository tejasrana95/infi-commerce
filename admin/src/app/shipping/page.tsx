'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, IconButton, Chip, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { PageHeader, SearchFilterBar, FilterConfig } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useDebounce } from '@/hooks/useDebounce';

interface ShippingRule {
  _id: string;
  name: string;
  description?: string;
  rateType: 'flat' | 'per_kg' | 'free' | 'percentage';
  rate: number;
  currency: string;
  isActive: boolean;
  priority: number;
  geoGroupId?: { _id: string; name: string; countries: string[] };
  categoryIds?: Array<{ _id: string; title: string }>;
  storeId?: { _id: string; name: string };
  minWeight?: number;
  maxWeight?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  createdAt: string;
}

// Filter configurations for SearchFilterBar
const filterConfigs: FilterConfig[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    id: 'rateType',
    label: 'Rate Type',
    type: 'select',
    options: [
      { value: 'flat', label: 'Flat' },
      { value: 'per_kg', label: 'Per KG' },
      { value: 'percentage', label: 'Percentage' },
      { value: 'free', label: 'Free' },
    ],
  },
];

export default function ShippingPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter states
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    fetchShippingRules();
  }, [paginationModel, debouncedSearch, activeFilters]);

  const fetchShippingRules = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearch,
      };

      if (activeFilters.status) {
        params.isActive = activeFilters.status === 'active';
      }
      if (activeFilters.rateType) {
        params.rateType = activeFilters.rateType;
      }

      const response = await api.get('/shipping/rules', { params });
      setShippingRules(response.data.data || []);
      setTotalRows(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch shipping rules');
      setShippingRules([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Delete Shipping Rule', message: 'Are you sure you want to delete this shipping rule?', severity: 'error' })) return;

    try {
      await api.delete(`/shipping/rules/${id}`);
      setShippingRules(prev => prev.filter(r => r._id !== id));
      showNotification('Shipping rule deleted', 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleFilterChange = useCallback((filters: Record<string, string | string[]>) => {
    setActiveFilters(filters);
  }, []);

  const formatRate = (rule: ShippingRule) => {
    switch (rule.rateType) {
      case 'free':
        return 'Free';
      case 'flat':
        return rule.rate.toFixed(2);
      case 'per_kg':
        return `${rule.rate.toFixed(2)}/kg`;
      case 'percentage':
        return `${rule.rate}%`;
      default:
        return `${rule.rate}`;
    }
  };

  const getRateTypeColor = (rateType: string) => {
    switch (rateType) {
      case 'free': return 'success';
      case 'flat': return 'primary';
      case 'per_kg': return 'warning';
      case 'percentage': return 'secondary';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Typography variant="body2" fontWeight={600}>{params.row.name}</Typography></Box>,
    },
    {
      field: 'storeId',
      headerName: 'Store',
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Typography variant="body2" fontWeight={600}>{params.row.storeId?.name || '-'}</Typography></Box>,
    },
    {
      field: 'geoGroupId',
      headerName: 'Geo Group',
      flex: 1,
      minWidth: 140,
      renderCell: (params: GridRenderCellParams) => {
        const geoGroup = params.row.geoGroupId;
        if (!geoGroup) return <Chip label="All Countries" size="small" variant="outlined" />;
        return (
          <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
            <Chip
              label={`${geoGroup.name} (${geoGroup.countries?.length || 0})`}
              size="small"
              variant="outlined"
              color="info"
            />
          </Box>
        );
      },
    },
    {
      field: 'rateType',
      headerName: 'Rate Type',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Chip
            label={params.row.rateType}
            size="small"
            color={getRateTypeColor(params.row.rateType) as any}
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>
      ),
    },
    {
      field: 'rate',
      headerName: 'Rate',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><strong>{formatRate(params.row)}</strong></Box>
      ),
    },
    {
      field: 'categoryIds',
      headerName: 'Categories',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => {
        const categories = params.row.categoryIds || [];
        if (categories.length === 0) return <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><span style={{ color: '#999' }}>All</span></Box>;
        return (
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {categories.slice(0, 2).map((cat: any) => (
              <Chip key={cat._id} label={cat.title} size="small" variant="outlined" sx={{ height: 22 }} />
            ))}
            {categories.length > 2 && (
              <Chip label={`+${categories.length - 2}`} size="small" sx={{ height: 22 }} />
            )}
          </Box>
        );
      },
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><StatusChip active={params.row.isActive} /></Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="row" justifyContent="center" height="100%">
          <IconButton size="small" onClick={() => router.push(`/shipping/${params.row._id}`)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];





  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <PageHeader
          title="Shipping Rules"
          subtitle="Manage shipping rates and delivery zones"
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/shipping/new')}
        >
          Add Shipping Rule
        </Button>
      </Box>

      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search shipping rules..."
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
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
            backgroundColor: 'rgba(255, 255, 255, 0.5)'
          }}>
            <LoadingSpinner />
          </Box>
        )}
        <DataGrid
          rows={shippingRules}
          columns={columns}
          getRowId={(row) => row._id}
          paginationMode="server"
          rowCount={totalRows}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          loading={loading}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            '& .MuiDataGrid-cell': { py: 1 },
          }}
        />
      </Box>
    </Box>
  );
}
