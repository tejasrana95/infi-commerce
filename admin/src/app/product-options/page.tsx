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
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');

    useEffect(() => {
        fetchProductOptions();
    }, []);

    const fetchProductOptions = async () => {
        try {
            const response = await api.get('/product-options');
            setProductOptions(response.data.productOptions || response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch product options');
            showNotification('Failed to load product options', 'error');
            setProductOptions([]);
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

    const filteredRows = productOptions.filter((option) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || option.name.toLowerCase().includes(query) || option.slug.toLowerCase().includes(query);
        const optionStoreId = typeof option.storeId === 'object' ? option.storeId._id : option.storeId;
        const matchesStore = !filterStore || optionStoreId === filterStore;
        const matchesType = !filterType || option.type === filterType;
        return matchesSearch && matchesStore && matchesType;
    });

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
                <Chip label={getTypeLabel(params.value as string)} size="small" color="primary" variant="outlined" />
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
                <Typography variant="body2" color="text.secondary">{params.row.values?.length || 0} values</Typography>
            ),
        },
        {
            field: 'isFilterable',
            headerName: 'Filterable',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip label={params.value ? 'Yes' : 'No'} size="small" color={params.value ? 'success' : 'default'} variant={params.value ? 'filled' : 'outlined'} />
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

    if (loading) return <LoadingSpinner message="Loading product options..." />;

    if (productOptions.length === 0 && !searchQuery && !filterStore && !filterType) {
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
