'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent,
    FormControl, Select, MenuItem, CircularProgress, Chip, Stack
} from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import api from '@/lib/api';

export default function NotificationQueueWidget() {
    const [timeframe, setTimeframe] = useState<string>('today');
    const [counts, setCounts] = useState<{
        sent: number;
        pending: number;
        processing: number;
        failed: number;
        cancelled: number;
        total: number;
    }>({ sent: 0, pending: 0, processing: 0, failed: 0, cancelled: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    const fetchQueueStatus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/dashboard/widgets/notification-queue?timeframe=${timeframe}`);
            setCounts(res.data.data);
        } catch (err) {
            console.error('Failed to fetch notification queue widget:', err);
        } finally {
            setLoading(false);
        }
    }, [timeframe]);

    useEffect(() => {
        fetchQueueStatus();
    }, [fetchQueueStatus]);

    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1}>
                    <NotificationsActiveIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>Notification Queue Status</Typography>
                    <Chip label="Super Admin" size="small" color="secondary" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                </Box>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        sx={{ fontSize: '0.8125rem', height: 32, borderRadius: 1.5 }}
                    >
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="7_days">7 Days</MenuItem>
                        <MenuItem value="30_days">30 Days</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Box flex={1} position="relative" display="flex" alignItems="center">
                {loading ? (
                    <Box width="100%" display="flex" justifyContent="center"><CircularProgress size={30} /></Box>
                ) : (
                    <Grid container spacing={2} width="100%">
                        <Grid size={{ xs: 4 }}>
                            <Card variant="outlined" sx={{ bgcolor: 'success.50', borderColor: 'success.200', textAlign: 'center', p: 1.5 }}>
                                <MarkEmailReadIcon color="success" sx={{ fontSize: 32 }} />
                                <Typography variant="h4" fontWeight={700} color="success.dark" my={0.5}>
                                    {counts.sent}
                                </Typography>
                                <Typography variant="caption" fontWeight={600} color="success.dark">
                                    Sent / Success
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 4 }}>
                            <Card variant="outlined" sx={{ bgcolor: 'warning.50', borderColor: 'warning.200', textAlign: 'center', p: 1.5 }}>
                                <HourglassEmptyIcon color="warning" sx={{ fontSize: 32 }} />
                                <Typography variant="h4" fontWeight={700} color="warning.dark" my={0.5}>
                                    {counts.pending + counts.processing}
                                </Typography>
                                <Typography variant="caption" fontWeight={600} color="warning.dark">
                                    Pending
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 4 }}>
                            <Card variant="outlined" sx={{ bgcolor: 'error.50', borderColor: 'error.200', textAlign: 'center', p: 1.5 }}>
                                <ErrorOutlineIcon color="error" sx={{ fontSize: 32 }} />
                                <Typography variant="h4" fontWeight={700} color="error.dark" my={0.5}>
                                    {counts.failed}
                                </Typography>
                                <Typography variant="caption" fontWeight={600} color="error.dark">
                                    Failed
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </Box>

            <Box mt={2} pt={1.5} borderTop={1} borderColor="divider" display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                    Total Processed: <strong>{counts.total}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Cancelled: <strong>{counts.cancelled}</strong>
                </Typography>
            </Box>
        </Paper>
    );
}
