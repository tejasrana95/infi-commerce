'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import api from '@/lib/api';
import { Layout } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';

export default function LayoutsPage() {
    const router = useRouter();
    const theme = useTheme();
    const [layouts, setLayouts] = useState<Layout[]>([]);
    const [loading, setLoading] = useState(true);
    const [stores, setStores] = useState<any[]>([]);
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    /* Pagination & Search State */
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [totalRows, setTotalRows] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    /* Debounce Search */
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        fetchLayouts();
    }, [paginationModel, debouncedSearch, filterType, filterStatus]);

    const fetchLayouts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: (paginationModel.page + 1).toString(),
                limit: paginationModel.pageSize.toString(),
                search: debouncedSearch,
            });

            if (filterType) params.append('type', filterType);
            if (filterStatus) params.append('status', filterStatus);

            const response = await api.get(`/layouts?${params.toString()}`);

            if (response.data.success) {
                setLayouts(response.data.data);
                setTotalRows(response.data.pagination.total);
            } else {
                setLayouts(response.data.data || []);
                setTotalRows(response.data.data?.length || 0);
            }
        } catch (err: any) {
            console.error('Failed to fetch layouts', err);
            showNotification(err.response?.data?.message || 'Failed to load layouts', 'error');
            setLayouts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Layout', message: 'Are you sure you want to delete this layout?', severity: 'error' })) return;
        try {
            await api.delete(`/layouts/${id}`);
            showNotification('Layout deleted successfully', 'success');
            fetchLayouts(); // Reload
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete layout', 'error');
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            const response = await api.post(`/layouts/${id}/duplicate`, { name: '' });
            showNotification('Layout duplicated successfully', 'success');
            fetchLayouts();
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to duplicate layout', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/layouts/${id}`);
    };

    const handleCreate = () => {
        router.push('/layouts/new');
    };

    const handleToggleDefault = async (layout: Layout) => {
        try {
            await api.put(`/layouts/${layout._id}`, { isDefault: !layout.isDefault });
            fetchLayouts();
            showNotification('Layout updated successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update layout', 'error');
        }
    };

    // Removed filteredRows

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 180,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => handleEdit(params.row._id)}>
                        {params.row.name}
                    </Typography>
                    {params.row.description && (
                        <Typography variant="caption" color="text.secondary" noWrap>{params.row.description}</Typography>
                    )}
                </Box>
            ),
        },
        {
            field: 'storeId',
            headerName: 'Store',
            width: 140,
            renderCell: (params: GridRenderCellParams) => {
                const store = params.value;
                return store?.name ? (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Typography variant="body2">{store.name}</Typography></Box>
                ) : (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Typography variant="body2" color="text.secondary">-</Typography></Box>
                );
            },
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 130,
            renderCell: (params: GridRenderCellParams) => {
                const typeLabels: Record<string, string> = {
                    homepage: 'Homepage',
                    category: 'Category',
                    product: 'Product',
                    search: 'Search',
                    'blog-list': 'Blog List',
                    'blog-post': 'Blog Post',
                    page: 'Static Page',
                    cart: 'Cart',
                    checkout: 'Checkout',
                    account: 'Account',
                };
                return (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Chip
                        label={typeLabels[params.value] || params.value}
                        size="small"
                        color="primary"
                        variant="outlined"
                    /></Box>
                );
            },
        },
        {
            field: 'slug',
            headerName: 'Slug',
            width: 150,
            renderCell: (params: GridRenderCellParams) => {
                if (!params.value) {
                    return <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Typography variant="caption" color="text.secondary">—</Typography></Box>;
                }
                return (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Chip
                        label={params.value}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                    /></Box>
                );
            },
        },
        {
            field: 'isDefault',
            headerName: 'Default',
            width: 100,
            align: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Tooltip title={params.value ? "Unset as Default" : "Set as Default"}>
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                        <IconButton onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDefault(params.row);
                        }}>
                            {params.value ? <StarIcon color="warning" fontSize="small" /> : <StarBorderIcon color="action" fontSize="small" />}
                        </IconButton>
                    </Box>
                </Tooltip>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Chip
                        label={params.value === 'published' ? 'Published' : 'Draft'}
                        size="small"
                        color={params.value === 'published' ? 'success' : 'default'}
                        variant="filled"
                    />
                </Box>
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="caption" color="text.secondary">
                        {new Date(params.value).toLocaleDateString()}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" justifyContent="start" alignItems="center" height="100%">
                    <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(params.row._id)} size="small" color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate">
                        <IconButton onClick={() => handleDuplicate(params.row._id)} size="small" color="info">
                            <ContentCopyIcon fontSize="small" />
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



    if (layouts.length === 0 && !searchQuery && !filterType && !filterStatus) {
        return (
            <Box>
                <PageHeader title="Layouts" subtitle="Manage your Storefront layouts" actionLabel="Create Layout" onAction={handleCreate} />
                <EmptyState
                    message="No layouts found. Create your first layout!"
                    actionLabel="Create Layout"
                    onAction={handleCreate}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Layouts"
                subtitle="Manage your Storefront layouts"
                actionLabel="Create Layout"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search layouts..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                    {
                        id: 'store',
                        label: 'Store',
                        type: 'select',
                        options: stores.map(store => ({
                            value: store._id,
                            label: store.name
                        })),
                    },
                    {
                        id: 'type',
                        label: 'Type',
                        type: 'select',
                        options: [
                            { value: 'homepage', label: 'Homepage' },
                            { value: 'category', label: 'Category' },
                            { value: 'product', label: 'Product' },
                            { value: 'search', label: 'Search' },
                            { value: 'blog-list', label: 'Blog List' },
                            { value: 'blog-post', label: 'Blog Post' },
                            { value: 'page', label: 'Static Page' },
                            { value: 'cart', label: 'Cart' },
                            { value: 'checkout', label: 'Checkout' },
                            { value: 'account', label: 'Account' },
                        ],
                    },
                    {
                        id: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: 'published', label: 'Published' },
                            { value: 'draft', label: 'Draft' },
                        ],
                    },
                ]}
                activeFilters={{
                    type: filterType,
                    status: filterStatus
                }}
                onFilterChange={(filters) => {
                    setFilterType(filters.type as string || '');
                    setFilterStatus(filters.status as string || '');
                }}
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
                    rows={layouts}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50]}
                    paginationMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    loading={loading}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    rowHeight={70}
                />
            </Box>
        </Box>
    );
}
