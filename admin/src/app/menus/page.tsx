'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Avatar } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import api from '@/lib/api';
import { Menu } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';
import { useDebounce } from '@/hooks/useDebounce';

export default function MenusPage() {
    const router = useRouter();
    const theme = useTheme();
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Pagination & Filter states
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [totalRows, setTotalRows] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterLocation, setFilterLocation] = useState<string>('');

    const debouncedSearch = useDebounce(searchQuery, 500);

    useEffect(() => {
        fetchMenus();
    }, [paginationModel, debouncedSearch, filterStore, filterLocation, filterStatus]);

    const fetchMenus = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debouncedSearch,
                storeId: filterStore,
                location: filterLocation,
            };

            if (filterStatus) {
                params.isActive = filterStatus === 'active';
            }

            const response = await api.get('/menus', { params });
            setMenus(response.data.menus || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (err: any) {
            console.error('Failed to fetch menus', err);
            showNotification(err.response?.data?.message || 'Failed to load menus', 'error');
            setMenus([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Menu', message: 'Are you sure you want to delete this menu?', severity: 'error' })) return;
        try {
            await api.delete(`/menus/${id}`);
            fetchMenus(); // Re-fetch to update list
            showNotification('Menu deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete menu', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/menus/${id}`);
    };

    const handleCreate = () => {
        router.push('/menus/new');
    };

    const getStoreName = (storeId: any) => {
        if (typeof storeId === 'object' && storeId !== null) {
            return storeId.name;
        }
        return '-';
    };

    const getLocationLabel = (location: string) => {
        const labels: Record<string, string> = {
            'header': 'Header',
            'footer': 'Footer',
            'sidebar': 'Sidebar',
            'mobile': 'Mobile',
            'custom': 'Custom',
        };
        return labels[location] || location;
    };

    const getLocationColor = (location: string) => {
        const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'default'> = {
            'header': 'primary',
            'footer': 'success',
            'sidebar': 'info',
            'mobile': 'warning',
            'custom': 'default',
        };
        return colors[location] || 'default';
    };

    const columns: GridColDef[] = [
        {
            field: 'icon',
            headerName: '',
            width: 60,
            sortable: false,
            display: 'flex',
            renderCell: () => (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                    <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'info.light' }}>
                        <MenuIcon fontSize="small" color="info" />
                    </Avatar>
                </Box>
            ),
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 180,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
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
            width: 140,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
                    <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'location',
            headerName: 'Location',
            width: 140,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
                    <Chip
                        label={getLocationLabel(params.value)}
                        size="small"
                        color={getLocationColor(params.value)}
                        variant="outlined"
                    />
                </Box>
            ),
        },
        {
            field: 'settings',
            headerName: 'Style',
            width: 100,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
                    <Chip
                        label={params.value?.style || 'horizontal'}
                        size="small"
                        variant="filled"
                        sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                    />
                </Box>
            ),
        },
        {
            field: 'items',
            headerName: 'Items',
            width: 80,
            align: 'center',
            headerAlign: 'center',
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                    <Chip label={params.value?.length || 0} size="small" variant="outlined" />
                </Box>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
                    <StatusChip active={params.value as boolean} />
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
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

    if (!loading && menus.length === 0 && !searchQuery && !filterStore && !filterStatus && !filterLocation) {
        return (
            <Box>
                <PageHeader title="Menus" subtitle="Manage navigation menus for header, footer, sidebar" actionLabel="Create Menu" onAction={handleCreate} />
                <EmptyState
                    message="No menus found. Create your first navigation menu!"
                    actionLabel="Create Menu"
                    onAction={handleCreate}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Menus"
                subtitle="Manage navigation menus for header, footer, sidebar"
                actionLabel="Create Menu"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search menus by name, slug or description..."
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
                    {
                        id: 'location',
                        label: 'Location',
                        type: 'select',
                        options: [
                            { value: 'header', label: 'Header' },
                            { value: 'footer', label: 'Footer' },
                            { value: 'sidebar', label: 'Sidebar' },
                            { value: 'mobile', label: 'Mobile' },
                            { value: 'custom', label: 'Custom' },
                        ],
                    },
                ]}
                activeFilters={{ status: filterStatus, location: filterLocation }}
                onFilterChange={(filters) => {
                    setFilterStatus(filters.status as string || '');
                    setFilterLocation(filters.location as string || '');
                }}
                showStoreFilter
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
                    rows={menus}
                    columns={columns}
                    getRowId={(row) => row._id}
                    paginationMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 20, 50]}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    rowHeight={60}
                    loading={loading}
                />
            </Box>
        </Box>
    );
}
