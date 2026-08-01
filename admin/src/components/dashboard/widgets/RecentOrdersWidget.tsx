'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface RecentOrdersWidgetProps {
    storeId: string;
}

export default function RecentOrdersWidget({ storeId }: RecentOrdersWidgetProps) {
    const router = useRouter();
    const { convertAndFormat } = useCurrency();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecentOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/dashboard/widgets/recent-orders?storeId=${storeId}`);
            setOrders(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch recent orders widget:', err);
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        fetchRecentOrders();
    }, [fetchRecentOrders]);

    const getStatusChip = (status: string) => {
        let color: 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default' = 'default';
        switch (status) {
            case 'pending': color = 'warning'; break;
            case 'processing': color = 'info'; break;
            case 'shipped': color = 'primary'; break;
            case 'delivered': color = 'success'; break;
            case 'cancelled': color = 'error'; break;
        }
        return <Chip label={status} size="small" color={color} sx={{ textTransform: 'capitalize', fontWeight: 500 }} />;
    };

    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>Recent Orders</Typography>
                <Button
                    size="small"
                    endIcon={<ChevronRightIcon />}
                    onClick={() => router.push('/orders')}
                    sx={{ textTransform: 'none' }}
                >
                    View All
                </Button>
            </Box>

            <TableContainer sx={{ flex: 1 }}>
                {loading ? (
                    <Box p={4} display="flex" justifyContent="center"><CircularProgress size={30} /></Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Order #</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => {
                                const customerName = order.customerId
                                    ? `${order.customerId.firstName || ''} ${order.customerId.lastName || ''}`.trim()
                                    : order.guestEmail || 'Guest';
                                return (
                                    <TableRow
                                        key={order._id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => router.push(`/orders/${order._id}`)}
                                    >
                                        <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                                            {order.orderNumber}
                                        </TableCell>
                                        <TableCell>{customerName}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {convertAndFormat(order.total, order.currency)}
                                        </TableCell>
                                        <TableCell>{getStatusChip(order.status)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>
        </Paper>
    );
}
