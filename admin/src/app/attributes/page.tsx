'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import api from '@/lib/api';
import { Attribute } from '@/types';
import { PageHeader, DataTable, EmptyState } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      const response = await api.get('/attributes');
      setAttributes(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch attributes');
      setAttributes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/attributes/${id}`);
      setAttributes(attributes.filter(a => a._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner message="Loading attributes..." />;

  if (attributes.length === 0) {
    return (
      <Box>
        <PageHeader title="Attributes" subtitle="Manage product attributes" />
        <EmptyState
          message="No attributes found. Create your first attribute!"
          actionLabel="Add Attribute"
          actionHref="/attributes/new"
        />
      </Box>
    );
  }

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'type', label: 'Type' },
    {
      id: 'values',
      label: 'Values',
      render: (row: Attribute) => row.values?.join(', ') || '-',
    },
    {
      id: 'isRequired',
      label: 'Required',
      render: (row: Attribute) => <StatusChip active={row.isRequired} activeLabel="Yes" inactiveLabel="No" />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Attributes"
        subtitle="Manage product attributes"
        actionLabel="Add Attribute"
        actionHref="/attributes/new"
      />
      <DataTable
        columns={columns}
        data={attributes}
        editPath="/attributes"
        onDelete={handleDelete}
      />
    </Box>
  );
}
