'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '@/lib/api';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip, PermissionGuard } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';
import { useDebounce } from '@/hooks/useDebounce';

export default function ContentCardCategoriesPage() {
    const router = useRouter();
    const theme = useTheme();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [totalRows, setTotalRows] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    const debouncedSearch = useDebounce(searchQuery, 500);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const params: any = {
                search: debouncedSearch,
                storeId: filterStore,
            };

            if (filterStatus) {
                params.isActive = filterStatus === 'active';
            }

            const response = await api.get('/content-cards/categories', { params });
            const data = response.data.data || [];
            setCategories(data);
            setTotalRows(data.length);
        } catch (err: any) {
            console.error('Failed to fetch content card categories', err);
            showNotification(err.response?.data?.message || 'Failed to load categories', 'error');
            setCategories([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [debouncedSearch, filterStore, filterStatus]);

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Category', message: 'Are you sure you want to delete this category?', severity: 'error' })) return;
        try {
            await api.delete(`/content-cards/categories/${id}`);
            fetchCategories();
            showNotification('Category deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete category', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/content-cards/categories/${id}`);
    };

    const handleCreate = () => {
        router.push('/content-cards/categories/new');
    };

    const handleClone = async (id: string) => {
        try {
            await api.post(`/content-cards/categories/${id}/clone`);
            fetchCategories();
            showNotification('Category cloned successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to clone category', 'error');
        }
    };

    const getStoreName = (storeId: any) => {
        if (typeof storeId === 'object' && storeId !== null) {
            return storeId.name;
        }
        return '-';
    };

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={() => handleEdit(params.row._id)}
                    >
                        {params.row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{params.row.slug}</Typography>
                </Box>
            ),
        },
        {
            field: 'storeId',
            headerName: 'Store',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'cardCount',
            headerName: 'Cards',
            width: 80,
            align: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Chip label={params.value || 0} size="small" variant="outlined" />
                </Box>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <StatusChip active={params.value as boolean} />
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 160,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" justifyContent="start" alignItems="center" height="100%">
                    <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(params.row._id)} size="small" color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Clone">
                        <IconButton onClick={() => handleClone(params.row._id)} size="small" color="info">
                            <ContentCopyIcon fontSize="small" />
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

    if (!loading && categories.length === 0 && !searchQuery && !filterStore && !filterStatus) {
        return (
            <Box>
                <PageHeader title="Content Card Categories" subtitle="Organize your content cards" actionLabel="Create Category" onAction={handleCreate} />
                <EmptyState
                    message="No content card categories found. Create your first category!"
                    actionLabel="Create Category"
                    onAction={handleCreate}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Content Card Categories"
                subtitle="Organize your content cards"
                actionLabel="Create Category"
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
                        ],
                    },
                ]}
                activeFilters={{ status: filterStatus }}
                onFilterChange={(filters) => setFilterStatus(filters.status as string || '')}
                showStoreFilter={user?.role !== 'store_admin'}
                storeFilterValue={filterStore}
                onStoreFilterChange={setFilterStore}
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
                    rows={categories}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50]}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    rowHeight={60}
                    loading={loading}
                />
            </Box>
        </Box>
    );
}
