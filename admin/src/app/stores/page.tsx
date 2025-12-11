'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import api from '@/lib/api';
import { Store } from '@/types';
import { PageHeader, DataTable, EmptyState } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch stores');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/stores/${id}`);
      setStores(stores.filter(s => s._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner message="Loading stores..." />;

  if (stores.length === 0) {
    return (
      <Box>
        <PageHeader title="Stores" subtitle="Manage your stores" />
        <EmptyState
          message="No stores found. Create your first store!"
          actionLabel="Add Store"
          actionHref="/stores/new"
        />
      </Box>
    );
  }

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'domain', label: 'Domain' },
    { id: 'currency', label: 'Currency' },
    {
      id: 'isActive',
      label: 'Status',
      render: (row: Store) => <StatusChip active={row.isActive} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Stores"
        subtitle="Manage your stores"
        actionLabel="Add Store"
        actionHref="/stores/new"
      />
      <DataTable
        columns={columns}
        data={stores}
        editPath="/stores"
        onDelete={handleDelete}
      />
    </Box>
  );
}
