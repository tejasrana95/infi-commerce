'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Alert,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    useTheme,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { POSSession } from '@/types/pos';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PageHeader, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

const formatDateTime = (date?: Date) => (date ? format(new Date(date), 'MMM dd, yyyy hh:mm a') : '-');

export default function POSSessionsPage() {
    const theme = useTheme();
    const params = useParams();
    const storeId = params.id as string;
    const { formatPrice, loadStoreCurrency } = useCurrency();
    const { showNotification } = useNotification();
    const [sessions, setSessions] = useState<POSSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalSessions: 0,
        activeSessions: 0,
        totalSales: 0,
    });

    // Pagination state
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [totalRows, setTotalRows] = useState(0);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Status filter state
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'completed' | 'pending'>('all');

    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    useEffect(() => {
        if (storeId) {
            loadStoreCurrency(storeId);
        }
    }, [storeId]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch sessions when pagination, search, or status filter changes
    useEffect(() => {
        fetchSessions();
    }, [paginationModel, debouncedSearch, statusFilter]);

    const fetchSessions = async () => {
        if (!storeId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('storeId', storeId);
            params.append('page', String(paginationModel.page + 1));
            params.append('limit', String(paginationModel.pageSize));
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await api.get(`/pos/session/history?${params.toString()}`);
            const sessionData: POSSession[] = response.data.data.sessions || [];
            setSessions(sessionData);
            setTotalRows(response.data.data.total || 0);

            setStats({
                totalSessions: response.data.data.total || 0,
                activeSessions: response.data.data.stats.activeSessions || 0,
                totalSales: response.data.data.stats.totalSales || 0,
            });
        } catch (err: any) {
            console.error('Failed to load sessions', err);
            setError(err.response?.data?.message || 'Failed to load POS sessions');
            showNotification('Failed to load POS sessions', 'error');
            setSessions([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    const calculateCashVariance = (session: POSSession) => {
        if (session.closingCash === undefined) return null;
        const expected = session.openingCash + (session.paymentBreakdown?.cash || 0);
        return session.closingCash - expected;
    };

    const columns: GridColDef[] = [
        {
            field: 'userId', headerName: 'User', flex: 1, minWidth: 100,
            renderCell: (params: GridRenderCellParams) => {
                return (
                    <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                        <Typography variant="body2">{params?.value?.firstName} {params?.value?.lastName}</Typography>
                        <Typography sx={{ fontSize: 12 }} color='info'>{params?.row?.userId?.role.replace('_', ' ')}</Typography>
                    </Box>
                );
            }
        },
        {
            field: 'sessionNumber', headerName: 'Session #', flex: 1, minWidth: 140,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">{params?.value}</Typography>
                </Box>
            ),
        },
        {
            field: 'startedAt', headerName: 'Started', flex: 1.5, minWidth: 160,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">{formatDateTime(params?.value)}</Typography>
                </Box>
            ),
        },
        {
            field: 'endedAt', headerName: 'Ended', flex: 1.5, minWidth: 160,
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
                    <Typography variant="body2" fontWeight={600}>{formatPrice(params?.value || 0, undefined, storeId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'closingCash',
            headerName: 'Closing Cash',
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>{formatPrice(params?.value || 0, undefined, storeId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'totalSales',
            headerName: 'Total Sales',
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>{formatPrice(params?.value || 0, undefined, storeId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'totalOrders', headerName: 'Orders', flex: 0.8, minWidth: 110,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>{params?.value || 0}</Typography>
                </Box>
            ),
        },
        {
            field: 'variance',
            headerName: 'Cash Variance',
            flex: 1,
            minWidth: 140,
            renderCell: (params: GridRenderCellParams) => {
                if (params.row === null) return '-';
                const variance = calculateCashVariance(params.row);
                return (
                    <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                        <Chip
                            label={formatPrice(variance || 0, undefined, storeId)}
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
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Chip label={params.value} color={params.value === 'active' ? 'primary' : 'default'} size="small" /></Box>
            ),
        },
    ];

    return (
        <Box>
            <PageHeader
                title="POS Sessions"
                subtitle="View and manage Point of Sale sessions"
            />

            <SearchFilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search sessions..."
                filters={[
                    {
                        id: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: 'all', label: 'All Sessions' },
                            { value: 'active', label: 'Active' },
                            { value: 'closed', label: 'Closed' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'pending', label: 'Pending' },
                        ],
                    },
                ]}
                activeFilters={{ status: statusFilter }}
                onFilterChange={(filters) => setStatusFilter(filters.status as typeof statusFilter)}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total Sessions
                            </Typography>
                            <Typography variant="h3">{stats.totalSessions}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Active Sessions
                            </Typography>
                            <Typography variant="h3" color="primary">
                                {stats.activeSessions}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total Sales
                            </Typography>
                            <Typography variant="h3">{formatPrice(stats.totalSales, undefined, storeId)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

         

            <Box sx={{ width: '100%', mt: 2, position: 'relative' }}>
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
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    }}>
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
