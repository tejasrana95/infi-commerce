'use client';

import { useEffect, useState, useMemo } from 'react';
import { Box, Button, Tooltip, IconButton, Chip, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { GeoGroup, Geo } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import GeoGroupForm from '@/components/organisms/GeoGroupForm';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';

export default function GeoGroupsPage() {
  const theme = useTheme();
  const [geoGroups, setGeoGroups] = useState<GeoGroup[]>([]);
  const [availableGeos, setAvailableGeos] = useState<Geo[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog State
  const [open, setOpen] = useState(false);
  const [selectedGeoGroup, setSelectedGeoGroup] = useState<GeoGroup | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Pagination & Search State */
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  /* Debounce Search */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [paginationModel, debouncedSearch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString(),
        search: debouncedSearch,
      });

      const [groupsRes, geosRes] = await Promise.all([
        api.get(`/geo-groups?${params.toString()}`),
        api.get('/geo')
      ]);

      if (groupsRes.data.success) {
        setGeoGroups(groupsRes.data.geoGroups);
        setTotalRows(groupsRes.data.pagination.total);
      } else {
        setGeoGroups(groupsRes.data.data || groupsRes.data.geoGroups || []);
        setTotalRows(groupsRes.data.data?.length || 0);
      }

      // Filter to only countries for the form dropdown
      const allGeos = geosRes.data.data || geosRes.data || [];
      setAvailableGeos(allGeos.filter((g: Geo) => g.type === 'country'));
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Delete Geo Group', message: 'Are you sure you want to delete this group?', severity: 'error' })) return;
    try {
      await api.delete(`/geo-groups/${id}`);
      showNotification('Geo group deleted successfully', 'success');
      fetchData(); // Reload data
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleCreate = () => {
    setSelectedGeoGroup(undefined);
    setOpen(true);
  };

  const handleEdit = (id: string) => {
    const group = geoGroups.find(g => g._id === id);
    if (group) {
      setSelectedGeoGroup(group);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => setSelectedGeoGroup(undefined), 100);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (selectedGeoGroup) {
        // Update
        await api.put(`/geo-groups/${selectedGeoGroup._id}`, data);
        showNotification('Geo group updated successfully', 'success');
      } else {
        // Create
        await api.post('/geo-groups', data);
        showNotification('Geo group created successfully', 'success');
      }
      fetchData();
      handleClose();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Removed filteredGeoGroups

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Typography variant="body2" fontWeight={600}>{params.row.name}</Typography></Box>
      )
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Typography variant="body2" color="text.secondary" noWrap>
          {params.row.description || '-'}
        </Typography></Box>
      )
    },
    {
      field: 'locations',
      headerName: 'Locations',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Chip
          label={params.row.countries?.length || params.row.geos?.length || 0}
          size="small"
          variant="outlined"
        /></Box>
      )
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><StatusChip active={params.value as boolean} /></Box>,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="row" justifyContent="end" alignItems="center" height="100%">
          <Tooltip title="Edit">
            <IconButton onClick={() => handleEdit(params.row._id)} size="small" color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDelete(params.row._id)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  if (!loading && geoGroups.length === 0 && !searchQuery && !open) {
    return (
      <Box>
        <PageHeader
          title="Geographic Groups"
          subtitle="Manage groups of locations"
          actionLabel="Add Geo Group"
          onAction={handleCreate}
        />
        <EmptyState
          message="No geo groups found. Create your first group!"
          actionLabel="Add Geo Group"
          onAction={handleCreate}
        />
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{selectedGeoGroup ? 'Edit Geo Group' : 'Add Geo Group'}</DialogTitle>
          <DialogContent dividers>
            <GeoGroupForm
              initialData={selectedGeoGroup}
              onSubmit={handleSubmit}
              availableCountries={availableGeos}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" form="geo-group-form" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (selectedGeoGroup ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Geographic Groups"
        subtitle="Manage groups of locations"
        actionLabel="Add Geo Group"
        onAction={handleCreate}
      />

      <SearchFilterBar
        searchPlaceholder="Search geo groups..."
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <Box sx={{ width: '100%', position: 'relative' }}>
        {loading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.5)'
          }}>
            <LoadingSpinner />
          </Box>
        )}
        <DataGrid
          rows={geoGroups}
          columns={columns}
          getRowId={(row) => row._id}
          sx={dataGridStyles}
          disableRowSelectionOnClick

          paginationMode="server"
          rowCount={totalRows}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          loading={loading}
        />
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{selectedGeoGroup ? 'Edit Geo Group' : 'Add Geo Group'}</DialogTitle>
        <DialogContent dividers>
          <GeoGroupForm
            initialData={selectedGeoGroup}
            onSubmit={handleSubmit}
            availableCountries={availableGeos}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="geo-group-form" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (selectedGeoGroup ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
