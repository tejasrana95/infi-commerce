'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Tooltip, IconButton, Typography, useTheme } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { Store } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';

export default function StoresPage() {
  const router = useRouter();
  const theme = useTheme();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data.stores || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch stores');
      showNotification('Failed to load stores', 'error');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Delete Store', message: 'Are you sure you want to delete this store?', severity: 'error' })) return;
    try {
      await api.delete(`/stores/${id}`);
      setStores(stores.filter(s => s._id !== id));
      showNotification('Store deleted successfully', 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/stores/${id}/edit`);
  };

  const handleThemeEdit = (id: string) => {
    router.push(`/stores/${id}/theme`);
  };

  const handleCreate = () => {
    router.push('/stores/new');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const filteredRows = stores.filter((store) => {
    const query = searchQuery.toLowerCase();
    return (
      (store.name && store.name.toLowerCase().includes(query)) ||
      (store.domain && store.domain.toLowerCase().includes(query)) ||
      (store.slug && store.slug.toLowerCase().includes(query))
    );
  });

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
      field: 'domain',
      headerName: 'Domain',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'currency',
      headerName: 'Currency',
      width: 100,
    },
    {
      field: 'timezone',
      headerName: 'Timezone',
      width: 150,
    },
    {
      field: 'isActive',
      headerName: 'Status',
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

          <Tooltip title="Edit Theme">
            <IconButton onClick={() => handleThemeEdit(params.row._id)} size="small" color="primary">
              <FormatPaintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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

  if (loading) return <LoadingSpinner message="Loading stores..." />;

  if (stores.length === 0 && !searchQuery) {
    return (
      <Box>
        <PageHeader title="Stores" subtitle="Manage your stores" />
        <EmptyState
          message="No stores found. Create your first store!"
          actionLabel="Add Store"
          onAction={handleCreate}
        />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Stores"
        subtitle="Manage your stores"
        actionLabel="Add Store"
        onAction={handleCreate}
      />

      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search stores..."
      />

      <Box sx={{ height: 600, width: '100%', mt: 2 }}>
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
