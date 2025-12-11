'use client';

import { Box, Grid, Typography, Paper } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import StoreIcon from '@mui/icons-material/Store';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { StatCard } from '@/components/molecules';

export default function DashboardPage() {
  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to Infi Commerce Admin Panel
        </Typography>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<InventoryIcon />}
            title="Products"
            value="-"
            subtitle="Total Products"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<CategoryIcon />}
            title="Categories"
            value="-"
            subtitle="Total Categories"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<StoreIcon />}
            title="Stores"
            value="-"
            subtitle="Active Stores"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<LocalOfferIcon />}
            title="Sales"
            value="-"
            subtitle="Active Campaigns"
          />
        </Grid>
      </Grid>

      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          🚧 Dashboard Under Construction
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Analytics and statistics components will be added here.
        </Typography>
      </Paper>
    </Box>
  );
}
