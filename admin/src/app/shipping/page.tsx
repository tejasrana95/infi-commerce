'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import api from '@/lib/api';
import { ShippingRule } from '@/types';
import { PageHeader, DataTable, EmptyState } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';

export default function ShippingPage() {
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShippingRules();
  }, []);

  const fetchShippingRules = async () => {
    try {
      const response = await api.get('/shipping');
      setShippingRules(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch shipping rules');
      setShippingRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/shipping/${id}`);
      setShippingRules(shippingRules.filter(s => s._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner message="Loading shipping rules..." />;

  if (shippingRules.length === 0) {
    return (
      <Box>
        <PageHeader title="Shipping Rules" subtitle="Manage shipping rates and rules" />
        <EmptyState
          message="No shipping rules found. Create your first rule!"
          actionLabel="Add Shipping Rule"
          actionHref="/shipping/new"
        />
      </Box>
    );
  }

  const columns = [
    { id: 'name', label: 'Name' },
    {
      id: 'shippingCost',
      label: 'Cost',
      render: (row: ShippingRule) => `$${row.shippingCost.toFixed(2)}`,
    },
    {
      id: 'weightRange',
      label: 'Weight Range',
      render: (row: ShippingRule) => `${row.minWeight || 0} - ${row.maxWeight || '∞'} kg`,
    },
    {
      id: 'estimatedDays',
      label: 'Delivery Days',
      render: (row: ShippingRule) => row.estimatedDays ? `${row.estimatedDays} days` : '-',
    },
    {
      id: 'isActive',
      label: 'Status',
      render: (row: ShippingRule) => <StatusChip active={row.isActive} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Shipping Rules"
        subtitle="Manage shipping rates and rules"
        actionLabel="Add Shipping Rule"
        actionHref="/shipping/new"
      />
      <DataTable
        columns={columns}
        data={shippingRules}
        editPath="/shipping"
        onDelete={handleDelete}
      />
    </Box>
  );
}
