'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Avatar, CircularProgress
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function LatestCustomersWidget() {
    const router = useRouter();
    const { convertAndFormat } = useCurrency();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLatestCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/dashboard/widgets/latest-customers');
            setCustomers(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch latest customers widget:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLatestCustomers();
    }, [fetchLatestCustomers]);

    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <PeopleIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>Latest Customers (20)</Typography>
                </Box>
                <Button
                    size="small"
                    endIcon={<ChevronRightIcon />}
                    onClick={() => router.push('/customers')}
                    sx={{ textTransform: 'none' }}
                >
                    View All
                </Button>
            </Box>

            <TableContainer sx={{ flex: 1, maxHeight: 300 }}>
                {loading ? (
                    <Box p={4} display="flex" justifyContent="center"><CircularProgress size={30} /></Box>
                ) : (
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="center">Orders</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Joined</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {customers.map((customer) => {
                                const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer';
                                return (
                                    <TableRow
                                        key={customer._id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => router.push(`/customers/${customer._id}`)}
                                    >
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'indigo.main' }}>
                                                    {fullName[0]}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={600}>{fullName}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{customer.email}</TableCell>
                                        <TableCell align="center">{customer.ordersCount || 0}</TableCell>
                                        <TableCell align="right">
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(customer.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
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
