'use client';

import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import MetricCard from '@/components/molecules/MetricCard';
import ChartCard from '@/components/molecules/ChartCard';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface DashboardStats {
  products: number;
  categories: number;
  stores: number;
  orders: number;
}

// Sample data for charts
const revenueData = [
  { month: 'Jan', revenue: 4200, orders: 24 },
  { month: 'Feb', revenue: 3800, orders: 21 },
  { month: 'Mar', revenue: 5100, orders: 29 },
  { month: 'Apr', revenue: 4600, orders: 26 },
  { month: 'May', revenue: 6200, orders: 35 },
  { month: 'Jun', revenue: 7100, orders: 40 },
];

const categoryData = [
  { name: 'Electronics', value: 45 },
  { name: 'Clothing', value: 32 },
  { name: 'Food', value: 28 },
  { name: 'Books', value: 18 },
  { name: 'Others', value: 12 },
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    categories: 0,
    stores: 0,
    orders: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, storesRes] = await Promise.allSettled([
        api.get('/products'),
        api.get('/categories'),
        api.get('/stores'),
      ]);

      setStats({
        products: productsRes.status === 'fulfilled' ? (productsRes.value.data.data?.length || 0) : 0,
        categories: categoriesRes.status === 'fulfilled' ? (categoriesRes.value.data.data?.length || 0) : 0,
        stores: storesRes.status === 'fulfilled' ? (storesRes.value.data.data?.length || 0) : 0,
        orders: 0, // Placeholder
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening with your store today.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/products/new')}
        >
          Add Product
        </Button>
      </Box>

      {/* Metrics Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <MetricCard
          title="Total Products"
          value={loading ? '-' : stats.products}
          change={12.5}
          icon={<InventoryIcon />}
          loading={loading}
        />
        <MetricCard
          title="Categories"
          value={loading ? '-' : stats.categories}
          change={8.2}
          icon={<CategoryIcon />}
          loading={loading}
        />
        <MetricCard
          title="Active Stores"
          value={loading ? '-' : stats.stores}
          change={-2.4}
          icon={<StoreIcon />}
          loading={loading}
        />
        <MetricCard
          title="Total Orders"
          value={loading ? '-' : stats.orders}
          change={15.3}
          icon={<ShoppingCartIcon />}
          loading={loading}
        />
      </Box>

      {/* Charts Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'repeat(2, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <ChartCard
          title="Revenue Overview"
          subtitle="Monthly revenue and order trends"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4f46e5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Products by Category"
          subtitle="Distribution of products across categories"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                }}
              />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Box>

      {/* Quick Actions */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 1.5,
            mt: 2,
          }}
        >
          <Button
            variant="outlined"
            fullWidth
            onClick={() => router.push('/products/new')}
            sx={{ justifyContent: 'flex-start', py: 1.5 }}
          >
            Add Product
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => router.push('/categories/new')}
            sx={{ justifyContent: 'flex-start', py: 1.5 }}
          >
            Add Category
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => router.push('/stores/new')}
            sx={{ justifyContent: 'flex-start', py: 1.5 }}
          >
            Add Store
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => router.push('/sales')}
            sx={{ justifyContent: 'flex-start', py: 1.5 }}
          >
            View Sales
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
