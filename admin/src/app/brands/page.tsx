'use client';

import { useEffect, useState, useMemo } from 'react';
import { Box, Button, Tooltip, IconButton, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Avatar } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { Brand } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import BrandForm from '@/components/organisms/BrandForm';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

export default function BrandsPage() {
    const theme = useTheme();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const response = await api.get('/brands');
            setBrands(response.data.brands || []);
        } catch (err) {
            console.error('Failed to fetch brands', err);
            showNotification('Failed to load brands', 'error');
            setBrands([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (brand: Brand) => {
        if (!confirm(`Are you sure you want to delete ${brand.name}?`)) return;
        try {
            await api.delete(`/brands/${brand._id}`);
            setBrands(prev => prev.filter(b => b._id !== brand._id));
            showNotification('Brand deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete', 'error');
        }
    };

    const handleCreate = () => {
        setSelectedBrand(null);
        setDialogOpen(true);
    };

    const handleEdit = (brand: Brand) => {
        setSelectedBrand(brand);
        setDialogOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
        setTimeout(() => setSelectedBrand(null), 100);
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (selectedBrand) {
                await api.put(`/brands/${selectedBrand._id}`, data);
                showNotification('Brand updated successfully', 'success');
            } else {
                await api.post('/brands', data);
                showNotification('Brand created successfully', 'success');
            }
            fetchBrands();
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

    const handleStoreFilterChange = (value: string) => {
        setFilterStore(value);
    };

    const filteredRows = brands.filter((brand) => {
        const query = searchQuery.toLowerCase();

        // Search filter
        const matchesSearch = !searchQuery || (
            (brand.name && brand.name.toLowerCase().includes(query)) ||
            (brand.slug && brand.slug.toLowerCase().includes(query))
        );

        // Store filter
        const brandStoreId = typeof brand.storeId === 'object' && brand.storeId !== null
            ? brand.storeId._id
            : brand.storeId;
        const matchesStore = !filterStore || brandStoreId === filterStore;

        return matchesSearch && matchesStore;
    });

    const getStoreName = (storeId: any) => {
        if (typeof storeId === 'object' && storeId !== null) {
            return storeId.name;
        }
        return '-';
    };

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" gap={1.5} height="100%">
                    {params.row.logo && (
                        <Avatar src={params.row.logo} alt={params.row.name} sx={{ width: 32, height: 32 }} />
                    )}
                    <Box display="flex" flexDirection="column" justifyContent="center">
                        <Typography variant="body2" fontWeight={600}>{params.row.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{params.row.slug}</Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'storeId',
            headerName: 'Store',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
            ),
        },
        {
            field: 'website',
            headerName: 'Website',
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                params.row.website ? (
                    <Typography variant="caption" color="primary" noWrap>
                        <a href={params.row.website} target="_blank" rel="noopener noreferrer">
                            {params.row.website}
                        </a>
                    </Typography>
                ) : (
                    <Typography variant="caption" color="text.secondary">-</Typography>
                )
            ),
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
            ),
        },
    ];

    if (loading) return <LoadingSpinner message="Loading brands..." />;

    if (brands.length === 0 && !searchQuery && !filterStore && !dialogOpen) {
        return (
            <Box>
                <PageHeader
                    title="Brands"
                    subtitle="Manage product brands"
                    actionLabel="Add Brand"
                    onAction={handleCreate}
                />
                <EmptyState
                    message="No brands found. Add your first brand!"
                    actionLabel="Add Brand"
                    onAction={handleCreate}
                />
                <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
                    <DialogTitle>{selectedBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
                    <DialogContent dividers>
                        <BrandForm
                            initialData={selectedBrand}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button type="submit" form="brand-form" variant="contained" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (selectedBrand ? 'Update' : 'Create')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Brands"
                subtitle="Manage product brands"
                actionLabel="Add Brand"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search brands..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                showStoreFilter
                storeFilterValue={filterStore}
                onStoreFilterChange={handleStoreFilterChange}
            />

            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row._id}
                    sx={dataGridStyles}
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                />
            </Box>

            <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{selectedBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
                <DialogContent dividers>
                    <BrandForm
                        initialData={selectedBrand}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button type="submit" form="brand-form" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (selectedBrand ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
