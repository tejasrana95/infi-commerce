'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import api from '@/lib/api';
import { Currency } from '@/types';
import { PageHeader, DataTable, EmptyState } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await api.get('/currencies');
      setCurrencies(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch currencies');
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/currencies/${id}`);
      setCurrencies(currencies.filter(c => c._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner message="Loading currencies..." />;

  if (currencies.length === 0) {
    return (
      <Box>
        <PageHeader title="Currencies" subtitle="Manage currencies" />
        <EmptyState
          message="No currencies found. Add your first currency!"
          actionLabel="Add Currency"
          actionHref="/currencies/new"
        />
      </Box>
    );
  }

  const columns = [
    { id: 'code', label: 'Code' },
    { id: 'name', label: 'Name' },
    { id: 'symbol', label: 'Symbol' },
    { id: 'exchangeRate', label: 'Exchange Rate' },
    {
      id: 'isActive',
      label: 'Status',
      render: (row: Currency) => <StatusChip active={row.isActive} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Currencies"
        subtitle="Manage currencies"
        actionLabel="Add Currency"
        actionHref="/currencies/new"
      />
      <DataTable
        columns={columns}
        data={currencies}
        editPath="/currencies"
        onDelete={handleDelete}
      />
    </Box>
  );
}
