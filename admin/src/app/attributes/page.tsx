'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, PermissionGuard } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';

interface Attribute {
  _id: string;
  name: string;
  slug: string;
  type: 'select' | 'multiselect' | 'checkbox' | 'text' | 'number';
  options?: string[];
  unit?: string;
  isFilterable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  categoryIds?: { _id: string; name: string }[];
  sortOrder: number;
  storeId: { _id: string; name: string } | string;
}

export default function AttributesPage() {
  const router = useRouter();
  const theme = useTheme();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      const response = await api.get('/attributes');
      setAttributes(response.data.data || response.data.attributes || []);
    } catch (err) {
      console.error('Failed to fetch attributes');
      showNotification('Failed to load specifications', 'error');
      setAttributes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Delete Specification', message: 'Are you sure you want to delete this specification?', severity: 'error' })) return;
    try {
      await api.delete(`/attributes/${id}`);
      setAttributes(attributes.filter(a => a._id !== id));
      showNotification('Specification deleted successfully', 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/attributes/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/attributes/new');
  };

  const filteredRows = attributes.filter((attribute) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || attribute.name.toLowerCase().includes(query) || attribute.slug.toLowerCase().includes(query);
    const attributeStoreId = typeof attribute.storeId === 'object' ? attribute.storeId._id : attribute.storeId;
    const matchesStore = !filterStore || attributeStoreId === filterStore;
    const matchesType = !filterType || attribute.type === filterType;
    return matchesSearch && matchesStore && matchesType;
  });

  const getStoreName = (storeId: any) => {
    if (typeof storeId === 'object' && storeId !== null) return storeId.name;
    return '-';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      select: 'Dropdown',
      multiselect: 'Multi-Select',
      checkbox: 'Checkbox',
      text: 'Text',
      number: 'Number',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'info' | 'warning'> = {
      select: 'primary',
      multiselect: 'secondary',
      checkbox: 'success',
      text: 'info',
      number: 'warning',
    };
    return colors[type] || 'primary';
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2" fontWeight={600}>{params.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.slug}</Typography>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getTypeLabel(params.value as string)}
          size="small"
          color={getTypeColor(params.value as string)}
          variant="outlined"
        />
      ),
    },
    {
      field: 'options',
      headerName: 'Options/Unit',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const attr = params.row as Attribute;
        if (attr.type === 'select' || attr.type === 'multiselect') {
          return <Typography variant="body2" color="text.secondary">{attr.options?.length || 0} options</Typography>;
        } else if (attr.type === 'number' && attr.unit) {
          return <Typography variant="body2" color="text.secondary">Unit: {attr.unit}</Typography>;
        }
        return <Typography variant="body2" color="text.secondary">-</Typography>;
      },
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
      field: 'isFilterable',
      headerName: 'Filterable',
      width: 90,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value ? 'Yes' : 'No'} size="small" color={params.value ? 'success' : 'default'} variant={params.value ? 'filled' : 'outlined'} />
      ),
    },
    {
      field: 'isComparable',
      headerName: 'Compare',
      width: 90,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value ? 'Yes' : 'No'} size="small" color={params.value ? 'info' : 'default'} variant={params.value ? 'filled' : 'outlined'} />
      ),
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

  if (loading) return <LoadingSpinner message="Loading specifications..." />;

  if (attributes.length === 0 && !searchQuery && !filterStore && !filterType) {
    return (
      <Box>
        <PageHeader title="Product Specifications" subtitle="Manage product specifications for display and comparison" />
        <EmptyState
          message="No specifications found. Create your first specification attribute!"
          actionLabel="Add Specification"
          onAction={handleCreate}
        />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Product Specifications"
        subtitle="Manage product specifications for display and comparison"
        actionLabel="Add Specification"
        onAction={handleCreate}
      />

      <SearchFilterBar
        searchPlaceholder="Search specifications..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'type',
            label: 'Type',
            type: 'select',
            options: [
              { value: 'select', label: 'Dropdown' },
              { value: 'multiselect', label: 'Multi-Select' },
              { value: 'checkbox', label: 'Checkbox' },
              { value: 'text', label: 'Text' },
              { value: 'number', label: 'Number' },
            ],
          },
        ]}
        activeFilters={{ type: filterType }}
        onFilterChange={(filters) => setFilterType(filters.type as string || '')}
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
