'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { Attribute } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

export default function AttributesPage() {
  const router = useRouter();
  const theme = useTheme();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      const response = await api.get('/attributes');
      setAttributes(response.data.attributes || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch attributes');
      showNotification('Failed to load attributes', 'error');
      setAttributes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attribute?')) return;
    try {
      await api.delete(`/attributes/${id}`);
      setAttributes(attributes.filter(a => a._id !== id));
      showNotification('Attribute deleted successfully', 'success');
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

  const handleStoreFilterChange = (value: string) => {
    setFilterStore(value);
  };

  const filteredRows = attributes.filter((attribute) => {
    const query = searchQuery.toLowerCase();

    // Search filter
    const matchesSearch = !searchQuery || (
      (attribute.name && attribute.name.toLowerCase().includes(query)) ||
      (attribute.slug && attribute.slug.toLowerCase().includes(query))
    );

    // Store filter
    const attributeStoreId = typeof attribute.storeId === 'object' && attribute.storeId !== null
      ? attribute.storeId._id
      : attribute.storeId;
    const matchesStore = !filterStore || attributeStoreId === filterStore;

    // Type filter
    const matchesType = !filterType || attribute.type === filterType;

    return matchesSearch && matchesStore && matchesType;
  });

  const getStoreName = (storeId: any) => {
    if (typeof storeId === 'object' && storeId !== null) {
      return storeId.name;
    }
    return '-';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      select: 'Select',
      multiselect: 'Multi-Select',
      text: 'Text',
      color: 'Color',
      size: 'Size',
    };
    return labels[type] || type;
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
          color="primary"
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
      field: 'values',
      headerName: 'Values',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary">
          {params.row.values?.length || 0} values
        </Typography>
      ),
    },
    {
      field: 'isFilterable',
      headerName: 'Filterable',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          size="small"
          color={params.value ? 'success' : 'default'}
          variant={params.value ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'isVariation',
      headerName: 'Variation',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          size="small"
          color={params.value ? 'info' : 'default'}
          variant={params.value ? 'filled' : 'outlined'}
        />
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
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDelete(params.row._id)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (loading) return <LoadingSpinner message="Loading attributes..." />;

  if (attributes.length === 0 && !searchQuery && !filterStore && !filterType) {
    return (
      <Box>
        <PageHeader title="Attributes" subtitle="Manage product attributes" />
        <EmptyState
          message="No attributes found. Create your first attribute!"
          actionLabel="Add Attribute"
          onAction={handleCreate}
        />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Attributes"
        subtitle="Manage product attributes"
        actionLabel="Add Attribute"
        onAction={handleCreate}
      />

      <SearchFilterBar
        searchPlaceholder="Search attributes..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'type',
            label: 'Type',
            type: 'select',
            options: [
              { value: 'select', label: 'Select' },
              { value: 'multiselect', label: 'Multi-Select' },
              { value: 'text', label: 'Text' },
              { value: 'color', label: 'Color' },
              { value: 'size', label: 'Size' },
            ],
          },
        ]}
        activeFilters={{ type: filterType }}
        onFilterChange={(filters) => setFilterType(filters.type as string || '')}
        showStoreFilter
        storeFilterValue={filterStore}
        onStoreFilterChange={handleStoreFilterChange}
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
