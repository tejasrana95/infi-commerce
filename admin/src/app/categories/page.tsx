'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { Category } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, PermissionGuard, SeoScoreBadge } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';

export default function CategoriesPage() {
  const router = useRouter();
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterParent, setFilterParent] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

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
    fetchCategories();
  }, [paginationModel, debouncedSearch, filterStore, filterParent, filterStatus]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(paginationModel.page + 1));
      params.append('limit', String(paginationModel.pageSize));
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filterStore) params.append('storeId', filterStore);
      if (filterParent) params.append('parentCategory', filterParent);
      if (filterStatus) params.append('status', filterStatus);

      const response = await api.get(`/categories?${params.toString()}`);
      setCategories(response.data.categories || []);
      setTotalRows(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch categories');
      showNotification('Failed to load categories', 'error');
      setCategories([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Delete Category', message: 'Are you sure you want to delete this category?', severity: 'error' })) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c._id !== id));
      showNotification('Category deleted successfully', 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/categories/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/categories/new');
  };

  const handleStoreFilterChange = (value: string) => {
    setFilterStore(value);
    // Clear parent filter when store changes
    if (!value) setFilterParent('');
  };



  const getStoreName = (storeId: any) => {
    if (typeof storeId === 'object' && storeId !== null) {
      return storeId.name;
    }
    return '-';
  };

  const getParentName = (parentCategory: any) => {
    if (typeof parentCategory === 'object' && parentCategory !== null) {
      return parentCategory.title;
    }
    return '-';
  };

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2" fontWeight={600}>{params.row.title}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.slug}</Typography>
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
      field: 'parentCategory',
      headerName: 'Parent',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Typography variant="body2" color="text.secondary">
          {getParentName(params.row.parentCategory)}
        </Typography>
        </Box>
      ),
    },
    {
      field: 'path',
      headerName: 'Path',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Typography variant="caption" color="text.secondary" noWrap>
          {params.row.path || '-'}
        </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as string;
        const active = status === 'active';
        return (
          <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            size="small"
            color={active ? 'success' : status === 'draft' ? 'warning' : 'default'}
            variant={active ? 'filled' : 'outlined'}
          /></Box>
        );
      },
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
          <Tooltip title="Edit">
            <IconButton href={`/categories/${params.row._id}/edit`} size="small" color="primary">
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


  if (!loading && categories.length === 0 && !searchQuery && !filterStore && !filterParent && !filterStatus) {
    return (
      <Box>
        <PageHeader title="Categories" subtitle="Manage product categories" />
        <EmptyState
          message="No categories found. Create your first category!"
          actionLabel="Add Category"
          onAction={handleCreate}
        />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Categories"
        subtitle="Manage product categories"
        actionLabel="Add Category"
        onAction={handleCreate}
      />

      <SearchFilterBar
        searchPlaceholder="Search categories..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'draft', label: 'Draft' },
            ],
          },
        ]}
        activeFilters={{ status: filterStatus }}
        onFilterChange={(filters) => setFilterStatus(filters.status as string || '')}
        showStoreFilter={user?.role !== 'store_admin'}
        storeFilterValue={filterStore}
        onStoreFilterChange={handleStoreFilterChange}
        showCategoryFilter
        categoryFilterValue={filterParent}
        categoryFilterStoreId={filterStore}
        onCategoryFilterChange={setFilterParent}
      />

      <Box sx={{ width: '100%', position: 'relative' }}>
        {loading && (
          <Box
            sx={{
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
            }}
          >
            <LoadingSpinner message="Loading categories..." />
          </Box>
        )}
        <DataGrid
          rows={categories}
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
