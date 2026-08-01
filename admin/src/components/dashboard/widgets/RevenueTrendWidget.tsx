'use client';

import { useEffect, useState, useCallback } from 'react';
import { Box, FormControl, Select, MenuItem, Typography, CircularProgress } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from '@/components/molecules/ChartCard';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface RevenueTrendWidgetProps {
    storeId: string;
}

export default function RevenueTrendWidget({ storeId }: RevenueTrendWidgetProps) {
    const { formatPrice } = useCurrency();
    const [salesData, setSalesData] = useState<any[]>([]);
    const [revenuePeriod, setRevenuePeriod] = useState<string>('30_days');
    const [loading, setLoading] = useState(true);

    const fetchRevenueTrend = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/dashboard/widgets/revenue-trend?storeId=${storeId}&revenuePeriod=${revenuePeriod}`);
            setSalesData(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch revenue trend widget:', err);
        } finally {
            setLoading(false);
        }
    }, [storeId, revenuePeriod]);

    useEffect(() => {
        fetchRevenueTrend();
    }, [fetchRevenueTrend]);

    const getRevenueSubtitle = () => {
        switch (revenuePeriod) {
            case '30_days': return 'Daily revenue for the last 30 days';
            case '3_months': return 'Daily revenue for the last 3 months';
            case '6_months': return 'Monthly revenue for the last 6 months';
            case 'ytd': return 'Revenue for Year to Date';
            case 'all_time': return 'Monthly revenue for All Time';
            default: return 'Revenue trend over time';
        }
    };

    return (
        <ChartCard
            title="Revenue Trend"
            subtitle={getRevenueSubtitle()}
            action={
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                        value={revenuePeriod}
                        onChange={(e) => setRevenuePeriod(e.target.value)}
                        sx={{ fontSize: '0.8125rem', height: 32, borderRadius: 1.5, bgcolor: 'background.paper' }}
                    >
                        <MenuItem value="30_days" sx={{ fontSize: '0.8125rem' }}>30 Days</MenuItem>
                        <MenuItem value="3_months" sx={{ fontSize: '0.8125rem' }}>3 Months</MenuItem>
                        <MenuItem value="6_months" sx={{ fontSize: '0.8125rem' }}>6 Months</MenuItem>
                        <MenuItem value="ytd" sx={{ fontSize: '0.8125rem' }}>YTD</MenuItem>
                        <MenuItem value="all_time" sx={{ fontSize: '0.8125rem' }}>All Time</MenuItem>
                    </Select>
                </FormControl>
            }
        >
            <Box height={350} mt={2} position="relative">
                {loading && (
                    <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bgcolor="rgba(255, 255, 255, 0.7)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        zIndex={2}
                    >
                        <CircularProgress size={32} />
                    </Box>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                        <defs>
                            <linearGradient id="colorRevenueWidget" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="_id"
                            tickFormatter={(str) => {
                                if (!str) return '';
                                const dateStr = str.length === 7 ? `${str}-01` : str;
                                const d = new Date(dateStr);
                                if (isNaN(d.getTime())) return str;
                                if (revenuePeriod === '6_months' || revenuePeriod === 'all_time') {
                                    return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                                }
                                return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                            }}
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => formatPrice(val).split('.')[0]}
                        />
                        <Tooltip
                            labelFormatter={(str) => {
                                if (!str) return '';
                                const dateStr = str.length === 7 ? `${str}-01` : str;
                                const d = new Date(dateStr);
                                if (isNaN(d.getTime())) return str;
                                if (revenuePeriod === '6_months' || revenuePeriod === 'all_time') {
                                    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                                }
                                return d.toLocaleDateString(undefined, { dateStyle: 'long' });
                            }}
                            formatter={(val: number) => [formatPrice(val), 'Revenue']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenueWidget)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Box>
        </ChartCard>
    );
}
