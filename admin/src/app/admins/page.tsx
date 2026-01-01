'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { PageHeader, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';

interface AdminUser {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'admin' | 'store_admin' | 'super_admin';
    storeId?: { _id: string; name: string };
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
}

export default function AdminsPage() {
    const router = useRouter();
    const theme = useTheme();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

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
        fetchAdmins();
    }, [paginationModel, debouncedSearch, filterRole, filterStatus]);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(paginationModel.page + 1));
            params.append('limit', String(paginationModel.pageSize));
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filterRole) params.append('role', filterRole);
            if (filterStatus) params.append('status', filterStatus);

            const response = await api.get(`/admins?${params.toString()}`);
            setAdmins(response.data.data || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (err) {
            console.error('Failed to fetch admins');
            showNotification('Failed to load admin users', 'error');
            setAdmins([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Admin', message: 'Are you sure you want to delete this admin user?', severity: 'error' })) return;
        try {
            await api.delete(`/admins/${id}`);
            setAdmins(admins.filter(a => a._id !== id));
            showNotification('Admin deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/admins/${id}/edit`);
    };

    const handleCreate = () => {
        router.push('/admins/new');
    };



    const formatLastLogin = (date?: string) => {
        if (!date) return 'Never';
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return d.toLocaleDateString();
    };

    const getRoleColor = (role: string): 'error' | 'primary' | 'secondary' | 'default' => {
        switch (role) {
            case 'super_admin': return 'error';
            case 'admin': return 'primary';
            case 'store_admin': return 'secondary';
            default: return 'default';
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Admin User',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>
                        {params.row.firstName} {params.row.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{params.row.email}</Typography>
                </Box>
            ),
        },
        {
            field: 'role',
            headerName: 'Role',
            width: 130,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Chip
                        label={params.value?.replace('_', ' ')}
                        size="small"
                        color={getRoleColor(params.value)}
                        sx={{ textTransform: 'capitalize' }}
                    />
                </Box>
            ),
        },
        {
            field: 'storeId',
            headerName: 'Store',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">
                        {params.row.storeIds?.length > 0 ? params.row.storeIds[0].name : '-'}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <StatusChip active={params.value as boolean} />
                </Box>
            ),
        },
        {
            field: 'lastLogin',
            headerName: 'Last Login',
            width: 130,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" color={params.value ? 'text.primary' : 'text.secondary'}>
                        {formatLastLogin(params.value)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="caption">{new Date(params.value).toLocaleDateString()}</Typography>
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" justifyContent="start" alignItems="center" height="100%">
                    <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(params.row._id)} size="small" color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {params.row.role !== 'super_admin' && (
                        <Tooltip title="Delete">
                            <IconButton onClick={() => handleDelete(params.row._id)} size="small" color="error">
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            ),
        },
    ];

    if (loading) return <LoadingSpinner message="Loading admin users..." />;

    return (
        <Box>
            <PageHeader
                title="Admin Users"
                subtitle="Manage admin accounts"
                actionLabel="Add Admin"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search by name or email..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                    {
                        id: 'role',
                        label: 'Role',
                        type: 'select',
                        options: [
                            { value: 'super_admin', label: 'Super Admin' },
                            { value: 'admin', label: 'Admin' },
                            { value: 'store_admin', label: 'Store Admin' },
                        ],
                    },
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
                activeFilters={{ role: filterRole, status: filterStatus }}
                onFilterChange={(filters) => {
                    setFilterRole(filters.role as string || '');
                    setFilterStatus(filters.status as string || '');
                }}
            />

            <Box sx={{ width: '100%' }}>
                <DataGrid
                    rows={admins}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50, 100]}
                    paginationMode="server"
                    rowCount={totalRows}
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
