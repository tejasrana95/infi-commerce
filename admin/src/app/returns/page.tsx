'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Tooltip, IconButton, Typography, useTheme, Chip,
    FormControl, InputLabel, Select, MenuItem, TextField, Stack,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '@/lib/api';
import { PageHeader } from '@/components/molecules';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';
import { useCurrency } from '@/contexts/CurrencyContext';

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'pickup_scheduled' | 'items_received' | 'refund_processed' | 'exchange_shipped' | 'completed' | 'cancelled';
type ReturnType = 'return' | 'exchange';

interface ReturnRequest {
    _id: string;
    returnNumber: string;
    orderId: {
        _id: string;
        orderNumber: string;
    };
    customerId?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    storeId: string;
    type: ReturnType;
    status: ReturnStatus;
    reason: string;
    items: Array<{
        productId: string;
        variantId?: string;
        name: string;
        sku: string;
        quantity: number;
        refundAmount: number;
    }>;
    totalRefundAmount: number;
    refundMethod?: 'original' | 'bank_transfer';
    createdAt: string;
    updatedAt: string;
}

const DATE_RANGE_OPTIONS = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'custom', label: 'Custom Range' },
];

export default function ReturnsPage() {
    const router = useRouter();
    const theme = useTheme();
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);
    const { formatPrice } = useCurrency();

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
    const [filterType, setFilterType] = useState<string>('');
    const [dateRange, setDateRange] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Action modal state
    const [actionModal, setActionModal] = useState<{
        open: boolean;
        action: 'approve' | 'reject' | null;
        returnId: string;
        returnNumber: string;
    }>({
        open: false,
        action: null,
        returnId: '',
        returnNumber: '',
    });
    const [actionReason, setActionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch returns with server-side filtering
    const fetchReturns = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(paginationModel.page + 1));
            params.append('limit', String(paginationModel.pageSize));

            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filterStatus) params.append('status', filterStatus);
            if (filterType) params.append('type', filterType);
            if (dateRange) params.append('dateRange', dateRange);
            if (dateRange === 'custom') {
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
            }
            if (sortModel.length > 0) {
                params.append('sortBy', sortModel[0].field);
                params.append('sortOrder', sortModel[0].sort || 'desc');
            }

            const response = await api.get(`/returns/?${params.toString()}`);
            setReturns(response.data.data || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (err) {
            console.error('Failed to fetch returns', err);
            showNotification('Failed to load returns', 'error');
            setReturns([]);
        } finally {
            setLoading(false);
        }
    }, [paginationModel, debouncedSearch, filterStatus, filterType, dateRange, startDate, endDate, sortModel, showNotification]);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const handleView = (id: string) => {
        router.push(`/returns/${id}`);
    };

    const handleViewOrder = (orderId: string) => {
        router.push(`/orders/${orderId}`);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilterStatus('');
        setFilterType('');
        setDateRange('');
        setStartDate('');
        setEndDate('');
    };

    const handleAction = (action: 'approve' | 'reject', returnId: string, returnNumber: string) => {
        setActionModal({
            open: true,
            action,
            returnId,
            returnNumber,
        });
        setActionReason('');
    };

    const handleConfirmAction = async () => {
        if (!actionModal.action || !actionModal.returnId) return;

        setProcessing(true);
        try {
            const endpoint = actionModal.action === 'approve'
                ? `/returns/${actionModal.returnId}/approve`
                : `/returns/${actionModal.returnId}/reject`;

            await api.patch(endpoint, {
                adminNotes: actionReason,
            });

            showNotification(
                `Return ${actionModal.action === 'approve' ? 'approved' : 'rejected'} successfully`,
                'success'
            );
            fetchReturns();
        } catch (err: any) {
            showNotification(
                err.response?.data?.message || `Failed to ${actionModal.action} return`,
                'error'
            );
        } finally {
            setProcessing(false);
            setActionModal({ open: false, action: null, returnId: '', returnNumber: '' });
        }
    };

    const getStatusColor = (status: ReturnStatus): 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default' => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'info';
            case 'rejected': return 'error';
            case 'pickup_scheduled': return 'info';
            case 'items_received': return 'primary';
            case 'refund_processed': return 'success';
            case 'exchange_shipped': return 'primary';
            case 'completed': return 'success';
            case 'cancelled': return 'default';
            default: return 'default';
        }
    };

    const getTypeColor = (type: ReturnType): 'primary' | 'secondary' => {
        return type === 'return' ? 'primary' : 'secondary';
    };

    const columns: GridColDef[] = [
        {
            field: 'requestNumber',
            headerName: 'Return #',
            minWidth: 140,
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
            field: 'orderId',
            headerName: 'Order #',
            minWidth: 140,
            flex: 1,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography
                        variant="body2"
                        sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrder(params.value?._id);
                        }}
                    >
                        {params.value?.orderNumber || '-'}
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
            field: 'customerId',
            headerName: 'Customer',
            flex: 1,
            minWidth: 180,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={500}>
                        {params.value?.firstName} {params.value?.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.value?.email || 'Guest'}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
                    <Chip
                        label={params.value}
                        size="small"
                        color={getTypeColor(params.value)}
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                    />
                </Box>
            ),
        },
        {
            field: 'items',
            headerName: 'Items',
            width: 80,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography variant="body2">
                        {params.value?.length || 0}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'totalRefundAmount',
            headerName: 'Refund',
            minWidth: 100,
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>
                        {formatPrice(params.value)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
                    <Chip
                        label={params.value?.replace(/_/g, ' ')}
                        size="small"
                        color={getStatusColor(params.value)}
                        sx={{ textTransform: 'capitalize' }}
                    />
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" gap={0.5} alignItems="center" height="100%">
                    <Tooltip title="View Details">
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                handleView(params.row._id);
                            }}
                            size="small"
                            color="primary"
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {params.row.status === 'pending' && (
                        <>
                            <Tooltip title="Approve">
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction('approve', params.row._id, params.row.returnNumber);
                                    }}
                                    size="small"
                                    color="success"
                                >
                                    <CheckCircleIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction('reject', params.row._id, params.row.returnNumber);
                                    }}
                                    size="small"
                                    color="error"
                                >
                                    <CancelIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            ),
        },
    ];

    const hasActiveFilters = filterStatus || filterType || dateRange || debouncedSearch;

    return (
        <Box>
            <PageHeader
                title="Returns & Exchanges"
                subtitle="Manage customer return and exchange requests"
            />

            {/* Search and Filters */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
                    {/* Search */}
                    <TextField
                        size="small"
                        placeholder="Search by return #, order #, customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 300 }}
                    />

                    {/* Status */}
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filterStatus}
                            label="Status"
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                            <MenuItem value="pickup_scheduled">Pickup Scheduled</MenuItem>
                            <MenuItem value="items_received">Items Received</MenuItem>
                            <MenuItem value="refund_processed">Refund Processed</MenuItem>
                            <MenuItem value="exchange_shipped">Exchange Shipped</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Type */}
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={filterType}
                            label="Type"
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="return">Return</MenuItem>
                            <MenuItem value="exchange">Exchange</MenuItem>
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
                    rows={returns}
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

            {/* Approve/Reject Modal */}
            <Dialog
                open={actionModal.open}
                onClose={() => setActionModal({ open: false, action: null, returnId: '', returnNumber: '' })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {actionModal.action === 'approve' ? 'Approve Return' : 'Reject Return'}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {actionModal.action === 'approve'
                            ? `Are you sure you want to approve return ${actionModal.returnNumber}?`
                            : `Are you sure you want to reject return ${actionModal.returnNumber}?`}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={actionModal.action === 'approve' ? 'Notes (optional)' : 'Reason for rejection'}
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder={actionModal.action === 'reject' ? 'Please provide a reason...' : ''}
                        required={actionModal.action === 'reject'}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setActionModal({ open: false, action: null, returnId: '', returnNumber: '' })}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color={actionModal.action === 'approve' ? 'success' : 'error'}
                        onClick={handleConfirmAction}
                        disabled={processing || (actionModal.action === 'reject' && !actionReason.trim())}
                    >
                        {processing ? 'Processing...' : actionModal.action === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
