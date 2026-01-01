'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, IconButton, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { PageHeader, SearchFilterBar, FilterConfig } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';

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
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});

  useEffect(() => {
    fetchShippingRules();
  }, []);

  const fetchShippingRules = async () => {
    try {
      const response = await api.get('/shipping/rules');
      setShippingRules(response.data.data || response.data.shippingRules || []);
    } catch (err) {
      console.error('Failed to fetch shipping rules');
      setShippingRules([]);
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
    setSearch(value);
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
    },
    {
      field: 'storeId',
      headerName: 'Store',
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => params.row.storeId?.name || '-',
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
          <Chip
            label={`${geoGroup.name} (${geoGroup.countries?.length || 0})`}
            size="small"
            variant="outlined"
            color="info"
          />
        );
      },
    },
    {
      field: 'rateType',
      headerName: 'Rate Type',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.row.rateType}
          size="small"
          color={getRateTypeColor(params.row.rateType) as any}
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'rate',
      headerName: 'Rate',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <strong>{formatRate(params.row)}</strong>
      ),
    },
    {
      field: 'categoryIds',
      headerName: 'Categories',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => {
        const categories = params.row.categoryIds || [];
        if (categories.length === 0) return <span style={{ color: '#999' }}>All</span>;
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
        <StatusChip active={params.row.isActive} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
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

  // Filter data based on search and filters
  const filteredRules = shippingRules.filter(rule => {
    const matchesSearch = search === '' ||
      rule.name.toLowerCase().includes(search.toLowerCase());

    const statusFilter = activeFilters.status as string;
    const matchesStatus = !statusFilter ||
      (statusFilter === 'active' && rule.isActive) ||
      (statusFilter === 'inactive' && !rule.isActive);

    const rateTypeFilter = activeFilters.rateType as string;
    const matchesRateType = !rateTypeFilter || rule.rateType === rateTypeFilter;

    return matchesSearch && matchesStatus && matchesRateType;
  });

  if (loading) return <LoadingSpinner message="Loading shipping rules..." />;

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
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search shipping rules..."
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
      />

      <DataGrid
        rows={filteredRules}
        columns={columns}
        getRowId={(row) => row._id}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
          sorting: { sortModel: [{ field: 'priority', sort: 'desc' }] },
        }}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          '& .MuiDataGrid-cell': { py: 1 },
        }}
      />
    </Box>
  );
}
