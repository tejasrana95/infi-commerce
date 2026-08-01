'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, CircularProgress, FormControl,
    Select, MenuItem, Paper, Stack
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

interface StatusDistributionWidgetProps {
    storeId: string;
}

const STATUS_COLOR_MAP: Record<string, string> = {
    pending: '#f59e0b',    // Amber
    processing: '#3b82f6', // Blue
    shipped: '#6366f1',    // Indigo
    delivered: '#10b981',  // Emerald Green
    cancelled: '#ef4444',  // Red
    refunded: '#8b5cf6',   // Purple
    failed: '#d97706',     // Dark Amber
};

const DEFAULT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

export default function StatusDistributionWidget({ storeId }: StatusDistributionWidgetProps) {
    const [distribution, setDistribution] = useState<any[]>([]);
    const [period, setPeriod] = useState<string>('30_days');
    const [loading, setLoading] = useState(true);

    const fetchDistribution = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/dashboard/widgets/status-distribution?storeId=${storeId}&period=${period}`);
            const data = res.data.data || [];

            // Format status names for display
            const formatted = data.map((item: any) => ({
                ...item,
                name: (item._id || 'Unknown').toUpperCase(),
                statusKey: (item._id || 'unknown').toLowerCase(),
                value: Number(item.count || 0),
            }));
            setDistribution(formatted);
        } catch (err) {
            console.error('Failed to fetch status distribution widget:', err);
        } finally {
            setLoading(false);
        }
    }, [storeId, period]);

    useEffect(() => {
        fetchDistribution();
    }, [fetchDistribution]);

    const totalOrders = distribution.reduce((sum, item) => sum + (item.value || 0), 0);

    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with Title and Timeframe Selector */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>Order Status Breakdown</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Total Orders: <strong>{totalOrders}</strong>
                    </Typography>
                </Box>

                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <Select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        sx={{ fontSize: '0.8125rem', height: 32, borderRadius: 1.5 }}
                    >
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="yesterday">Yesterday</MenuItem>
                        <MenuItem value="7_days">Last 7 Days</MenuItem>
                        <MenuItem value="30_days">30 Days</MenuItem>
                        <MenuItem value="3_months">3 Months</MenuItem>
                        <MenuItem value="ytd">YTD</MenuItem>
                        <MenuItem value="all_time">All Time</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Doughnut Chart Graph with Fixed Minimum Height */}
            <Box sx={{ width: '100%', height: 230, minHeight: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {loading ? (
                    <CircularProgress size={32} />
                ) : distribution.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No order data found for selected timeframe.</Typography>
                ) : (
                    <ResponsiveContainer width="100%" height={230}>
                        <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                            <Pie
                                data={distribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                                nameKey="name"
                            >
                                {distribution.map((entry, index) => {
                                    const color = STATUS_COLOR_MAP[entry.statusKey] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                                    return <Cell key={`cell-${index}`} fill={color} />;
                                })}
                            </Pie>
                            <Tooltip
                                formatter={(value: number, name: string) => [
                                    `${value} orders (${totalOrders > 0 ? Math.round((value / totalOrders) * 100) : 0}%)`,
                                    name
                                ]}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </Box>

            {/* Small Compact Legends at Bottom */}
            {!loading && distribution.length > 0 && (
                <Box mt={1.5} pt={1.5} borderTop={1} borderColor="divider">
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
                        {distribution.map((item, index) => {
                            const color = STATUS_COLOR_MAP[item.statusKey] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                            const percent = totalOrders > 0 ? Math.round((item.value / totalOrders) * 100) : 0;
                            return (
                                <Box
                                    key={item.name}
                                    display="flex"
                                    alignItems="center"
                                    gap={0.6}
                                    px={1}
                                    py={0.3}
                                    borderRadius={1}
                                    bgcolor="action.hover"
                                    border="1px solid"
                                    borderColor="divider"
                                >
                                    <Box width={7} height={7} borderRadius="50%" bgcolor={color} />
                                    <Typography variant="caption" fontWeight={600} color="text.secondary" fontSize="0.7rem">
                                        {item.name?.toString()?.replace('_', ' ')}:
                                    </Typography>
                                    <Typography variant="caption" fontWeight={700} color="text.primary" fontSize="0.7rem">
                                        {item.value} ({percent}%)
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            )}
        </Paper>
    );
}
