'use client';

import { ReactNode, useCallback, useEffect, useState, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Alert,
    Grid,
    useTheme,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { POSSession } from '@/types/pos';
import api from '@/lib/api';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PageHeader, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

const formatDateTime = (date?: Date) => (date ? format(new Date(date), 'MMM dd, yyyy hh:mm a') : '-');

interface POSSessionsOverviewProps {
    storeId: string | null;
    title?: string;
    subtitle?: string;
    emptyMessage?: string;
}

const initialStats = {
    totalSessions: 0,
    activeSessions: 0,
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    avgSessionDuration: 0,
};

export default function POSSessionsOverview({
    storeId,
    title = 'POS Sessions',
    subtitle = 'View and manage Point of Sale sessions',
    emptyMessage = 'Select a store to view POS sessions.',
}: POSSessionsOverviewProps) {
    const theme = useTheme();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);
    const { formatPrice, loadStoreCurrency } = useCurrency();
    const { showNotification } = useNotification();
    const [sessions, setSessions] = useState<POSSession[]>([]);
    const [selectedStore, setSelectedStore] = useState<string>(storeId || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState(initialStats);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'completed' | 'pending'>('all');
    const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'last7' | 'thisMonth' | 'last30' | 'custom'>('today');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

    useEffect(() => {
        if (selectedStore) loadStoreCurrency(selectedStore);
    }, [selectedStore]);
    // Convert date preset to actual dates for API
    const getDateRangeFromPreset = () => {
        const now = new Date();
        let start: Date, end: Date;

        switch (datePreset) {
            case 'today':
                start = startOfDay(now);
                end = endOfDay(now);
                break;
            case 'yesterday':
                start = startOfDay(subDays(now, 1));
                end = endOfDay(subDays(now, 1));
                break;
            case 'last7':
                start = startOfDay(subDays(now, 7));
                end = endOfDay(now);
                break;
            case 'thisMonth':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'last30':
                start = startOfDay(subDays(now, 30));
                end = endOfDay(now);
                break;
            case 'custom':
                start = dateRange.start ? new Date(dateRange.start) : startOfDay(now);
                end = dateRange.end ? new Date(dateRange.end) : endOfDay(now);
                break;
            default:
                start = startOfDay(now);
                end = endOfDay(now);
        }

        return { start, end };
    };


    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchSessions = useCallback(async () => {
        if (!selectedStore) {
            setSessions([]);
            setTotalRows(0);
            setStats(initialStats);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { start, end } = getDateRangeFromPreset();
            const params = new URLSearchParams();
            params.append('storeId', selectedStore || '');
            params.append('page', String(paginationModel.page + 1));
            params.append('limit', String(paginationModel.pageSize));
            if (debouncedSearch) params.append('search', debouncedSearch);
            params.append('status', statusFilter);
            params.append('startDate', start.toISOString());
            params.append('endDate', end.toISOString());

            const response = await api.get(`/pos/session/history?${params.toString()}`);
            const sessionData: POSSession[] = response.data.data.sessions || [];
            setSessions(sessionData);
            setTotalRows(response.data.data.total || 0);

            setStats({
                totalSessions: response.data.data.total || 0,
                activeSessions: response.data.data.stats?.activeSessions || 0,
                totalSales: response.data.data.stats?.totalSales || 0,
                totalOrders: response.data.data.stats?.totalOrders || 0,
                avgOrderValue: response.data.data.stats?.avgOrderValue || 0,
                avgSessionDuration: response.data.data.stats?.avgSessionDuration || 0,
            });
        } catch (err: any) {
            console.error('Failed to load sessions', err);
            setError(err.response?.data?.message || 'Failed to load POS sessions');
            showNotification('Failed to load POS sessions', 'error');
            setSessions([]);
            setTotalRows(0);
            setStats(initialStats);
        } finally {
            setLoading(false);
        }
    }, [selectedStore, paginationModel.page, paginationModel.pageSize, debouncedSearch, statusFilter, datePreset, dateRange.start, dateRange.end, showNotification]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);


    const calculateCashVariance = (session: POSSession) => {
        if (session.closingCash === undefined) return null;
        const expected = session.openingCash + (session.paymentBreakdown?.cash || 0);
        return session.closingCash - expected;
    };

    const columns: GridColDef[] = [
        {
            field: 'userId',
            headerName: 'User',
            flex: 1,
            minWidth: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">
                        {params?.value?.firstName} {params?.value?.lastName}
                    </Typography>
                    <Typography sx={{ fontSize: 12 }} color="info">
                        {params?.row?.userId?.role.replace('_', ' ')}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'sessionNumber',
            headerName: 'Session #',
            flex: 1,
            minWidth: 140,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">{params?.value}</Typography>
                </Box>
            ),
        },
        {
            field: 'startedAt',
            headerName: 'Started',
            flex: 1.5,
            minWidth: 160,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">{formatDateTime(params?.value)}</Typography>
                </Box>
            ),
        },
        {
            field: 'endedAt',
            headerName: 'Ended',
            flex: 1.5,
            minWidth: 160,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">{formatDateTime(params?.value)}</Typography>
                </Box>
            ),
        },
        {
            field: 'openingCash',
            headerName: 'Opening Cash',
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>
                        {formatPrice(params?.value || 0, undefined, selectedStore || undefined)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'closingCash',
            headerName: 'Closing Cash',
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>
                        {formatPrice(params?.value || 0, undefined, selectedStore || undefined)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'totalSales',
            headerName: 'Total Sales',
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>
                        {formatPrice(params?.value || 0, undefined, selectedStore || undefined)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'totalOrders',
            headerName: 'Orders',
            flex: 0.8,
            minWidth: 110,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>
                        {params?.value || 0}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'variance',
            headerName: 'Cash Variance',
            flex: 1,
            minWidth: 140,
            renderCell: (params: GridRenderCellParams) => {
                if (!params.row) return null;
                const variance = calculateCashVariance(params.row);
                return (
                    <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                        <Chip
                            label={formatPrice(variance || 0, undefined, selectedStore || undefined)}
                            color={variance === 0 ? 'success' : variance !== null && variance > 0 ? 'warning' : 'error'}
                            size="small"
                        />
                    </Box>
                );
            },
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 0.9,
            minWidth: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Chip label={params.value} color={params.value === 'active' ? 'primary' : 'default'} size="small" />
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <PageHeader title={title} subtitle={subtitle} />

            {!selectedStore && (
                <Alert sx={{ mb: 3 }} severity="info">
                    {emptyMessage}
                </Alert>
            )}

            <SearchFilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                showStoreFilter={storeId ? false : true}
                onStoreFilterChange={setSelectedStore}
                storeFilterValue={selectedStore}
                showDateFilter={true}
                datePreset={datePreset}
                onDatePresetChange={setDatePreset}
                dateRangeValue={dateRange}
                onDateRangeChange={setDateRange}
                searchPlaceholder="Search sessions..."
                filters={[
                    {
                        id: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'closed', label: 'Closed' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'pending', label: 'Pending' },
                        ],
                    },
                ]}
                activeFilters={{ status: statusFilter !== 'all' ? statusFilter : '' }}
                onFilterChange={(filters) => setStatusFilter(filters.status as typeof statusFilter)}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" variant="caption" gutterBottom>
                                Total Sessions
                            </Typography>
                            <Typography variant="h4">{stats.totalSessions}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" variant="caption" gutterBottom>
                                Active Sessions
                            </Typography>
                            <Typography variant="h4" color="primary">
                                {stats.activeSessions}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" variant="caption" gutterBottom>
                                Total Sales
                            </Typography>
                            <Typography variant="h4">
                                {formatPrice(stats.totalSales, undefined, selectedStore || undefined)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" variant="caption" gutterBottom>
                                Total Orders
                            </Typography>
                            <Typography variant="h4">{stats.totalOrders}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" variant="caption" gutterBottom>
                                Avg Order Value
                            </Typography>
                            <Typography variant="h4">
                                {formatPrice(stats.avgOrderValue, undefined, selectedStore || undefined)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" variant="caption" gutterBottom>
                                Avg Session Duration
                            </Typography>
                            <Typography variant="h4">
                                {Math.round(stats.avgSessionDuration / 60)} min
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ width: '100%', mt: 2, position: 'relative' }}>
                {loading && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        }}
                    >
                        <LoadingSpinner message="Loading sessions..." />
                    </Box>
                )}

                <DataGrid
                    rows={sessions}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50]}
                    paginationMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                />
            </Box>
        </Box>
    );
}