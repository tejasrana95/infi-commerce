'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    Box, Typography, Card, CardContent, Chip, IconButton, Tooltip,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Alert, Snackbar, Stack,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel,
} from '@mui/x-data-grid';
import {
    Visibility, Refresh, PlayArrow, Email, Sms, WhatsApp,
    CheckCircle, Error, Schedule, Cancel, Close, Store as StoreIcon,
} from '@mui/icons-material';
import api from '@/lib/api';

interface Store {
    _id: string;
    name: string;
}

interface Notification {
    _id: string;
    channel: 'email' | 'sms' | 'whatsapp';
    priority: 'high' | 'normal' | 'low';
    type: string;
    recipient: string;
    recipientName?: string;
    subject?: string;
    content: string;
    status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
    error?: string;
    attempts: number;
    createdAt: string;
    sentAt?: string;
    storeId?: Store | string;  // Can be populated or just ID
}

interface Stats {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    cancelled: number;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState<Stats>({ pending: 0, processing: 0, sent: 0, failed: 0, cancelled: 0 });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success'
    });

    // Stores for filter
    const [stores, setStores] = useState<Store[]>([]);

    // Pagination
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
    const [rowCount, setRowCount] = useState(0);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [channelFilter, setChannelFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [storeFilter, setStoreFilter] = useState<string>('');

    useEffect(() => {
        loadStores();
    }, []);

    useEffect(() => {
        loadNotifications();
        loadStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, statusFilter, channelFilter, typeFilter, storeFilter]);

    const loadStores = async () => {
        try {
            const res = await api.get('stores');
            setStores(res.data.stores || []);
        } catch (error) {
            console.error('Failed to load stores:', error);
        }
    };

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = {
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
            };
            if (statusFilter) params.status = statusFilter;
            if (channelFilter) params.channel = channelFilter;
            if (typeFilter) params.type = typeFilter;
            if (storeFilter) params.storeId = storeFilter;

            const res = await api.get('notifications', { params });
            setNotifications(res.data.notifications);
            setRowCount(res.data.pagination.total);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const params: Record<string, unknown> = {};
            if (storeFilter) params.storeId = storeFilter;
            const res = await api.get('notifications/stats', { params });
            setStats(res.data.stats);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleProcessQueue = async (priority: 'normal' | 'high') => {
        setProcessing(true);
        try {
            const res = await api.post('notifications/process', { priority, limit: 30 });
            setSnackbar({ open: true, message: res.data.message, severity: 'success' });
            loadNotifications();
            loadStats();
        } catch (error: unknown) {
            const err = error as { message?: string };
            setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    const handleRetry = async (id: string) => {
        try {
            await api.post(`notifications/${id}/retry`);
            setSnackbar({ open: true, message: 'Notification queued for retry', severity: 'success' });
            loadNotifications();
            loadStats();
        } catch (error: unknown) {
            const err = error as { message?: string };
            setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await api.delete(`notifications/${id}`);
            setSnackbar({ open: true, message: 'Notification cancelled', severity: 'success' });
            loadNotifications();
            loadStats();
        } catch (error: unknown) {
            const err = error as { message?: string };
            setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
        }
    };

    const getStoreName = (notification: Notification): string => {
        if (!notification.storeId) return 'N/A';
        if (typeof notification.storeId === 'string') return notification.storeId;
        return notification.storeId.name || 'Unknown';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent': return <CheckCircle color="success" fontSize="small" />;
            case 'failed': return <Error color="error" fontSize="small" />;
            case 'pending': return <Schedule color="warning" fontSize="small" />;
            case 'processing': return <CircularProgress size={16} />;
            case 'cancelled': return <Cancel color="disabled" fontSize="small" />;
            default: return undefined;
        }
    };

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email': return <Email fontSize="small" />;
            case 'sms': return <Sms fontSize="small" />;
            case 'whatsapp': return <WhatsApp fontSize="small" />;
            default: return null;
        }
    };

    const columns: GridColDef[] = useMemo(() => [
        {
            field: 'storeId',
            headerName: 'Store',
            width: 140,
            renderCell: (params: GridRenderCellParams) => {
                const storeName = params.value?.name || (typeof params.value === 'string' ? params.value : 'N/A');
                return (
                    <Chip
                        icon={<StoreIcon fontSize="small" />}
                        label={storeName}
                        size="small"
                        variant="outlined"
                    />
                );
            },
        },
        {
            field: 'channel',
            headerName: 'Channel',
            width: 90,
            renderCell: (params: GridRenderCellParams) => (
                <Tooltip title={params.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getChannelIcon(params.value)}
                    </Box>
                </Tooltip>
            ),
        },
        { field: 'type', headerName: 'Type', width: 140 },
        { field: 'recipient', headerName: 'Recipient', width: 200 },
        { field: 'subject', headerName: 'Subject', width: 200, flex: 1 },
        {
            field: 'priority',
            headerName: 'Priority',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={params.value === 'high' ? 'error' : params.value === 'normal' ? 'primary' : 'default'}
                />
            ),
        },
        {
            field: 'error',
            headerName: 'Server Response',
            width: 140,
            renderCell: (params: GridRenderCellParams) => (
                <Tooltip title={params.value}>
                    <Chip
                        label={params.value ? "Error" : "OK"}
                        size="small"
                        color={
                            params.value ? 'error' : 'success'
                        }
                    />
                </Tooltip>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    icon={getStatusIcon(params.value)}
                    label={params.value}
                    size="small"
                    color={
                        params.value === 'sent' ? 'success' :
                            params.value === 'failed' ? 'error' :
                                params.value === 'pending' ? 'warning' : 'default'
                    }
                />
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 160,
            renderCell: (params: GridRenderCellParams) => new Date(params.value).toLocaleString(),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <Tooltip title="View">
                        <IconButton size="small" onClick={() => { setSelectedNotification(params.row); setPreviewOpen(true); }}>
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {params.row.status === 'failed' && (
                        <Tooltip title="Retry">
                            <IconButton size="small" color="primary" onClick={() => handleRetry(params.row._id)}>
                                <Refresh fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {params.row.status === 'pending' && (
                        <Tooltip title="Cancel">
                            <IconButton size="small" color="error" onClick={() => handleCancel(params.row._id)}>
                                <Cancel fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            ),
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], []);

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Notification Queue</Typography>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Pending', value: stats.pending, color: '#f59e0b' },
                    { label: 'Processing', value: stats.processing, color: '#3b82f6' },
                    { label: 'Sent', value: stats.sent, color: '#22c55e' },
                    { label: 'Failed', value: stats.failed, color: '#ef4444' },
                    { label: 'Cancelled', value: stats.cancelled, color: '#9ca3af' },
                ].map((stat) => (
                    <Grid key={stat.label} size={{ xs: 6, sm: 4, md: 2.4 }}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4" sx={{ color: stat.color }}>{stat.value}</Typography>
                                <Typography variant="body2" color="textSecondary">{stat.label}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Actions */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Button
                    variant="contained"
                    color="error"
                    startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                    onClick={() => handleProcessQueue('high')}
                    disabled={processing}
                >
                    Process High Priority
                </Button>
                <Button
                    variant="contained"
                    startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                    onClick={() => handleProcessQueue('normal')}
                    disabled={processing}
                >
                    Process Normal Queue
                </Button>
                <Button variant="outlined" startIcon={<Refresh />} onClick={() => { loadNotifications(); loadStats(); }}>
                    Refresh
                </Button>
            </Stack>

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Store</InputLabel>
                                <Select value={storeFilter} label="Store" onChange={(e) => setStoreFilter(e.target.value)}>
                                    <MenuItem value="">All Stores</MenuItem>
                                    {stores.map((store) => (
                                        <MenuItem key={store._id} value={store._id}>{store.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="processing">Processing</MenuItem>
                                    <MenuItem value="sent">Sent</MenuItem>
                                    <MenuItem value="failed">Failed</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Channel</InputLabel>
                                <Select value={channelFilter} label="Channel" onChange={(e) => setChannelFilter(e.target.value)}>
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="email">Email</MenuItem>
                                    <MenuItem value="sms">SMS</MenuItem>
                                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Type Filter"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                placeholder="e.g. order_created"
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Data Grid */}
            <Card>
                <DataGrid
                    rows={notifications}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 20, 50, 100]}
                    rowCount={rowCount}
                    paginationMode="server"
                    autoHeight
                    disableRowSelectionOnClick
                    sx={{ border: 0 }}
                />
            </Card>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Notification Details
                    <IconButton onClick={() => setPreviewOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedNotification && (
                        <Grid container spacing={2}>
                            <Grid size={6}><strong>Store:</strong> {getStoreName(selectedNotification)}</Grid>
                            <Grid size={6}><strong>Channel:</strong> {selectedNotification.channel}</Grid>
                            <Grid size={6}><strong>Type:</strong> {selectedNotification.type}</Grid>
                            <Grid size={6}><strong>Recipient:</strong> {selectedNotification.recipient}</Grid>
                            <Grid size={6}><strong>Status:</strong> {selectedNotification.status}</Grid>
                            <Grid size={6}><strong>Attempts:</strong> {selectedNotification.attempts}</Grid>
                            <Grid size={12}><strong>Subject:</strong> {selectedNotification.subject || 'N/A'}</Grid>
                            {selectedNotification.error && (
                                <Grid size={12}>
                                    <Alert severity="error">{selectedNotification.error}</Alert>
                                </Grid>
                            )}
                            <Grid size={12}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Content:</Typography>
                                <Box
                                    sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 2, maxHeight: 400, overflow: 'auto' }}
                                    dangerouslySetInnerHTML={{ __html: selectedNotification.content }}
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedNotification?.status === 'failed' && (
                        <Button onClick={() => { handleRetry(selectedNotification._id); setPreviewOpen(false); }}>
                            Retry
                        </Button>
                    )}
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}

