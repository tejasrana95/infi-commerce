'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import api from '@/lib/api';
import { Geo } from '@/types';
import { PageHeader, DataTable, EmptyState } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';

export default function GeoPage() {
  const [geos, setGeos] = useState<Geo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGeos();
  }, []);

  const fetchGeos = async () => {
    try {
      const response = await api.get('/geo');
      setGeos(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch geos');
      setGeos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/geo/${id}`);
      setGeos(geos.filter(g => g._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner message="Loading geographic locations..." />;

  if (geos.length === 0) {
    return (
      <Box>
        <PageHeader title="Geographic Locations" subtitle="Manage countries, states, cities" />
        <EmptyState
          message="No geographic locations found. Add your first location!"
          actionLabel="Add Geo"
          actionHref="/geo/new"
        />
      </Box>
    );
  }

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'type', label: 'Type' },
    {
      id: 'code',
      label: 'Code',
      render: (row: Geo) => row.code || '-',
    },
    {
      id: 'isActive',
      label: 'Status',
      render: (row: Geo) => <StatusChip active={row.isActive} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Geographic Locations"
        subtitle="Manage countries, states, cities"
        actionLabel="Add Geo"
        actionHref="/geo/new"
      />
      <DataTable
        columns={columns}
        data={geos}
        editPath="/geo"
        onDelete={handleDelete}
      />
    </Box>
  );
}
