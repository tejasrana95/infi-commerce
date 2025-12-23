'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Button,
    Tooltip,
    IconButton,
    Chip,
    Typography,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { TaxRate } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import TaxForm from '@/components/organisms/TaxForm';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

interface TaxRow extends TaxRate {
    id: string;
}

export default function TaxSettingsPage() {
    const theme = useTheme();
    const { showNotification } = useNotification();
    const [taxRates, setTaxRates] = useState<TaxRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Dialog state
    const [open, setOpen] = useState(false);
    const [selectedTax, setSelectedTax] = useState<TaxRate | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTaxRates();
    }, []);

    const fetchTaxRates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tax-rates');
            const data = response.data.data || [];
            setTaxRates(data.map((tax: TaxRate) => ({ ...tax, id: tax._id })));
        } catch (err: any) {
            console.error('Failed to fetch tax rates', err);
            showNotification('Failed to load tax rates', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedTax(null);
        setOpen(true);
    };

    const handleEdit = (row: TaxRow) => {
        setSelectedTax(row);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setTimeout(() => setSelectedTax(null), 100);
    };

    const handleDelete = async (row: TaxRow) => {
        if (!confirm(`Are you sure you want to delete "${row.name}"?`)) return;
        try {
            await api.delete(`/tax-rates/${row._id}`);
            showNotification('Tax rate deleted successfully', 'success');
            fetchTaxRates();
        } catch (err: any) {
            showNotification(err.response?.data?.error || 'Failed to delete', 'error');
        }
    };

    const handleSubmit = async (data: Partial<TaxRate>) => {
        setIsSubmitting(true);
        try {
            if (selectedTax) {
                await api.put(`/tax-rates/${selectedTax._id}`, data);
                showNotification('Tax rate updated successfully', 'success');
            } else {
                await api.post('/tax-rates', data);
                showNotification('Tax rate created successfully', 'success');
            }
            fetchTaxRates();
            handleClose();
        } catch (err: any) {
            showNotification(err.response?.data?.error || 'Failed to save tax rate', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
    };

    const filteredRows = taxRates.filter((tax) => {
        const query = searchQuery.toLowerCase();
        return (
            tax.name.toLowerCase().includes(query) ||
            (tax.description && tax.description.toLowerCase().includes(query))
        );
    });

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Tax Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>{params.row.name}</Typography>
                    {params.row.description && (
                        <Typography variant="caption" color="text.secondary">
                            {params.row.description}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: 'rate',
            headerName: 'Rate',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Typography fontWeight={600}>{params.row.rate}%</Typography>
            ),
        },
        {
            field: 'isSplit',
            headerName: 'Type',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <Chip
                        label={params.row.isSplit ? 'Split Tax' : 'Simple'}
                        size="small"
                        color={params.row.isSplit ? 'primary' : 'default'}
                        variant="outlined"
                    />
                    {params.row.isSplit && params.row.subTaxes && (
                        <Box sx={{ mt: 0.5 }}>
                            {params.row.subTaxes.map((st: { name: string; rate: number }, i: number) => (
                                <Typography key={i} variant="caption" display="block" color="text.secondary">
                                    {st.name}: {st.rate}%
                                </Typography>
                            ))}
                        </Box>
                    )}
                </Box>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
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
            ),
        },
    ];

    if (loading) return <LoadingSpinner message="Loading tax rates..." />;

    if (taxRates.length === 0 && !searchQuery && !open) {
        return (
            <Box>
                <PageHeader
                    title="Tax Rates"
                    subtitle="Manage global tax rates for your products"
                    actionLabel="Add Tax Rate"
                    onAction={handleCreate}
                />
                <EmptyState
                    message="No tax rates configured. Add your first tax rate!"
                    actionLabel="Add Tax Rate"
                    onAction={handleCreate}
                />
                <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                    <DialogTitle>{selectedTax ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
                    <DialogContent dividers>
                        <TaxForm initialData={selectedTax} onSubmit={handleSubmit} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button type="submit" form="tax-form" variant="contained" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (selectedTax ? 'Update' : 'Create')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Tax Rates"
                subtitle="Manage global tax rates for your products"
                actionLabel="Add Tax Rate"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search tax rates..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
            />

            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row.id}
                    sx={dataGridStyles}
                    disableRowSelectionOnClick
                    getRowHeight={() => 'auto'}
                />
            </Box>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedTax ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
                <DialogContent dividers>
                    <TaxForm initialData={selectedTax} onSubmit={handleSubmit} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button type="submit" form="tax-form" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (selectedTax ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
