'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Avatar } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '@/lib/api';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { PageHeader, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

export default function OrdersPage() {
    const router = useRouter();
    const theme = useTheme();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders');
            setOrders(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch orders');
            showNotification('Failed to load orders', 'error');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (id: string) => {
        router.push(`/orders/${id}`);
    };

    const handleCreate = () => {
        router.push('/orders/new');
    };

    const filteredRows = orders.filter((order) => {
        const query = searchQuery.toLowerCase();

        // Search filter (order number, customer name/email)
        const matchesSearch = !searchQuery || (
            order.orderNumber?.toLowerCase().includes(query) ||
            order.guestEmail?.toLowerCase().includes(query) ||
            // @ts-ignore - populated field
            order.userId?.firstName?.toLowerCase().includes(query) ||
            // @ts-ignore - populated field
            order.userId?.lastName?.toLowerCase().includes(query) ||
            // @ts-ignore - populated field
            order.userId?.email?.toLowerCase().includes(query)
        );

        // Order status filter
        const matchesStatus = !filterStatus || order.status === filterStatus;

        // Payment status filter
        const matchesPaymentStatus = !filterPaymentStatus || order.paymentStatus === filterPaymentStatus;

        return matchesSearch && matchesStatus && matchesPaymentStatus;
    });

    const getStatusColor = (status: OrderStatus): 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default' => {
        switch (status) {
            case 'pending': return 'warning';
            case 'processing': return 'info';
            case 'shipped': return 'primary';
            case 'delivered': return 'success';
            case 'cancelled': return 'error';
            case 'refunded': return 'default';
            default: return 'default';
        }
    };

    const getPaymentStatusColor = (status: PaymentStatus): 'success' | 'warning' | 'error' | 'info' | 'default' => {
        switch (status) {
            case 'paid': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'error';
            case 'refunded': return 'info';
            default: return 'default';
        }
    };

    const getCustomerName = (order: Order): string => {
        if (order.customerId && typeof order.customerId === 'object') {
            // @ts-ignore - populated field
            return `${order.customerId.firstName || ''} ${order.customerId.lastName || ''}`.trim() || 'Unknown';
        }
        return order.guestEmail ? 'Guest' : 'Unknown';
    };

    const getCustomerEmail = (order: Order): string => {
        if (order.customerId && typeof order.customerId === 'object') {
            // @ts-ignore - populated field
            return order.customerId.email || '';
        }
        return order.guestEmail || '';
    };

    const formatCurrency = (amount: number, currency: string): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    const columns: GridColDef[] = [
        {
            field: 'orderNumber',
            headerName: 'Order #',
            width: 180,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2" fontWeight={600}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Date',
            width: 160,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">
                        {new Date(params.value).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(params.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'customer',
            headerName: 'Customer',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={500}>
                        {getCustomerName(params.row)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {getCustomerEmail(params.row)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'total',
            headerName: 'Total',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(params.row.total, params.row.currency)}
                </Typography>
            ),
        },
        {
            field: 'paymentStatus',
            headerName: 'Payment',
            width: 130,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" gap={0.5}>
                    <Chip
                        label={params.value}
                        size="small"
                        color={getPaymentStatusColor(params.value)}
                        variant="outlined"
                        sx={{ textTransform: 'capitalize', height: 22 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {params.row.paymentMethod}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={getStatusColor(params.value)}
                    sx={{ textTransform: 'capitalize' }}
                />
            ),
        },
        {
            field: 'items',
            headerName: 'Items',
            width: 80,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">
                    {params.value?.length || 0}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <Tooltip title="View Order">
                        <IconButton onClick={() => handleView(params.row._id)} size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    if (loading) return <LoadingSpinner message="Loading orders..." />;

    return (
        <Box>
            <PageHeader
                title="Orders"
                subtitle="Manage customer orders"
                actionLabel="Create Order"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search by order #, customer name or email..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                    {
                        id: 'status',
                        label: 'Order Status',
                        type: 'select',
                        options: [
                            { value: 'pending', label: 'Pending' },
                            { value: 'processing', label: 'Processing' },
                            { value: 'shipped', label: 'Shipped' },
                            { value: 'delivered', label: 'Delivered' },
                            { value: 'cancelled', label: 'Cancelled' },
                            { value: 'refunded', label: 'Refunded' },
                        ],
                    },
                    {
                        id: 'paymentStatus',
                        label: 'Payment Status',
                        type: 'select',
                        options: [
                            { value: 'pending', label: 'Pending' },
                            { value: 'paid', label: 'Paid' },
                            { value: 'failed', label: 'Failed' },
                            { value: 'refunded', label: 'Refunded' },
                        ],
                    },
                ]}
                activeFilters={{
                    status: filterStatus,
                    paymentStatus: filterPaymentStatus,
                }}
                onFilterChange={(filters) => {
                    setFilterStatus(filters.status as string || '');
                    setFilterPaymentStatus(filters.paymentStatus as string || '');
                }}
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
                    rowHeight={70}
                />
            </Box>
        </Box>
    );
}
