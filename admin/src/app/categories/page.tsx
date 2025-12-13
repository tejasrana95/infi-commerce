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
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

export default function CategoriesPage() {
  const router = useRouter();
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterParent, setFilterParent] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories');
      showNotification('Failed to load categories', 'error');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
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

  const filteredRows = categories.filter((category) => {
    const query = searchQuery.toLowerCase();

    // Search filter
    const matchesSearch = !searchQuery || (
      (category.title && category.title.toLowerCase().includes(query)) ||
      (category.slug && category.slug.toLowerCase().includes(query)) ||
      (category.description && category.description.toLowerCase().includes(query)) ||
      (category.path && category.path.toLowerCase().includes(query))
    );

    // Store filter
    const categoryStoreId = typeof category.storeId === 'object' && category.storeId !== null
      ? category.storeId._id
      : category.storeId;
    const matchesStore = !filterStore || categoryStoreId === filterStore;

    // Parent category filter
    const categoryParentId = typeof category.parentCategory === 'object' && category.parentCategory !== null
      ? category.parentCategory._id
      : category.parentCategory;
    const matchesParent = !filterParent ||
      (filterParent === 'root' ? !categoryParentId : categoryParentId === filterParent);

    // Status filter
    const matchesStatus = !filterStatus || category.status === filterStatus;

    return matchesSearch && matchesStore && matchesParent && matchesStatus;
  });

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
        <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
      ),
    },
    {
      field: 'parentCategory',
      headerName: 'Parent',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary">
          {getParentName(params.row.parentCategory)}
        </Typography>
      ),
    },
    {
      field: 'path',
      headerName: 'Path',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" color="text.secondary" noWrap>
          {params.row.path || '-'}
        </Typography>
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
          <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            size="small"
            color={active ? 'success' : status === 'draft' ? 'warning' : 'default'}
            variant={active ? 'filled' : 'outlined'}
          />
        );
      },
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

  if (loading) return <LoadingSpinner message="Loading categories..." />;

  if (categories.length === 0 && !searchQuery && !filterStore && !filterParent && !filterStatus) {
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
        showStoreFilter
        storeFilterValue={filterStore}
        onStoreFilterChange={handleStoreFilterChange}
        showCategoryFilter
        categoryFilterValue={filterParent}
        categoryFilterStoreId={filterStore}
        onCategoryFilterChange={setFilterParent}
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
