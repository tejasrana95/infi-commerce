'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import api from '@/lib/api';
import { Sale } from '@/types';
import { PageHeader, DataTable, EmptyState } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/sales/${id}`);
      setSales(sales.filter(s => s._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner message="Loading sales..." />;

  if (sales.length === 0) {
    return (
      <Box>
        <PageHeader title="Sales & Promotions" subtitle="Manage sales campaigns" />
        <EmptyState
          message="No sales campaigns found. Create your first sale!"
          actionLabel="Add Sale"
          actionHref="/sales/new"
        />
      </Box>
    );
  }

  const columns = [
    { id: 'name', label: 'Name' },
    {
      id: 'discount',
      label: 'Discount',
      render: (row: Sale) => `${row.discountValue}${row.discountType === 'percentage' ? '%' : ' fixed'}`,
    },
    {
      id: 'startDate',
      label: 'Start Date',
      render: (row: Sale) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      id: 'endDate',
      label: 'End Date',
      render: (row: Sale) => new Date(row.endDate).toLocaleDateString(),
    },
    {
      id: 'isActive',
      label: 'Status',
      render: (row: Sale) => <StatusChip active={row.isActive} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Sales & Promotions"
        subtitle="Manage sales campaigns"
        actionLabel="Add Sale"
        actionHref="/sales/new"
      />
      <DataTable
        columns={columns}
        data={sales}
        editPath="/sales"
        onDelete={handleDelete}
      />
    </Box>
  );
}
