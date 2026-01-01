'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { Currency } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import CurrencyForm from '@/components/organisms/CurrencyForm';
import { createDataGridStyles } from '@/utils/styles';

import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CurrenciesPage() {

  const theme = useTheme();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);
  // Dialog State
  const [open, setOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  /* Pagination & Search State */
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  /* Debounce Search */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  /* Fetch Data */
  useEffect(() => {
    fetchCurrencies();
  }, [paginationModel, debouncedSearch]);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString(),
        search: debouncedSearch,
      });

      const response = await api.get(`/currencies?${params.toString()}`);

      if (response.data.success) {
        setCurrencies(response.data.currencies);
        setTotalRows(response.data.pagination.total);
      } else {
        // Fallback for older API structure if needed, though backend is updated
        setCurrencies(response.data.currencies || []);
        setTotalRows(response.data.currencies?.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch currencies');
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Delete Currency', message: 'Are you sure you want to delete this currency?', severity: 'error' })) return;
    try {
      await api.delete(`/currencies/${id}`);
      showNotification('Currency deleted successfully', 'success');
      fetchCurrencies(); // Reload data
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleCreate = () => {
    setSelectedCurrency(undefined);
    setOpen(true);
  };

  const handleEdit = (id: string) => {
    const currency = currencies.find(c => c._id === id);
    if (currency) {
      setSelectedCurrency(currency);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => setSelectedCurrency(undefined), 100); // Clear after animation
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (selectedCurrency) {
        // Update
        const response = await api.put(`/currencies/${selectedCurrency._id}`, data);
        // Removed local state update, refetching instead
      } else {
        // Create
        const response = await api.post('/currencies', data);
      }
      handleClose();
      // Refetch if base currency changed to ensure others are updated correctly (if backend logic exists)
      fetchCurrencies();
      showNotification(selectedCurrency ? 'Currency updated successfully' : 'Currency created successfully', 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2" fontWeight={600} lineHeight={1.2}>{params.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.code}</Typography>
        </Box>
      )
    },
    {
      field: 'preview',
      headerName: 'Format Preview',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row as Currency;
        try {
          let formatted = (1234.56).toFixed(row.decimalPlaces || 2);
          const parts = formatted.split('.');
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, row.thousandsSeparator || ',');
          formatted = parts.join(row.decimalSeparator || '.');
          const val = row.symbolPosition === 'after' ? `${formatted}${row.symbol}` : `${row.symbol}${formatted}`;
          return <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Typography variant="body2" fontFamily="'Roboto Mono', monospace">{val}</Typography></Box>
        } catch (e) { return row.symbol }
      }
    },
    {
      field: 'exchangeRate',
      headerName: 'Exchange Rate',
      width: 150,
      display: 'flex',
      renderCell: (params: GridRenderCellParams) => params.row.isBaseCurrency ? <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Chip label="Base" size="small" color="info" icon={<StarIcon />} /></Box> : <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Typography variant="body2" fontWeight={600} lineHeight={1.2}>{params.value}</Typography></Box>
    },
    {
      field: 'isActive',
      headerName: 'Status',
      display: 'flex',
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
      display: 'flex',
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="row" alignItems="center" justifyContent="end" height="100%">
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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Removed filteredCurrencies as client-side filtering is no longer needed

  // Empty state can just use the handleCreate logic too
  if (!loading && currencies.length === 0 && !searchQuery && !open) {
    return (
      <Box>
        <PageHeader
          title="Currencies"
          subtitle="Manage currencies"
          actionLabel="Add Currency"
          onAction={handleCreate} // Changed from Href to onClick
        />
        <EmptyState
          message="No currencies found. Add your first currency!"
          actionLabel="Add Currency"
          onAction={handleCreate}
        />
        {/* Dialog needs to be here too for the first create */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{selectedCurrency ? 'Edit Currency' : 'Add Currency'}</DialogTitle>
          <DialogContent dividers>
            <CurrencyForm
              initialData={selectedCurrency}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" form="currency-form" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (selectedCurrency ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Currencies"
        subtitle="Manage currencies"
        actionLabel="Add Currency"
        onAction={handleCreate} // Changed from Href to onClick
      />

      <SearchFilterBar
        searchPlaceholder="Search currencies..."
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
          rows={currencies}
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
        <DialogTitle>{selectedCurrency ? 'Edit Currency' : 'Add Currency'}</DialogTitle>
        <DialogContent dividers>
          <CurrencyForm
            initialData={selectedCurrency}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="currency-form" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (selectedCurrency ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
