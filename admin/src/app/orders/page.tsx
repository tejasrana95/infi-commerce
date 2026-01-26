'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Tooltip, IconButton, Typography, useTheme, Chip,
    FormControl, InputLabel, Select, MenuItem, TextField, Stack,
    Button, Popover
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import api from '@/lib/api';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { PageHeader, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';
import { useCurrency } from '@/contexts/CurrencyContext';

const DATE_RANGE_OPTIONS = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'custom', label: 'Custom Range' },
];

export default function OrdersPage() {
    const router = useRouter();
    const theme = useTheme();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);
    const { convertAndFormat } = useCurrency();

    // Pagination state
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 25,
    });
    const [totalRows, setTotalRows] = useState(0);

    // Sort state
    const [sortModel, setSortModel] = useState<GridSortModel>([
        { field: 'createdAt', sort: 'desc' }
    ]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
    const [dateRange, setDateRange] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [filterChannel, setFilterChannel] = useState<string>('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch orders with server-side filtering
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(paginationModel.page + 1));
            params.append('limit', String(paginationModel.pageSize));

            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filterStatus) params.append('status', filterStatus);
            if (filterPaymentStatus) params.append('paymentStatus', filterPaymentStatus);
            if (dateRange) params.append('dateRange', dateRange);
            if (dateRange === 'custom') {
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
            }
            if (filterChannel) params.append('channel', filterChannel);
            if (sortModel.length > 0) {
                params.append('sortBy', sortModel[0].field);
                params.append('sortOrder', sortModel[0].sort || 'desc');
            }

            const response = await api.get(`/orders?${params.toString()}`);
            setOrders(response.data.data || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (err) {
            console.error('Failed to fetch orders');
            showNotification('Failed to load orders', 'error');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [paginationModel, debouncedSearch, filterStatus, filterPaymentStatus, dateRange, startDate, endDate, filterChannel, sortModel, showNotification]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleView = (id: string) => {
        router.push(`/orders/${id}`);
    };

    const handleCreate = () => {
        router.push('/orders/new');
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilterStatus('');
        setFilterPaymentStatus('');
        setDateRange('');
        setStartDate('');
        setEndDate('');
    };

    const getStatusColor = (status: OrderStatus): 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default' => {
        switch (status) {
            case 'pending': return 'warning';
            case 'processing': return 'info';
            case 'shipped': return 'primary';
            case 'delivered': return 'success';
            case 'cancelled': return 'error';
            case 'refunded': return 'default';
            case 'returned': return 'warning';
            case 'partially_returned': return 'warning';
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
            const customer = order.customerId as { firstName: string; lastName: string };
            return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';
        }
        return order.guestEmail ? 'Guest' : order.isPOSOrder ? 'Walk-in Customer' : 'Unknown';
    };

    const getCustomerEmail = (order: Order): string => {
        if (order.customerId && typeof order.customerId === 'object') {
            const customer = order.customerId as { email: string };
            return customer.email || '';
        }
        return order.guestEmail || '';
    };

    const columns: GridColDef[] = [
        {
            field: 'orderNumber',
            headerName: 'Order #',
            minWidth: 150,
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>
                        {params.value}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Date',
            minWidth: 140,
            flex: 1,
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
            field: 'channel',
            headerName: 'Channel',

            minWidth: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={500}>
                        {params.row?.isPOSOrder ? 'POS' : 'Web'}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'customer',
            headerName: 'Customer',
            flex: 1,
            minWidth: 200,
            sortable: false,
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
            minWidth: 100,
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>
                        {convertAndFormat(params.row.total, params.row.currency)}
                    </Typography>
                </Box>
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
                <Box display="flex" flexDirection="column" gap={0.5}>
                    <Chip
                        label={params?.value?.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(params.value)}
                        sx={{ textTransform: 'capitalize' }}
                    />
                    {params.row.refundStatus === 'requested' && (
                        <Chip
                            label="Refund Requested"
                            size="small"
                            color="error"
                            variant="filled"
                            sx={{
                                fontSize: '0.65rem',
                                height: 18,
                                fontWeight: 700,
                                textTransform: 'uppercase'
                            }}
                        />
                    )}
                </Box>
            ),
        },
        {
            field: 'items',
            headerName: 'Items',
            width: 80,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                    <Typography variant="body2">
                        {params.value?.length || 0}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Tooltip title="View Order">
                        <IconButton onClick={() => handleView(params.row._id)} size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    const hasActiveFilters = filterStatus || filterPaymentStatus || dateRange || debouncedSearch;

    return (
        <Box>
            <PageHeader
                title="Orders"
                subtitle="Manage customer orders"
                actionLabel="Create Order"
                onAction={handleCreate}
            />

            {/* Search and Filters */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
                    {/* Search */}
                    <TextField
                        size="small"
                        placeholder="Search by order #, customer name, email, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 320 }}
                    />

                    {/* Order Status */}
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filterStatus}
                            label="Status"
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="processing">Processing</MenuItem>
                            <MenuItem value="shipped">Shipped</MenuItem>
                            <MenuItem value="delivered">Delivered</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                            <MenuItem value="refunded">Refunded</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Payment Status */}
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Payment</InputLabel>
                        <Select
                            value={filterPaymentStatus}
                            label="Payment"
                            onChange={(e) => setFilterPaymentStatus(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="paid">Paid</MenuItem>
                            <MenuItem value="failed">Failed</MenuItem>
                            <MenuItem value="refunded">Refunded</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Payment Status */}
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Channel</InputLabel>
                        <Select
                            value={filterChannel}
                            label="Channel"
                            onChange={(e) => setFilterChannel(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="web">Web</MenuItem>
                            <MenuItem value="pos">POS</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Date Range */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Date Range</InputLabel>
                        <Select
                            value={dateRange}
                            label="Date Range"
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            {DATE_RANGE_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Custom Date Range */}
                    {dateRange === 'custom' && (
                        <>
                            <TextField
                                size="small"
                                type="date"
                                label="Start Date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 150 }}
                            />
                            <TextField
                                size="small"
                                type="date"
                                label="End Date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 150 }}
                            />
                        </>
                    )}

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleClearFilters}
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            Clear Filters
                        </Button>
                    )}
                </Stack>
            </Box>

            <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
                <DataGrid
                    rows={orders}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    paginationMode="server"
                    sortingMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    sortModel={sortModel}
                    onSortModelChange={setSortModel}
                    pageSizeOptions={[10, 25, 50, 100]}
                    onRowClick={(params) => handleView(params.row._id)}
                    sx={{
                        ...dataGridStyles,
                        '& .MuiDataGrid-main': {
                            overflowX: 'auto',
                        },
                    }}
                    rowHeight={70}
                />
            </Box>
        </Box>
    );
}
