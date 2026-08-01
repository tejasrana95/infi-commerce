'use client';

import { useEffect, useState, useCallback } from 'react';
import { Grid, Box, Typography, CircularProgress } from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RateReviewIcon from '@mui/icons-material/RateReview';
import MetricCard from '@/components/molecules/MetricCard';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface MetricsSummaryWidgetProps {
    storeId: string;
}

export default function MetricsSummaryWidget({ storeId }: MetricsSummaryWidgetProps) {
    const { baseCurrency } = useCurrency();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/dashboard/widgets/metrics?storeId=${storeId}`);
            setMetrics(res.data.data);
        } catch (err) {
            console.error('Failed to fetch metrics widget:', err);
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <MetricCard
                    title="Revenue"
                    value={new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: baseCurrency?.code || 'USD',
                        notation: 'compact',
                        maximumFractionDigits: 1
                    }).format(metrics?.totalRevenue || 0)}
                    icon={<PaidIcon />}
                    loading={loading}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <MetricCard
                    title="Orders"
                    value={metrics?.ordersCount || 0}
                    icon={<ShoppingCartIcon />}
                    loading={loading}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <MetricCard
                    title="Customers"
                    value={metrics?.customersCount || 0}
                    icon={<PeopleIcon />}
                    loading={loading}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <MetricCard
                    title="Products"
                    value={metrics?.productsCount || 0}
                    icon={<InventoryIcon />}
                    loading={loading}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <MetricCard
                    title="Low Stock"
                    value={metrics?.lowStockCount || 0}
                    icon={<WarningAmberIcon />}
                    loading={loading}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <MetricCard
                    title="Pending Reviews"
                    value={metrics?.pendingReviewsCount || 0}
                    icon={<RateReviewIcon />}
                    loading={loading}
                />
            </Grid>
        </Grid>
    );
}
