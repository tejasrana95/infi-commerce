'use client';

import { useEffect, useState, useMemo } from 'react';
import { Box, Button, Tooltip, IconButton, Chip, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { Geo } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import GeoForm from '@/components/organisms/GeoForm';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

interface FlatGeo {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  type: 'country' | 'state' | 'city';
  parentCountry?: string; // Code or Name
  parentState?: string;   // Code or Name
  isActive: boolean;
  original: any; // Keep ref to original object
}

export default function GeoPage() {
  const theme = useTheme();
  const [countries, setCountries] = useState<Geo[]>([]); // Store raw hierarchy for form
  const [states, setStates] = useState<Geo[]>([]);
  const [flatGeos, setFlatGeos] = useState<FlatGeo[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGeo, setSelectedGeo] = useState<FlatGeo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGeos();
  }, []);

  const fetchGeos = async () => {
    try {
      const response = await api.get('/geo');
      const geoData = response.data.data || [];

      const countriesData = geoData.filter((g: Geo) => g.type === 'country');
      const statesData = geoData.filter((g: Geo) => g.type === 'state');

      setCountries(countriesData);
      setStates(statesData);
      setFlatGeos(geoData.map((geo: Geo) => ({
        id: geo._id,
        _id: geo._id,
        name: geo.name,
        code: geo.code,
        type: geo.type,
        parentCountry: undefined, // Will be populated from parentId if needed
        parentState: undefined,
        isActive: geo.isActive,
        original: geo
      })));
    } catch (err) {
      console.error('Failed to fetch geos', err);
      showNotification('Failed to load geographic data', 'error');
      setCountries([]);
      setStates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: FlatGeo) => {
    if (!confirm(`Are you sure you want to delete this ${row.type}?`)) return;
    try {
      await api.delete(`/geo/${row._id}`);
      setFlatGeos(prev => prev.filter(g => g.id !== row.id));
      showNotification('Location deleted successfully', 'success');
      fetchGeos();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleCreate = () => {
    setSelectedGeo(null);
    setOpen(true);
  };

  const handleEdit = async (row: FlatGeo) => {
    try {
      // Fetch full geo data from API to get populated parentId
      const response = await api.get(`/geo/${row._id}`);
      const geoData = response.data.data;

      // Resolve parent country and state codes
      let parentCountry = '';
      let parentState = '';

      if (geoData.type === 'state' && geoData.parentId) {
        // parentId is populated with full country object
        parentCountry = typeof geoData.parentId === 'object' ? geoData.parentId.code : '';
      }

      if (geoData.type === 'city' && geoData.parentId) {
        // For cities, parentId is the state
        const stateId = typeof geoData.parentId === 'object' ? geoData.parentId._id : geoData.parentId;

        // Fetch the state to get its parent country
        const stateResponse = await api.get(`/geo/${stateId}`);
        const stateData = stateResponse.data.data;

        parentState = stateData.code;

        if (stateData.parentId) {
          parentCountry = typeof stateData.parentId === 'object' ? stateData.parentId.code : '';
        }
      }

      setSelectedGeo({
        ...row,
        original: {
          ...geoData,
          parentCountry,
          parentState,
        }
      });
      setOpen(true);
    } catch (error) {
      console.error('Failed to fetch geo data:', error);
      showNotification('Failed to load location data', 'error');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => setSelectedGeo(null), 100);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (selectedGeo) {
        // --- UPDATE FLOW ---
        const payload: any = {
          name: data.name,
          isActive: data.isActive,
        };

        if (data.type === 'country') {
          payload.code = data.countryCode;
          payload.isShippingAvailable = data.isShippingAvailable;
        } else if (data.type === 'state') {
          payload.code = data.code;
        }

        await api.put(`/geo/${selectedGeo._id}`, payload);
        showNotification('Location updated successfully', 'success');
      } else {
        // --- CREATE FLOW ---
        const payload: any = {
          name: data.name,
          type: data.type,
          isActive: data.isActive,
        };

        if (data.type === 'country') {
          payload.code = data.countryCode;
          payload.isShippingAvailable = data.isShippingAvailable;
        } else if (data.type === 'state') {
          payload.code = data.code;
          const country = countries.find(c => c.code === data.parentCountry);
          payload.parentId = country?._id;
        } else if (data.type === 'city') {
          // Find state by fetching all geos
          const allGeos = await api.get('/geo');
          const state = allGeos.data.data.find((g: Geo) =>
            g.type === 'state' && g.code === data.parentState
          );
          payload.parentId = state?._id;
        }

        await api.post('/geo', payload);
        showNotification('Location created successfully', 'success');
      }
      fetchGeos();
      handleClose();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.message || err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const filteredRows = flatGeos.filter((geo) => {
    const query = searchQuery.toLowerCase();
    return (
      (geo.name && geo.name.toLowerCase().includes(query)) ||
      (geo.code && geo.code.toLowerCase().includes(query)) ||
      (geo.parentCountry && geo.parentCountry.toLowerCase().includes(query))
    );
  });

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2" fontWeight={600}>{params.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.type.toUpperCase()}
            {params.row.parentState ? ` • ${params.row.parentState}` : ''}
            {params.row.parentCountry ? ` • ${params.row.parentCountry}` : ''}
          </Typography>
        </Box>
      )
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        params.row.code ? <Chip label={params.row.code} size="small" variant="outlined" /> : <Typography variant="caption">-</Typography>
      )
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => <StatusChip active={params.value as boolean} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleEdit(params.row)} size="small" color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDelete(params.row)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  if (loading) return <LoadingSpinner message="Loading geographic locations..." />;

  // Initial Form Data Construction for Edit
  const getInitialData = () => {
    if (!selectedGeo) return undefined;
    return selectedGeo.original;
  };

  if (flatGeos.length === 0 && !searchQuery && !open) {
    return (
      <Box>
        <PageHeader
          title="Geographic Locations"
          subtitle="Manage countries, states, cities"
          actionLabel="Add Geo"
          onAction={handleCreate}
        />
        <EmptyState
          message="No geographic locations found. Add your first location!"
          actionLabel="Add Geo"
          onAction={handleCreate}
        />
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{selectedGeo ? `Edit ${selectedGeo.type}` : 'Add Location'}</DialogTitle>
          <DialogContent dividers>
            <GeoForm
              initialData={getInitialData()}
              onSubmit={handleSubmit}
              availableCountries={countries}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" form="geo-form" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (selectedGeo ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Geographic Locations"
        subtitle="Manage countries, states, cities"
        actionLabel="Add Geo"
        onAction={handleCreate}
      />

      <SearchFilterBar
        searchPlaceholder="Search locations..."
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.id} // Use the generated composite ID
          sx={dataGridStyles}
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{selectedGeo ? `Edit ${selectedGeo.type}` : 'Add Location'}</DialogTitle>
        <DialogContent dividers>
          <GeoForm
            initialData={getInitialData()}
            onSubmit={handleSubmit}
            availableCountries={countries}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="geo-form" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (selectedGeo ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
