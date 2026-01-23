'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    Grid,
    Container,
} from '@mui/material';
import PageHeader from '@/components/molecules/PageHeader';
import { POSSession } from '@/types/pos';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function POSSessionsPage() {
    const params = useParams();
    const storeId = params.id as string;
    const { formatPrice, convertPrice, baseCurrency, loadStoreCurrency } = useCurrency();
    const [sessions, setSessions] = useState<POSSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalSessions: 0,
        activeSessions: 0,
        totalSales: 0,
    });

    useEffect(() => {
        if (storeId) {
            loadStoreCurrency(storeId);
        }
    }, [storeId]);

    useEffect(() => {
        fetchSessions();
    }, [storeId]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/pos/session/history?storeId=${storeId}&limit=50`);
            const sessionData = response.data.data.sessions || [];
            setSessions(sessionData);

            // Calculate stats
            const active = sessionData.filter((s: POSSession) => s.status === 'active').length;
            const total = sessionData.reduce((sum: number, s: POSSession) => sum + s.totalSales, 0);

            setStats({
                totalSessions: response.data.data.total || 0,
                activeSessions: active,
                totalSales: total,
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load POS sessions');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return format(new Date(date), 'MMM dd, yyyy hh:mm a');
    };

    const calculateCashVariance = (session: POSSession) => {
        if (!session.closingCash) return null;
        const expected = session.openingCash + (session.paymentBreakdown?.cash || 0);
        return session.closingCash - expected;
    };

    return (
        <Box sx={{ py: 3 }}>
            <PageHeader
                title="POS Sessions"
                subtitle="View and manage Point of Sale sessions"
                backUrl={`/stores`}
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

            {/* Sessions Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Session #</TableCell>
                            <TableCell>Started</TableCell>
                            <TableCell>Ended</TableCell>
                            <TableCell>Opening Cash</TableCell>
                            <TableCell>Closing Cash</TableCell>
                            <TableCell>Total Sales</TableCell>
                            <TableCell>Orders</TableCell>
                            <TableCell>Cash Variance</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : sessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    No sessions found
                                </TableCell>
                            </TableRow>
                        ) : (
                            sessions.map((session) => {
                                const variance = calculateCashVariance(session);
                                return (
                                    <TableRow key={session._id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {session.sessionNumber}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{formatDate(session.startedAt)}</TableCell>
                                        <TableCell>
                                            {session.endedAt ? formatDate(session.endedAt) : '-'}
                                        </TableCell>
                                        <TableCell>{formatPrice(session.openingCash, undefined, storeId)}</TableCell>
                                        <TableCell>
                                            {session.closingCash !== undefined
                                                ? formatPrice(session.closingCash, undefined, storeId)
                                                : '-'}
                                        </TableCell>
                                        <TableCell>{formatPrice(session.totalSales, undefined, storeId)}</TableCell>
                                        <TableCell>{session.totalOrders}</TableCell>
                                        <TableCell>
                                            {variance !== null ? (
                                                <Chip
                                                    label={formatPrice(variance, undefined, storeId)}
                                                    color={
                                                        variance === 0
                                                            ? 'success'
                                                            : variance > 0
                                                                ? 'warning'
                                                                : 'error'
                                                    }
                                                    size="small"
                                                />
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={session.status}
                                                color={
                                                    session.status === 'active' ? 'primary' : 'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
