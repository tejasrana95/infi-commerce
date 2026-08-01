'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Chip, Tooltip,
    CircularProgress, Stack, IconButton
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
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

    const getProgressColor = (percent: number): 'primary' | 'warning' | 'error' => {
        if (percent > 85) return 'error';
        if (percent > 65) return 'warning';
        return 'primary';
    };

    // Dynamic renderer for active and configured cache engines
    const renderDynamicCacheEngines = (cache: any) => {
        if (!cache) return <Chip label="Memory" size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />;

        const items: React.ReactNode[] = [];

        if (cache.memcached?.enabled) {
            items.push(
                <Chip
                    key="memcached"
                    label={`Memcached: ${cache.memcached.connected ? 'Connected' : 'Disconnected'}`}
                    size="small"
                    color={cache.memcached.connected ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }}
                />
            );
        }

        if (cache.redis?.enabled) {
            items.push(
                <Chip
                    key="redis"
                    label={`Redis: ${cache.redis.connected ? 'Connected' : 'Disconnected'}`}
                    size="small"
                    color={cache.redis.connected ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }}
                />
            );
        }

        // Dynamically inspect any additional cache providers configured in future
        Object.keys(cache).forEach((key) => {
            if (!['backend', 'memcached', 'redis', 'memoryFallbackSize', 'memory'].includes(key)) {
                const engine = cache[key];
                if (engine && typeof engine === 'object' && engine.enabled) {
                    items.push(
                        <Chip
                            key={key}
                            label={`${key.toUpperCase()}: ${engine.connected ? 'Connected' : 'Disconnected'}`}
                            size="small"
                            color={engine.connected ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }}
                        />
                    );
                }
            }
        });

        // Always show memory cache fallback items count if present
        if (cache.memoryFallbackSize !== undefined) {
            items.push(
                <Chip
                    key="memoryFallback"
                    label={`Memory: ${cache.memoryFallbackSize} items`}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }}
                />
            );
        }

        if (items.length === 0) {
            items.push(
                <Chip
                    key="default"
                    label={cache.backend || 'Memory'}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }}
                />
            );
        }

        return (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={0.5}>
                {items}
            </Stack>
        );
    };

    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Widget Header */}
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
                <Grid container spacing={2} flex={1}>
                    {/* 1. CPU Usage Circular Bar */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Box p={2} border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper" textAlign="center" height="100%">
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1.5}>
                                CPU Usage
                            </Typography>

                            {/* Circle Bar Gauge */}
                            <Box position="relative" display="inline-flex" mb={1.5}>
                                <CircularProgress
                                    variant="determinate"
                                    value={100}
                                    size={84}
                                    thickness={5}
                                    sx={{ color: 'action.hover' }}
                                />
                                <CircularProgress
                                    variant="determinate"
                                    value={health?.cpuUsagePercent || 0}
                                    size={84}
                                    thickness={5}
                                    color={getProgressColor(health?.cpuUsagePercent || 0)}
                                    sx={{ position: 'absolute', left: 0 }}
                                />
                                <Box
                                    top={0}
                                    left={0}
                                    bottom={0}
                                    right={0}
                                    position="absolute"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Typography variant="subtitle1" fontWeight={700} color={`${getProgressColor(health?.cpuUsagePercent || 0)}.main`}>
                                        {health?.cpuUsagePercent || 0}%
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                Cores: <strong>{health?.cpuCount || 1}</strong> • Load: <strong>{health?.loadAverage?.join(', ') || '0'}</strong>
                            </Typography>
                        </Box>
                    </Grid>

                    {/* 2. Node JS Heap Circular Bar */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Box p={2} border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper" textAlign="center" height="100%">
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1.5}>
                                Node JS Heap
                            </Typography>

                            {/* Circle Bar Gauge */}
                            <Box position="relative" display="inline-flex" mb={1.5}>
                                <CircularProgress
                                    variant="determinate"
                                    value={100}
                                    size={84}
                                    thickness={5}
                                    sx={{ color: 'action.hover' }}
                                />
                                <CircularProgress
                                    variant="determinate"
                                    value={health?.heapUsagePercent || 0}
                                    size={84}
                                    thickness={5}
                                    color={getProgressColor(health?.heapUsagePercent || 0)}
                                    sx={{ position: 'absolute', left: 0 }}
                                />
                                <Box
                                    top={0}
                                    left={0}
                                    bottom={0}
                                    right={0}
                                    position="absolute"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Typography variant="subtitle1" fontWeight={700} color={`${getProgressColor(health?.heapUsagePercent || 0)}.main`}>
                                        {health?.heapUsagePercent || 0}%
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                {health?.processHeapUsedMB || 0} MB / {health?.processHeapTotalMB || 0} MB (RSS: {health?.processRssMB || 0} MB)
                            </Typography>
                        </Box>
                    </Grid>

                    {/* 3. Actual System RAM Circular Bar */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Box p={2} border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper" textAlign="center" height="100%">
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1.5}>
                                Actual System RAM
                            </Typography>

                            {/* Circle Bar Gauge */}
                            <Box position="relative" display="inline-flex" mb={1.5}>
                                <CircularProgress
                                    variant="determinate"
                                    value={100}
                                    size={84}
                                    thickness={5}
                                    sx={{ color: 'action.hover' }}
                                />
                                <CircularProgress
                                    variant="determinate"
                                    value={health?.systemMemoryUsagePercent || 0}
                                    size={84}
                                    thickness={5}
                                    color={getProgressColor(health?.systemMemoryUsagePercent || 0)}
                                    sx={{ position: 'absolute', left: 0 }}
                                />
                                <Box
                                    top={0}
                                    left={0}
                                    bottom={0}
                                    right={0}
                                    position="absolute"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Typography variant="subtitle1" fontWeight={700} color={`${getProgressColor(health?.systemMemoryUsagePercent || 0)}.main`}>
                                        {health?.systemMemoryUsagePercent || 0}%
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                {health?.usedMemoryGB || 0} GB / {health?.totalMemoryGB || 0} GB ({health?.freeMemoryGB || 0} GB Free)
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Health & System Indicators */}
                    <Grid size={{ xs: 12 }}>
                        <Box p={2} border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper">
                            <Grid container spacing={2} alignItems="center">
                                <Grid size={{ xs: 6, sm: 2.4 }}>
                                    <Typography variant="caption" color="text.secondary">API Status & Env</Typography>
                                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                        <CheckCircleIcon color="success" fontSize="small" />
                                        <Typography variant="body2" fontWeight={600} textTransform="capitalize">
                                            {health?.status || 'ok'} ({health?.environment || 'prod'})
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

                                <Grid size={{ xs: 12, sm: 2.4 }}>
                                    <Typography variant="caption" color="text.secondary">Active Cache Engines</Typography>
                                    {renderDynamicCacheEngines(health?.cache)}
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
