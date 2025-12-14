'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            setLoading(true);
            const response = await api.get('/menus');
            setMenus(response.data.data || []);
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

    const filteredRows = menus.filter((menu) => {
        const query = searchQuery.toLowerCase();

        // Search filter
        const matchesSearch = !searchQuery || (
            (menu.name && menu.name.toLowerCase().includes(query)) ||
            (menu.slug && menu.slug.toLowerCase().includes(query))
        );

        // Status filter
        const matchesStatus = !filterStatus || (
            filterStatus === 'active' ? menu.isActive : !menu.isActive
        );

        return matchesSearch && matchesStatus;
    });

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Name',
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => handleEdit(params.row._id)}>
                        {params.row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{params.row.slug}</Typography>
                </Box>
            ),
        },
        {
            field: 'locations',
            headerName: 'Locations',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center" height="100%">
                    {params.value && params.value.length > 0 ? (
                        params.value.map((loc: string) => (
                            <Chip key={loc} label={loc} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        ))
                    ) : (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                </Box>
            ),
        },
        {
            field: 'items',
            headerName: 'Items',
            width: 100,
            align: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">{params.value?.length || 0}</Typography>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Active',
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

    if (menus.length === 0 && !searchQuery && !filterStatus) {
        return (
            <Box>
                <PageHeader title="Menus" subtitle="Manage navigation menus" actionLabel="Create Menu" onAction={handleCreate} />
                <EmptyState
                    message="No menus found. Create your first menu!"
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
                subtitle="Manage navigation menus"
                actionLabel="Create Menu"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search menus..."
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
                activeFilters={{
                    status: filterStatus
                }}
                onFilterChange={(filters) => {
                    setFilterStatus(filters.status as string || '');
                }}
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
                    rowHeight={60}
                />
            </Box>
        </Box>
    );
}
