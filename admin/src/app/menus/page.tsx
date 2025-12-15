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
import { createDataGridStyles } from '@/utils/styles';

export default function MenusPage() {
    const router = useRouter();
    const theme = useTheme();
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterLocation, setFilterLocation] = useState<string>('');

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            setLoading(true);
            const response = await api.get('/menus');
            setMenus(response.data.menus || []);
        } catch (err: any) {
            console.error('Failed to fetch menus', err);
            showNotification(err.response?.data?.message || 'Failed to load menus', 'error');
            setMenus([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this menu?')) return;
        try {
            await api.delete(`/menus/${id}`);
            setMenus(menus.filter(m => m._id !== id));
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

    const filteredRows = menus.filter((menu) => {
        const query = searchQuery.toLowerCase();

        // Search filter
        const matchesSearch = !searchQuery || (
            (menu.name && menu.name.toLowerCase().includes(query)) ||
            (menu.slug && menu.slug.toLowerCase().includes(query)) ||
            (menu.description && menu.description.toLowerCase().includes(query))
        );

        // Store filter
        const menuStoreId = typeof menu.storeId === 'object' && menu.storeId !== null
            ? menu.storeId._id
            : menu.storeId;
        const matchesStore = !filterStore || menuStoreId === filterStore;

        // Status filter
        const matchesStatus = !filterStatus || (
            filterStatus === 'active' ? menu.isActive : !menu.isActive
        );

        // Location filter
        const matchesLocation = !filterLocation || menu.location === filterLocation;

        return matchesSearch && matchesStore && matchesStatus && matchesLocation;
    });

    const columns: GridColDef[] = [
        {
            field: 'icon',
            headerName: '',
            width: 60,
            sortable: false,
            renderCell: () => (
                <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'info.light' }}>
                    <MenuIcon fontSize="small" color="info" />
                </Avatar>
            ),
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 180,
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
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
            ),
        },
        {
            field: 'location',
            headerName: 'Location',
            width: 140,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={getLocationLabel(params.value)}
                    size="small"
                    color={getLocationColor(params.value)}
                    variant="outlined"
                />
            ),
        },
        {
            field: 'settings',
            headerName: 'Style',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value?.style || 'horizontal'}
                    size="small"
                    variant="filled"
                    sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                />
            ),
        },
        {
            field: 'items',
            headerName: 'Items',
            width: 80,
            align: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Chip label={params.value?.length || 0} size="small" variant="outlined" />
            ),
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

    if (loading) return <LoadingSpinner message="Loading menus..." />;

    if (menus.length === 0 && !searchQuery && !filterStore && !filterStatus && !filterLocation) {
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

            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    rowHeight={60}
                />
            </Box>
        </Box>
    );
}
