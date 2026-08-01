'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, LinearProgress,
    Chip, Tooltip, CircularProgress, Stack, IconButton
} from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import api from '@/lib/api';

export default function SystemHealthWidget() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshCountdown, setRefreshCountdown] = useState(10);

    const fetchSystemHealth = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const url = isManual ? '/dashboard/widgets/system-health?force=true' : '/dashboard/widgets/system-health';
            const res = await api.get(url);
            setHealth(res.data.data);
            setRefreshCountdown(10);
        } catch (err) {
            console.error('Failed to fetch system health widget:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchSystemHealth();

        // Auto refresh every 10 seconds
        const timer = setInterval(() => {
            fetchSystemHealth();
        }, 10000);

        // Countdown visual ticker
        const countdownTimer = setInterval(() => {
            setRefreshCountdown((prev) => (prev > 1 ? prev - 1 : 10));
        }, 1000);

        return () => {
            clearInterval(timer);
            clearInterval(countdownTimer);
        };
    }, [fetchSystemHealth]);

    const formatUptime = (seconds: number) => {
        if (!seconds) return '0s';
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (d > 0) return `${d}d ${h}h ${m}m`;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const getProgressColor = (percent: number) => {
        if (percent > 85) return 'error';
        if (percent > 65) return 'warning';
        return 'primary';
    };

    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <SpeedIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>System Health & Performance</Typography>
                    <Chip label="Super Admin" size="small" color="secondary" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title="Click to refresh now (Auto-refreshes every 10s)">
                        <IconButton
                            size="small"
                            onClick={() => fetchSystemHealth(true)}
                            disabled={refreshing}
                            sx={{ bgcolor: 'action.hover', borderRadius: 1.5, px: 1, py: 0.5 }}
                        >
                            <AutorenewIcon
                                fontSize="small"
                                sx={{
                                    color: 'primary.main',
                                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                                }}
                            />
                            <Typography variant="caption" color="text.secondary" ml={0.5} fontWeight={600}>
                                {refreshCountdown}s
                            </Typography>
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            {loading && !health ? (
                <Box flex={1} display="flex" justifyContent="center" alignItems="center"><CircularProgress size={30} /></Box>
            ) : (
                <Grid container spacing={2.5} flex={1}>
                    {/* CPU Usage */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Box p={2} border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper">
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <SpeedIcon fontSize="small" color="primary" />
                                    <Typography variant="body2" fontWeight={600}>CPU Usage</Typography>
                                </Box>
                                <Typography variant="subtitle1" fontWeight={700} color={`${getProgressColor(health?.cpuUsagePercent || 0)}.main`}>
                                    {health?.cpuUsagePercent || 0}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={health?.cpuUsagePercent || 0}
                                color={getProgressColor(health?.cpuUsagePercent || 0)}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="text.secondary" mt={0.8} display="block">
                                Cores: {health?.cpuCount || 1} • Load: {health?.loadAverage?.join(', ') || '0'}
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Application Heap RAM Usage */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Box p={2} border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper">
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <MemoryIcon fontSize="small" color="primary" />
                                    <Typography variant="body2" fontWeight={600}>App Heap RAM</Typography>
                                </Box>
                                <Typography variant="subtitle1" fontWeight={700} color={`${getProgressColor(health?.heapUsagePercent || 0)}.main`}>
                                    {health?.heapUsagePercent || 0}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={health?.heapUsagePercent || 0}
                                color={getProgressColor(health?.heapUsagePercent || 0)}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="text.secondary" mt={0.8} display="block">
                                Heap: {health?.processHeapUsedMB || 0} MB / {health?.processHeapTotalMB || 0} MB (App RSS: {health?.processRssMB || 0} MB)
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Health & System Indicators */}
                    <Grid size={{ xs: 12 }}>
                        <Box p={2} border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper">
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6, sm: 2.4 }}>
                                    <Typography variant="caption" color="text.secondary">API Status & Env</Typography>
                                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                        <CheckCircleIcon color="success" fontSize="small" />
                                        <Typography variant="body2" fontWeight={600} textTransform="capitalize">
                                            {health?.status || 'ok'} ({health?.environment || 'dev'})
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 6, sm: 2.4 }}>
                                    <Typography variant="caption" color="text.secondary">Database Status</Typography>
                                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                        <CheckCircleIcon color="success" fontSize="small" />
                                        <Typography variant="body2" fontWeight={600} textTransform="capitalize">
                                            {health?.mongoState || 'Connected'}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 6, sm: 2.4 }}>
                                    <Typography variant="caption" color="text.secondary">Cache Engine</Typography>
                                    <Typography variant="body2" fontWeight={600} mt={0.5} textTransform="capitalize">
                                        {health?.cache?.backend || 'Memory'} ({health?.cache?.memoryFallbackSize || 0} items)
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 6, sm: 2.4 }}>
                                    <Typography variant="caption" color="text.secondary">Node Process Uptime</Typography>
                                    <Typography variant="body2" fontWeight={600} mt={0.5}>
                                        {formatUptime(health?.processUptimeSeconds)}
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 6, sm: 2.4 }}>
                                    <Typography variant="caption" color="text.secondary">Node & OS</Typography>
                                    <Typography variant="body2" fontWeight={600} mt={0.5}>
                                        {health?.nodeVersion || 'N/A'} ({health?.platform || 'Linux'})
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>
                </Grid>
            )}
        </Paper>
    );
}
