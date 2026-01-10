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

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination state
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchStores();
  }, [paginationModel, debouncedSearch]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(paginationModel.page + 1));
      params.append('limit', String(paginationModel.pageSize));
      if (debouncedSearch) params.append('search', debouncedSearch);

      const response = await api.get(`/stores?${params.toString()}`);
      setStores(response.data.stores || []);
      setTotalRows(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch stores');
      showNotification('Failed to load stores', 'error');
      setStores([]);
      setTotalRows(0);
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
      field: 'domains',
      headerName: 'Domain',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => {
        const domains = params.row.domains || [];
        const primaryDomain = domains[0] || 'No domain';
        const additionalCount = domains.length > 1 ? domains.length - 1 : 0;
        return (
          <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
            <Typography variant="body2" fontWeight={600}>
              {primaryDomain}
              {additionalCount > 0 && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (+{additionalCount} more)
                </Typography>
              )}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'currency',
      headerName: 'Currency',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2" fontWeight={600}>{params.row.currency}</Typography>
        </Box>
      ),
    },
    {
      field: 'timezone',
      headerName: 'Timezone',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2" fontWeight={600}>{params.row.timezone}</Typography>
        </Box>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => <Box display="flex" flexDirection="column" gap={1} alignItems="start" justifyContent="center" height="100%"><StatusChip active={params.value as boolean} /></Box>,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="row" gap={1} alignItems="start" justifyContent="center" height="100%">
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

  if (!loading && stores.length === 0 && !searchQuery) {
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

      <Box sx={{ width: '100%', mt: 2, position: 'relative' }}>
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
            <LoadingSpinner message="Loading stores..." />
          </Box>
        )}
        <DataGrid
          rows={stores}
          columns={columns}
          getRowId={(row) => row._id}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          rowCount={totalRows}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          disableRowSelectionOnClick
          sx={dataGridStyles}
        />
      </Box>
    </Box>
  );
}
