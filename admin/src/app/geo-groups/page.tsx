'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import api from '@/lib/api';
import { GeoGroup } from '@/types';
import { PageHeader, DataTable, EmptyState } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';

export default function GeoGroupsPage() {
  const [geoGroups, setGeoGroups] = useState<GeoGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGeoGroups();
  }, []);

  const fetchGeoGroups = async () => {
    try {
      const response = await api.get('/geo-groups');
      setGeoGroups(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch geo groups');
      setGeoGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/geo-groups/${id}`);
      setGeoGroups(geoGroups.filter(g => g._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner message="Loading geo groups..." />;

  if (geoGroups.length === 0) {
    return (
      <Box>
        <PageHeader title="Geographic Groups" subtitle="Manage groups of locations" />
        <EmptyState
          message="No geo groups found. Create your first group!"
          actionLabel="Add Geo Group"
          actionHref="/geo-groups/new"
        />
      </Box>
    );
  }

  const columns = [
    { id: 'name', label: 'Name' },
    {
      id: 'description',
      label: 'Description',
      render: (row: GeoGroup) => row.description || '-',
    },
    {
      id: 'geos',
      label: 'Locations Count',
      render: (row: GeoGroup) => row.geos?.length || 0,
    },
    {
      id: 'isActive',
      label: 'Status',
      render: (row: GeoGroup) => <StatusChip active={row.isActive} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Geographic Groups"
        subtitle="Manage groups of locations"
        actionLabel="Add Geo Group"
        actionHref="/geo-groups/new"
      />
      <DataTable
        columns={columns}
        data={geoGroups}
        editPath="/geo-groups"
        onDelete={handleDelete}
      />
    </Box>
  );
}
