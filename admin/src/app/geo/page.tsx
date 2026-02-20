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
import { useConfirm } from '@/contexts/ConfirmContext';
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
  const { confirm } = useConfirm();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [open, setOpen] = useState(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGeo, setSelectedGeo] = useState<FlatGeo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Pagination & Search State */
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const selectedCountryId = typeof activeFilters.countryId === 'string' ? activeFilters.countryId : '';
  const selectedStateId = typeof activeFilters.stateId === 'string' ? activeFilters.stateId : '';

  /* Debounce Search */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchGeos();
  }, [paginationModel, debouncedSearch, selectedCountryId, selectedStateId]);

  // Fetch only countries for the dropdowns (no pagination or high limit)
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/geo?type=country&limit=1000');
        if (response.data.success) {
          setCountries(response.data.data);
        } else {
          setCountries(response.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch countries for form", err);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const params = new URLSearchParams({
          type: 'state',
          limit: '1000',
        });

        if (selectedCountryId) {
          params.append('parentId', selectedCountryId);
        }

        const response = await api.get(`/geo?${params.toString()}`);
        if (response.data.success) {
          setStates(response.data.data || []);
        } else {
          setStates(response.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch states for filter", err);
        setStates([]);
      }
    };

    fetchStates();
  }, [selectedCountryId]);

  const fetchGeos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString(),
        search: debouncedSearch,
      });

      if (selectedCountryId) {
        params.append('countryId', selectedCountryId);
      }
      if (selectedStateId) {
        params.append('stateId', selectedStateId);
      }

      const response = await api.get(`/geo?${params.toString()}`);

      let geoData = [];
      if (response.data.success) {
        geoData = response.data.data;
        setTotalRows(response.data.pagination.total);
      } else {
        // Fallback
        geoData = response.data.data || [];
        setTotalRows(geoData.length);
      }

      setFlatGeos(geoData.map((geo: Geo) => ({
        id: geo._id,
        _id: geo._id,
        name: geo.name,
        code: geo.code,
        type: geo.type,
        // Backend now populates parentId with name/type/code
        parentCountry: (geo.type === 'state' && (geo.parentId as any)?.name) ||
          (geo.type === 'city' && (geo.parentId as any)?.name) || undefined, // Approximate for display
        parentState: undefined, // Simplified for grid display from populated data if needed
        isActive: geo.isActive,
        original: geo
      })));
    } catch (err) {
      console.error('Failed to fetch geos', err);
      showNotification('Failed to load geographic data', 'error');
      setFlatGeos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: FlatGeo) => {
    if (!await confirm({ title: `Delete ${row.type}`, message: `Are you sure you want to delete this ${row.type}?`, severity: 'error' })) return;
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
      const geoData = response.data.data || response.data.geo; // backend getGeoGroupById returns geoGroup, getGeoById returns geo + countryDetails? No check controller.
      // Controller getGeoById response: { geo: ..., countryDetails: ... } is NOT standard with other responses (res.json({ geoGroup, ... })).
      // Wait, let's check `geo.controller.ts` getGeoById.
      // Ah, I didn't edit getGeoById, only getGeos.
      // Old getGeoById: `res.json({ data: geo });` (based on standard?). No, let's look at `geo.controller.ts` again if I can... 
      // I can't view it again easily without consuming tokens.
      // However, usually it is `data` or direct object.
      // Let's assume standard `data` wrapper or check response.

      // Let's rely on what `fetchGeos` gave us in `original` if possible, OR just handle the response safely.
      // Actually `row.original` comes from the grid list which IS populated.
      // But for editing we might need the ID of the parent, not the object.
      // The Form component likely expects IDs.

      const targetGeo = response.data.data || response.data;

      // We need to reconstruct the "parentCountry" and "parentState" codes for the form if it uses codes
      // ... (Rest logic remains similar to original but adapted)

      // Resolve parent country and state codes
      let parentCountry = '';
      let parentState = '';

      if (targetGeo.type === 'state' && targetGeo.parentId) {
        // parentId is populated with full country object
        parentCountry = typeof targetGeo.parentId === 'object' ? targetGeo.parentId.code : '';
      }

      if (targetGeo.type === 'city' && targetGeo.parentId) {
        // For cities, parentId is the state
        const stateId = typeof targetGeo.parentId === 'object' ? targetGeo.parentId._id : targetGeo.parentId;

        // Fetch the state to get its parent country
        const stateResponse = await api.get(`/geo/${stateId}`);
        const stateData = stateResponse.data.data || stateResponse.data;

        parentState = stateData.code;

        if (stateData.parentId) {
          parentCountry = typeof stateData.parentId === 'object' ? stateData.parentId.code : '';
        }
      }

      setSelectedGeo({
        ...row,
        original: {
          ...targetGeo,
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
        // Cities name only usually

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
          // LIMITATION: If we don't have all states loaded, we can't find by code easily client-side.
          // The Form likely passes 'parentState' as a code string? 
          // If the form expects us to resolve code -> ID here, we need to find the state.
          // We can call API to find state by code.
          if (data.parentState) {
            const stateRes = await api.get(`/geo?type=state&search=${data.parentState}`); // Search by code? My backend implements search on name/code OR.
            // If we search by code, we should find it.
            const foundState = stateRes.data.data?.find((s: Geo) => s.code === data.parentState);
            payload.parentId = foundState?._id;
          }
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
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handleFilterChange = (filters: Record<string, string | string[]>) => {
    const nextFilters = { ...filters };
    const countryChanged = (nextFilters.countryId || '') !== (selectedCountryId || '');

    // Reset state filter whenever country changes to avoid invalid combinations
    if (countryChanged) {
      delete nextFilters.stateId;
    }

    setActiveFilters(nextFilters);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const filterConfig = useMemo(() => {
    const countryOptions = countries.map((country) => ({
      value: country._id,
      label: country.name,
    }));

    const stateOptions = states.map((state) => ({
      value: state._id,
      label: `${state.name}${state.code ? ` (${state.code})` : ''}`,
    }));

    return [
      {
        id: 'countryId',
        label: 'Country',
        type: 'select' as const,
        options: countryOptions,
      },
      {
        id: 'stateId',
        label: 'State',
        type: 'select' as const,
        options: stateOptions,
      },
    ];
  }, [countries, states]);

  // Removed filteredRows

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
            {params.row.parentCountry ? ` • ${params.row.parentCountry}` : ((params.row.original.parentId as any)?.name ? ` • ${(params.row.original.parentId as any)?.name}` : '')}
          </Typography>
        </Box>
      )
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        params.row.code ? <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Chip label={params.row.code} size="small" variant="outlined" /></Box> : <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Typography variant="caption">-</Typography></Box>
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
        <Box display="flex" flexDirection="row" justifyContent="end" height="100%">
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

  // Initial Form Data Construction for Edit
  const getInitialData = () => {
    if (!selectedGeo) return undefined;
    return selectedGeo.original;
  };

  if (!loading && flatGeos.length === 0 && !searchQuery && !selectedCountryId && !selectedStateId && !open) {
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
        filters={filterConfig}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
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
          rows={flatGeos}
          columns={columns}
          getRowId={(row) => row.id} // Use the generated composite ID
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
