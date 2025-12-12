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
  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await api.get('/currencies');
      setCurrencies(response.data.currencies || response.data);
    } catch (err) {
      console.error('Failed to fetch currencies');
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this currency?')) return;
    try {
      await api.delete(`/currencies/${id}`);
      setCurrencies(currencies.filter(c => c._id !== id));
      showNotification('Currency deleted successfully', 'success');
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
        const updated = response.data.data || response.data;
        setCurrencies(currencies.map(c => c._id === updated._id ? updated : c));
      } else {
        // Create
        const response = await api.post('/currencies', data);
        const created = response.data.data || response.data;
        setCurrencies([...currencies, created]);
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
          return <Typography variant="body2" fontFamily="'Roboto Mono', monospace">{val}</Typography>
        } catch (e) { return row.symbol }
      }
    },
    {
      field: 'exchangeRate',
      headerName: 'Exchange Rate',
      width: 150,
      display: 'flex',
      renderCell: (params: GridRenderCellParams) => params.row.isBaseCurrency ? <Chip label="Base" size="small" color="info" icon={<StarIcon />} /> : params.value
    },
    {
      field: 'isActive',
      headerName: 'Status',
      display: 'flex',
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
      display: 'flex',
      renderCell: (params: GridRenderCellParams) => (
        <Box>
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

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const filteredCurrencies = currencies.filter((currency) => {
    const query = searchQuery.toLowerCase();
    return (
      currency?.name?.toLowerCase().includes(query) ||
      currency?.code?.toLowerCase().includes(query) ||
      currency?.symbol?.toLowerCase().includes(query)
    );
  });

  if (loading) return <LoadingSpinner message="Loading currencies..." />;

  // Empty state can just use the handleCreate logic too
  if (currencies.length === 0 && !open) {
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
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredCurrencies}
          columns={columns}
          getRowId={(row) => row._id}
          sx={dataGridStyles}
          disableRowSelectionOnClick


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
