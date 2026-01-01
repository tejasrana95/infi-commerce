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

interface ProductOption {
    _id: string;
    name: string;
    slug: string;
    type: 'select' | 'multiselect' | 'color' | 'size';
    values: { label: string; value: string; colorCode?: string }[];
    isFilterable: boolean;
    sortOrder: number;
    storeId: { _id: string; name: string } | string;
}

export default function ProductOptionsPage() {
    const router = useRouter();
    const theme = useTheme();
    const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');

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
        fetchProductOptions();
    }, [paginationModel, debouncedSearch, filterStore, filterType]);

    const fetchProductOptions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(paginationModel.page + 1));
            params.append('limit', String(paginationModel.pageSize));
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filterStore) params.append('storeId', filterStore);
            if (filterType) params.append('type', filterType);

            const response = await api.get(`/product-options?${params.toString()}`);
            setProductOptions(response.data.productOptions || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (err) {
            console.error('Failed to fetch product options');
            showNotification('Failed to load product options', 'error');
            setProductOptions([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Option', message: 'Are you sure you want to delete this product option?', severity: 'error' })) return;
        try {
            await api.delete(`/product-options/${id}`);
            setProductOptions(productOptions.filter(a => a._id !== id));
            showNotification('Product option deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/product-options/${id}/edit`);
    };

    const handleCreate = () => {
        router.push('/product-options/new');
    };



    const getStoreName = (storeId: any) => {
        if (typeof storeId === 'object' && storeId !== null) return storeId.name;
        return '-';
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = { select: 'Select', multiselect: 'Multi-Select', color: 'Color', size: 'Size' };
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
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Chip label={getTypeLabel(params.value as string)} size="small" color="primary" variant="outlined" />
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
            field: 'values',
            headerName: 'Values',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" color="text.secondary">{params.row.values?.length || 0} values</Typography>
                </Box>
            ),
        },
        {
            field: 'isFilterable',
            headerName: 'Filterable',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Chip label={params.value ? 'Yes' : 'No'} size="small" color={params.value ? 'success' : 'default'} variant={params.value ? 'filled' : 'outlined'} />
                </Box>
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

    if (!loading && productOptions.length === 0 && !searchQuery && !filterStore && !filterType) {
        return (
            <Box>
                <PageHeader title="Product Options" subtitle="Manage variant options (Color, Size, RAM, etc.)" />
                <EmptyState
                    message="No product options found. Create your first option for variants!"
                    actionLabel="Add Product Option"
                    onAction={handleCreate}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Product Options"
                subtitle="Manage variant options (Color, Size, RAM, etc.)"
                actionLabel="Add Product Option"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search product options..."
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
                            { value: 'color', label: 'Color' },
                            { value: 'size', label: 'Size' },
                        ],
                    },
                ]}
                activeFilters={{ type: filterType }}
                onFilterChange={(filters) => setFilterType(filters.type as string || '')}
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
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    }}>
                        <LoadingSpinner message="Loading product options..." />
                    </Box>
                )}
                <DataGrid
                    rows={productOptions}
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
