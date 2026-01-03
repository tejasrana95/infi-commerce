'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Avatar,
  List, ListItem, ListItemAvatar, ListItemText, Divider,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, FormControl, Select, MenuItem, InputLabel
} from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import PaidIcon from '@mui/icons-material/Paid';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RateReviewIcon from '@mui/icons-material/RateReview';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MetricCard from '@/components/molecules/MetricCard';
import ChartCard from '@/components/molecules/ChartCard';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

interface DashboardData {
  stats: {
    totalRevenue: number;
    ordersCount: number;
    customersCount: number;
    productsCount: number;
    lowStockCount: number;
    pendingReviewsCount: number;
  };
  recentOrders: any[];
  topProducts: any[];
  salesData: any[];
  statusDistribution: any[];
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

export default function DashboardPage() {
  const router = useRouter();
  const { formatPrice, convertAndFormat, baseCurrency } = useCurrency();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const canSelectStore = user?.role === 'super_admin' || user?.role === 'admin';

  const fetchStores = useCallback(async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data.data || response.data.stores || []);
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  }, []);

  useEffect(() => {
    if (canSelectStore) {
      fetchStores();
    }
  }, [canSelectStore, fetchStores]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const storeId = canSelectStore ? selectedStoreId : (user?.storeIds?.[0] || '');
      const response = await api.get(`/dashboard/stats?storeId=${storeId}`);
      setData(response.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.storeIds, canSelectStore, selectedStoreId]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, user]);

  const stats = data?.stats;

  if (loading && !data) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" height="60vh">
        <Typography variant="body1">Loading dashboard data...</Typography>
      </Box>
    );
  }

  return (
    <Box pb={4}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening with your store today.
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          {canSelectStore && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="store-selector-label">Select Store</InputLabel>
              <Select
                labelId="store-selector-label"
                value={selectedStoreId}
                label="Select Store"
                onChange={(e) => setSelectedStoreId(e.target.value)}
                sx={{ borderRadius: '8px', bgcolor: 'background.paper' }}
              >
                <MenuItem value="all">All Stores</MenuItem>
                {stores.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => router.push('/products/new')}
            sx={{ borderRadius: '8px', textTransform: 'none', height: '40px' }}
          >
            New Product
          </Button>
          <Button
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            onClick={() => router.push('/orders')}
            sx={{
              borderRadius: '8px',
              boxShadow: 'none',
              textTransform: 'none',
              height: '40px',
              '&:hover': { boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }
            }}
          >
            View Orders
          </Button>
        </Box>
      </Box>

      {/* Metrics Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <MetricCard
            title="Revenue"
            value={new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: baseCurrency?.code || 'USD',
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(stats?.totalRevenue || 0)}
            icon={<PaidIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <MetricCard
            title="Orders"
            value={stats?.ordersCount || 0}
            icon={<ShoppingCartIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <MetricCard
            title="Customers"
            value={stats?.customersCount || 0}
            icon={<PeopleIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <MetricCard
            title="Products"
            value={stats?.productsCount || 0}
            icon={<InventoryIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <MetricCard
            title="Low Stock"
            value={stats?.lowStockCount || 0}
            icon={<WarningAmberIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <MetricCard
            title="Pending Reviews"
            value={stats?.pendingReviewsCount || 0}
            icon={<RateReviewIcon />}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard title="Revenue Trend" subtitle="Daily revenue for the last 30 days">
            <Box height={350} mt={2}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.salesData || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="_id"
                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
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
                    labelFormatter={(str) => new Date(str).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    formatter={(val: number) => [formatPrice(val), 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartCard title="Order Status" subtitle="Distribution by current status">
            <Box height={350} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data?.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="_id"
                    stroke="none"
                  >
                    {(data?.statusDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2} mt={1}>
                {(data?.statusDistribution || []).map((entry, index) => (
                  <Box key={entry._id} display="flex" alignItems="center" gap={0.75}>
                    <Box width={10} height={10} borderRadius="50%" bgcolor={COLORS[index % COLORS.length]} />
                    <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                      {entry._id.replace('_', ' ')}: {entry.count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Bottom Row: Recent Orders and Top Products */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden' }}>
            <Box p={2.5} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>Recent Orders</Typography>
              <Button
                variant="text"
                size="small"
                endIcon={<ChevronRightIcon />}
                onClick={() => router.push('/orders')}
                sx={{ textTransform: 'none' }}
              >
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Order #</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.recentOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>No orders found</TableCell></TableRow>
                  ) : data?.recentOrders.map((order) => (
                    <TableRow
                      key={order._id}
                      hover
                      sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                      onClick={() => router.push(`/orders/${order._id}`)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{order.orderNumber}</TableCell>
                      <TableCell>
                        <Box display="flex" flexDirection="column">
                          <Typography variant="body2" fontWeight={500}>
                            {order.customerId
                              ? `${order.customerId.firstName} ${order.customerId.lastName}`
                              : order.shippingAddress?.firstName
                                ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
                                : 'Guest'
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.customerId?.email || order.guestEmail || order.shippingAddress?.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{convertAndFormat(order.total, order.currency, order.exchangeRate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status.replace('_', ' ')}
                          size="small"
                          sx={{
                            textTransform: 'capitalize',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            bgcolor:
                              order.status === 'delivered' ? 'success.50' :
                                order.status === 'cancelled' ? 'error.50' :
                                  order.status === 'pending' ? 'warning.50' : 'primary.50',
                            color:
                              order.status === 'delivered' ? 'success.700' :
                                order.status === 'cancelled' ? 'error.700' :
                                  order.status === 'pending' ? 'warning.700' : 'primary.700',
                            border: 'none'
                          }}
                        />
                      </TableCell>
                      <TableCell color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
            <Box p={2.5} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>Top Selling Products</Typography>
              <Button
                variant="text"
                size="small"
                endIcon={<ChevronRightIcon />}
                onClick={() => router.push('/products')}
                sx={{ textTransform: 'none' }}
              >
                View All
              </Button>
            </Box>
            <List sx={{ p: 0, flex: 1 }}>
              {data?.topProducts.length === 0 ? (
                <Box display="flex" justifyContent="center" p={4}>No data available</Box>
              ) : data?.topProducts.map((product, index) => (
                <React.Fragment key={product._id}>
                  <ListItem
                    alignItems="center"
                    sx={{ px: 2.5, py: 2, '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' } }}
                    onClick={() => router.push(`/products/${product._id}/edit`)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={product.featuredImage || product.images.length > 0 ? product.images[0] : ''}
                        sx={{ width: 56, height: 56, borderRadius: '10px', mr: 1, border: '1px solid #f1f3f5' }}
                      >
                        {product.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '220px' }}>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            {formatPrice(product.price)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box display="flex" justifyContent="space-between" mt={1}>
                          <Box display="flex" gap={1}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', bgcolor: '#f1f3f5', px: 0.8, py: 0.2, borderRadius: '4px' }}>
                              {product.sku}
                            </Typography>
                          </Box>
                          <Typography variant="caption" fontWeight={700} color="success.main">
                            {product.salesCount} Sales
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < data.topProducts.length - 1 && <Divider component="li" sx={{ mx: 2.5 }} />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
