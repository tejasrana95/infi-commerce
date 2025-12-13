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
import { createDataGridStyles } from '@/utils/styles';

interface Customer {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isActive: boolean;
    emailVerified: boolean;
    lastLogin?: string;
    createdAt: string;
}

export default function CustomersPage() {
    const router = useRouter();
    const theme = useTheme();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch customers');
            showNotification('Failed to load customers', 'error');
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            await api.delete(`/customers/${id}`);
            setCustomers(customers.filter(c => c._id !== id));
            showNotification('Customer deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/customers/${id}/edit`);
    };

    const handleCreate = () => {
        router.push('/customers/new');
    };

    const filteredRows = customers.filter((customer) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || (
            customer.email?.toLowerCase().includes(query) ||
            customer.firstName?.toLowerCase().includes(query) ||
            customer.lastName?.toLowerCase().includes(query) ||
            customer.phone?.toLowerCase().includes(query)
        );
        const matchesStatus = !filterStatus || (
            filterStatus === 'active' ? customer.isActive : !customer.isActive
        );
        return matchesSearch && matchesStatus;
    });

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

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Customer',
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
            field: 'phone',
            headerName: 'Phone',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">{params.value || '-'}</Typography>
            ),
        },
        {
            field: 'emailVerified',
            headerName: 'Verified',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value ? 'Yes' : 'No'}
                    size="small"
                    color={params.value ? 'success' : 'default'}
                    variant="outlined"
                />
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => <StatusChip active={params.value as boolean} />,
        },
        {
            field: 'lastLogin',
            headerName: 'Last Login',
            width: 130,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2" color={params.value ? 'text.primary' : 'text.secondary'}>
                    {formatLastLogin(params.value)}
                </Typography>
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Registered',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="caption">{new Date(params.value).toLocaleDateString()}</Typography>
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
                    <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(params.row._id)} size="small" color="error">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    if (loading) return <LoadingSpinner message="Loading customers..." />;

    return (
        <Box>
            <PageHeader
                title="Customers"
                subtitle="Manage customer accounts"
                actionLabel="Add Customer"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search by name, email or phone..."
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
            />

            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 25 } },
                        sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
                    }}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    rowHeight={60}
                />
            </Box>
        </Box>
    );
}
