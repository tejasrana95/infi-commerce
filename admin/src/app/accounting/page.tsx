'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    ButtonGroup,
    Chip,
    CircularProgress,
    Alert,
    TextField,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
} from '@mui/x-data-grid';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import api from '@/lib/api';
import {
    PLReport,
    OrderWithAccounting,
    DateRangePreset,
} from '@/types/accounting';
import { useNotification } from '@/contexts/NotificationContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';

interface Store {
    _id: string;
    name: string;
    currency: string;
}

const DATE_PRESETS: { label: string; value: DateRangePreset }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last_7_days' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Last 30 Days', value: 'last_30_days' },
    { label: 'Last 90 Days', value: 'last_90_days' },
];

function AccountingDashboardContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { showNotification } = useNotification();
    const { formatPrice } = useCurrency();

    // URL State
    const selectedStore = searchParams.get('storeId') || '';
    const datePreset = (searchParams.get('preset') as DateRangePreset) || 'last_30_days';
    const customStartDate = searchParams.get('startDate') || '';
    const customEndDate = searchParams.get('endDate') || '';

    // Pagination from URL
    const page = parseInt(searchParams.get('page') || '0', 10);
    const pageSize = parseInt(searchParams.get('limit') || '20', 10);

    // Local UI State
    const [stores, setStores] = useState<Store[]>([]);
    const [showCustomDates, setShowCustomDates] = useState(datePreset === 'custom');

    // Data State
    const [report, setReport] = useState<PLReport | null>(null);
    const [orders, setOrders] = useState<OrderWithAccounting[]>([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await api.get('/stores');
                const storeData = response.data.stores || response.data.data || [];
                setStores(storeData);
            } catch (error) {
                console.error('Failed to fetch stores:', error);
                setStores([]);
            }
        };

        fetchStores();
    }, []);

    // Helper to update URL params
    const updateParams = useCallback(
        (updates: Record<string, string | number | null>) => {
            const params = new URLSearchParams(searchParams.toString());

            Object.entries(updates).forEach(([key, value]) => {
                if (value === null) {
                    params.delete(key);
                } else {
                    params.set(key, String(value));
                }
            });

            router.push(`${pathname}?${params.toString()}`);
        },
        [pathname, router, searchParams]
    );

    const fetchReport = useCallback(async () => {
        if (!selectedStore) return;

        try {
            setLoading(true);
            const params: Record<string, string | number> = {
                storeId: selectedStore,
                preset: datePreset,
            };

            if (datePreset === 'custom' && customStartDate && customEndDate) {
                params.startDate = customStartDate;
                params.endDate = customEndDate;
            }

            const response = await api.get('/accounting/reports/summary', { params });
            if (response.data.success) {
                setReport(response.data.data);
            }
        } catch (error: any) {
            showNotification(
                error.response?.data?.message || 'Failed to load report',
                'error'
            );
        } finally {
            setLoading(false);
        }
    }, [selectedStore, datePreset, customStartDate, customEndDate, showNotification]);

    const fetchOrders = useCallback(async () => {
        if (!selectedStore) return;

        try {
            const params: Record<string, string | number> = {
                storeId: selectedStore,
                preset: datePreset,
                page: page + 1, // API is 1-indexed
                limit: pageSize,
            };

            if (datePreset === 'custom' && customStartDate && customEndDate) {
                params.startDate = customStartDate;
                params.endDate = customEndDate;
            }

            const response = await api.get('/accounting/reports/orders', { params });
            if (response.data.success) {
                setOrders(response.data.data.orders);
                setTotalOrders(response.data.data.total);
            }
        } catch (error: any) {
            showNotification(
                error.response?.data?.message || 'Failed to load orders',
                'error'
            );
        }
    }, [
        selectedStore,
        datePreset,
        page,
        pageSize,
        customStartDate,
        customEndDate,
        showNotification,
    ]);

    // Fetch report when store or date changes
    useEffect(() => {
        if (selectedStore) {
            fetchReport();
            fetchOrders();
        }
    }, [fetchReport, fetchOrders, selectedStore]);

    // Sync showCustomDates with preset
    useEffect(() => {
        setShowCustomDates(datePreset === 'custom');
    }, [datePreset]);

    const handleExport = async () => {
        if (!selectedStore) return;

        try {
            setExporting(true);
            const params: Record<string, string | number> = {
                storeId: selectedStore,
                preset: datePreset,
            };

            if (datePreset === 'custom' && customStartDate && customEndDate) {
                params.startDate = customStartDate;
                params.endDate = customEndDate;
            }

            const response = await api.get('/accounting/reports/export', {
                params,
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `accounting-report-${new Date().toISOString().split('T')[0]}.csv`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showNotification('Report exported successfully', 'success');
        } catch (error) {
            showNotification('Failed to export report', 'error');
        } finally {
            setExporting(false);
        }
    };

    const selectedStoreData = stores.find((s) => s._id === selectedStore);
    const currencyCode =
        selectedStoreData?.currency || report?.summary?.currency || 'USD';

    const handlePresetChange = (preset: DateRangePreset) => {
        updateParams({
            preset,
            startDate: null,
            endDate: null,
            page: 0, // Reset to first page
        });
    };

    const handleCustomDateApply = (start: string, end: string) => {
        if (start && end) {
            updateParams({
                preset: 'custom',
                startDate: start,
                endDate: end,
                page: 0,
            });
        }
    };

    // DataGrid Columns
    const columns: GridColDef[] = [
        {
            field: 'orderNumber',
            headerName: 'Order #',
            minWidth: 100,
            flex: 1,
            valueGetter: (value, row) =>
                row.orderId?.orderNumber || 'N/A',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%"> <Typography variant="body2">{params.value}</Typography></Box>
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Date',
            minWidth: 100,
            flex: 1,
            valueGetter: (value, row) =>
                row.orderId?.createdAt
                    ? new Date(row.orderId.createdAt).toLocaleDateString()
                    : 'N/A',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%"> <Typography variant="body2">{params.value}</Typography></Box>
            ),
        },
        {
            field: 'customer',
            headerName: 'Customer',
            minWidth: 150,
            flex: 1.5,
            valueGetter: (value, row) => {
                const orderData = row.orderId;
                return orderData?.customerId
                    ? `${orderData.customerId.firstName} ${orderData.customerId.lastName}`
                    : orderData?.guestEmail || 'Guest';
            },
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%"> <Typography variant="body2">{params.value}</Typography></Box>
            ),
        },
        {
            field: 'revenue',
            headerName: 'Revenue',
            width: 150,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params: GridRenderCellParams) =>
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%"> <Typography variant="body2">{formatPrice(params.row?.revenue, currencyCode)}</Typography></Box>,
        },
        {
            field: 'returns',
            headerName: 'Returns',
            width: 120,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%"> 
                    {params.row.returns > 0 ? (
                        <Typography variant="body2" color="warning.main">
                            -{formatPrice(params.row?.returns, currencyCode)}
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                </Box>
            ),
        },
        {
            field: 'adjustedRevenue',
            headerName: 'Adj. Revenue',
            width: 120,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params: GridRenderCellParams) =>
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%"> <Typography variant="body2" fontWeight={600}>{formatPrice(params.row?.adjustedRevenue, currencyCode)}</Typography></Box>,
        },
        {
            field: 'cogs',
            headerName: 'COGS',
            width: 150,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">  <Typography variant="body2" color="warning.main">
                    {formatPrice(params.row?.cogs, currencyCode)}
                </Typography></Box>
            ),
        },
        {
            field: 'expenses',
            headerName: 'Expenses',
            width: 150,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%"> <Typography variant="body2" color="error.main">
                    {formatPrice(params.row?.expenses, currencyCode)}
                </Typography></Box>
            ),
        },
        {
            field: 'netProfit',
            headerName: 'Net Profit',
            width: 150,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%"> <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={
                        params.row.netProfit >= 0 ? 'success.main' : 'error.main'
                    }
                >
                    {formatPrice(params.row?.netProfit, currencyCode)}
                </Typography></Box>
            ),
        },
        {
            field: 'profitMargin',
            headerName: 'Margin',
            width: 100,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">  <Typography
                    variant="body2"
                    color={
                        params.row.profitMargin >= 0
                            ? 'success.main'
                            : 'error.main'
                    }
                >
                    {params.row.profitMargin?.toFixed(1)}%
                </Typography></Box>
            ),
        },
        {
            field: 'isComplete',
            headerName: 'Status',
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">  <Chip
                    label={params.row.isComplete ? 'Complete' : 'Pending'}
                    color={params.row.isComplete ? 'success' : 'warning'}
                    size="small"
                /></Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">  <Tooltip title="View Order">
                    <IconButton
                        size="small"
                        onClick={() =>
                            router.push(
                                `/orders/${params.row.orderId?._id || params.row.orderId
                                }`
                            )
                        }
                    >
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Tooltip></Box>
            ),
        },
    ];

    const [tempStartDate, setTempStartDate] = useState(customStartDate);
    const [tempEndDate, setTempEndDate] = useState(customEndDate);
    const [regenerating, setRegenerating] = useState(false);

    // Sync temp state with url state
    useEffect(() => {
        setTempStartDate(customStartDate);
        setTempEndDate(customEndDate);
    }, [customStartDate, customEndDate]);

    const handleRegenerateAccountingData = async () => {
        if (!selectedStore || orders.length === 0) {
            showNotification('No orders to regenerate', 'warning');
            return;
        }

        try {
            setRegenerating(true);
            
            // Regenerate accounting data for all visible orders
            const results = await Promise.all(
                orders.map(order =>
                    api.post(`/accounting/${order.orderId._id}/regenerate`)
                )
            );

            // Check if all succeeded
            const allSuccess = results.every(r => r.data.success);
            
            if (allSuccess) {
                showNotification(
                    `Regenerated accounting data for ${results.length} order(s)`,
                    'success'
                );
                // Refresh both report and orders to get updated calculations
                await fetchReport();
                await fetchOrders();
            } else {
                showNotification(
                    'Some orders failed to regenerate. Please check the details.',
                    'warning'
                );
            }
        } catch (error: any) {
            showNotification(
                error.response?.data?.message || 'Failed to regenerate accounting data',
                'error'
            );
        } finally {
            setRegenerating(false);
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
                flexWrap="wrap"
                gap={2}
            >
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Accounting & Reports
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        View profit and loss reports for your orders
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRegenerateAccountingData}
                        disabled={loading || regenerating || !selectedStore}
                    >
                        {regenerating ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => {
                            fetchReport();
                            fetchOrders();
                        }}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={
                            exporting ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : (
                                <DownloadIcon />
                            )
                        }
                        onClick={handleExport}
                        disabled={!selectedStore || exporting}
                    >
                        Export CSV
                    </Button>
                </Box>
            </Box>

            {/* Store Selector & Date Range */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="start" flexDirection={{ xs: 'column', sm: 'column', md: 'row' }} >
                    <Grid size={{ xs: 12, md: 3 }}>
                        <StoreAutocomplete
                            value={selectedStore}
                            minimal
                            onChange={(value) => {
                                const newValue = Array.isArray(value)
                                    ? value[0]
                                    : value;
                                updateParams({
                                    storeId: newValue || null,
                                    page: 0,
                                });
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <ButtonGroup variant="outlined" sx={{ flexWrap: 'wrap' }}>
                            {DATE_PRESETS.map((preset) => (
                                <Button
                                    sx={{ fontSize: 10 }}
                                    key={preset.value}
                                    variant={
                                        datePreset === preset.value &&
                                            !showCustomDates
                                            ? 'contained'
                                            : 'outlined'
                                    }
                                    onClick={() => handlePresetChange(preset.value)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </ButtonGroup>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Box display="flex" gap={1} alignItems="center">
                            <TextField
                                type="date"
                                size="small"
                                label="Start"
                                value={tempStartDate}
                                onChange={(e) => setTempStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 140 }}
                            />
                            <TextField
                                type="date"
                                size="small"
                                label="End"
                                value={tempEndDate}
                                onChange={(e) => setTempEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 140 }}
                            />
                            <Button
                                variant={showCustomDates ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() =>
                                    handleCustomDateApply(tempStartDate, tempEndDate)
                                }
                                disabled={!tempStartDate || !tempEndDate}
                            >
                                Apply
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {!selectedStore ? (
                <Alert severity="info">
                    Please select a store to view accounting reports.
                </Alert>
            ) : loading && !report ? (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                </Box>
            ) : report ? (
                <>
                    {/* Summary Cards */}
                    <Grid container spacing={2} mb={3}>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }} >
                            <Card variant="outlined" sx={{ height: 1 }}>
                                <CardContent>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Total Orders
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold">
                                        {report.summary.totalOrders}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {report.summary.completedAccounting} complete
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }} >
                            <Card variant="outlined" sx={{ height: 1 }}>
                                <CardContent>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Total Revenue
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        color="primary.main"
                                    >
                                        {formatPrice(
                                            report.summary?.totalRevenue,
                                            currencyCode
                                        )}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                       
                        <Grid size={{ xs: 6, sm: 4, md: 2 }} >
                            <Card variant="outlined" sx={{ height: 1, borderColor: report.summary.totalReturns > 0 ? 'warning.main' : 'divider', borderWidth: report.summary.totalReturns > 0 ? 2 : 1 }}>
                                <CardContent>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Returns
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        color={report.summary.totalReturns > 0 ? 'warning.main' : 'text.secondary'}
                                    >
                                        -{formatPrice(
                                            report.summary?.totalReturns,
                                            currencyCode
                                        )}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }} >
                            <Card variant="outlined" sx={{ height: 1, bgcolor: report.summary.totalAdjustedRevenue < report.summary.totalRevenue ? 'warning.50' : 'transparent' }}>
                                <CardContent>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Adjusted Revenue
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        color="success.main"
                                    >
                                        {formatPrice(
                                            report.summary?.totalAdjustedRevenue,
                                            currencyCode
                                        )}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }} >
                            <Card variant="outlined" sx={{ height: 1 }}>
                                <CardContent>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Total COGS
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        color="warning.main"
                                    >
                                        {formatPrice(
                                            report.summary?.totalCogs,
                                            currencyCode
                                        )}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }} >
                            <Card variant="outlined" sx={{ height: 1 }}>
                                <CardContent>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Total Expenses
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        color="error.main"
                                    >
                                        {formatPrice(
                                            report.summary?.totalExpenses,
                                            currencyCode
                                        )}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                            <Card
                                variant="outlined"
                                sx={{
                                    bgcolor:
                                        report.summary.netProfit >= 0
                                            ? 'success.50'
                                            : 'error.50',
                                    borderColor:
                                        report.summary.netProfit >= 0
                                            ? 'success.main'
                                            : 'error.main',
                                    height: 1
                                }}
                            >
                                <CardContent>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Net Profit
                                    </Typography>
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={0.5}

                                    >
                                        {report.summary.netProfit >= 0 ? (
                                            <TrendingUpIcon
                                                color="success"
                                                fontSize="small"
                                            />
                                        ) : (
                                            <TrendingDownIcon
                                                color="error"
                                                fontSize="small"
                                            />
                                        )}
                                        <Typography
                                            variant="h5"
                                            fontWeight="bold"
                                            sx={{
                                                color:
                                                    report.summary.netProfit >= 0
                                                        ? 'success.main'
                                                        : 'error.main',
                                            }}
                                        >
                                            {formatPrice(
                                                report.summary?.netProfit,
                                                currencyCode
                                            )}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                            <Card variant="outlined" sx={{ height: 1 }}>
                                <CardContent>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Profit Margin
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        sx={{
                                            color:
                                                report.summary.averageProfitMargin >= 0
                                                    ? 'success.main'
                                                    : 'error.main',
                                        }}
                                    >
                                        {report.summary.averageProfitMargin.toFixed(1)}%
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Orders Table with DataGrid */}
                    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                        <Box p={2} borderBottom={1} borderColor="divider">
                            <Typography variant="h6">Orders</Typography>
                        </Box>
                        <Box sx={{ height: 650, width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
                            <DataGrid
                                rows={orders}
                                columns={columns}
                                getRowId={(row) => row._id}
                                rowCount={totalOrders}
                                loading={loading}
                                pageSizeOptions={[10, 20, 50, 100]}
                                paginationModel={{
                                    page,
                                    pageSize,
                                }}
                                paginationMode="server"
                                onPaginationModelChange={(model) => {
                                    updateParams({
                                        page: model.page,
                                        limit: model.pageSize,
                                    });
                                }}
                                disableRowSelectionOnClick

                                sx={{
                                    border: 0,
                                    '& .MuiDataGrid-cell:focus': {
                                        outline: 'none',
                                    },
                                    '& .MuiDataGrid-main': {
                                        overflowX: 'auto',
                                    },
                                }}
                            />
                        </Box>
                    </Paper>
                </>
            ) : (
                <Alert severity="info">
                    Select a store and date range to view accounting reports.
                </Alert>
            )}
        </Box>
    );
}

export default function AccountingDashboard() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <AccountingDashboardContent />
        </Suspense>
    );
}
