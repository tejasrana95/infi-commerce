'use client';

import { useEffect, useState, useMemo } from 'react';
import { Box, Button, Tooltip, IconButton, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Avatar } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import api from '@/lib/api';
import { Brand } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar, BulkActionBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip, PermissionGuard, SeoScoreBadge } from '@/components/atoms';
import BrandForm from '@/components/organisms/BrandForm';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';

export default function BrandsPage() {
    const theme = useTheme();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);
    const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set<string>() });

    const getSelectedIds = (): string[] => {
        if (selectionModel.type === 'include') return Array.from(selectionModel.ids) as string[];
        return brands.map(b => b._id).filter(id => !selectionModel.ids.has(id));
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');

    // Pagination state
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [totalRows, setTotalRows] = useState(0);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchBrands();
    }, [paginationModel, debouncedSearch, filterStore]);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(paginationModel.page + 1));
            params.append('limit', String(paginationModel.pageSize));
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filterStore) params.append('storeId', filterStore);

            const response = await api.get(`/brands?${params.toString()}`);
            setBrands(response.data.brands || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (err) {
            console.error('Failed to fetch brands', err);
            showNotification('Failed to load brands', 'error');
            setBrands([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAction = async (action: string) => {
        const ids = getSelectedIds();
        if (ids.length === 0) return;
        const actionLabels: Record<string, string> = { delete: 'delete', activate: 'activate', deactivate: 'deactivate' };
        if (!await confirm({ title: `Bulk ${actionLabels[action]}`, message: `Are you sure you want to ${actionLabels[action]} ${ids.length} brand(s)?`, severity: action === 'delete' ? 'error' : 'warning' })) return;
        try {
            await api.post('/brands/bulk-action', { ids, action });
            showNotification(`Bulk ${action} completed`, 'success');
            setSelectionModel({ type: 'include', ids: new Set<string>() });
            fetchBrands();
        } catch (err: any) {
            showNotification(err.response?.data?.message || `Bulk ${action} failed`, 'error');
        }
    };

    const handleDelete = async (brand: Brand) => {
        if (!await confirm({ title: 'Delete Brand', message: `Are you sure you want to delete ${brand.name}?`, severity: 'error' })) return;
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
                <Box display="flex" flexDirection="row" gap={1} justifyContent="start" alignItems="center" height="100%">
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
                <Box display="flex" flexDirection="row" justifyContent="center" alignItems="center" height="100%">
                    <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'website',
            headerName: 'Website',
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                params.row.website ? (
                    <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                        <Typography variant="caption" color="primary" noWrap>
                            <a href={params.row.website} target="_blank" rel="noopener noreferrer">
                                {params.row.website}
                            </a>
                        </Typography>
                    </Box>
                ) : (
                    <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><Typography variant="caption" color="text.secondary">-</Typography></Box>
                )
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams) => <Box display="flex" flexDirection="column" justifyContent="center" height="100%"><StatusChip active={params.value as boolean} /></Box>,
        },
        {
            field: 'seo',
            headerName: 'SEO Score',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <SeoScoreBadge score={params.row.seo?.score} />
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            align: 'right',
            headerAlign: 'right',
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" justifyContent="center" height="100%">
                    <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(params.row)} size="small" color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <PermissionGuard deniedRoles={['store_admin']}>
                        <Tooltip title="Delete">
                            <IconButton onClick={() => handleDelete(params.row)} size="small" color="error">
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </PermissionGuard>
                </Box>
            ),
        },
    ];

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
                showStoreFilter={user?.role !== 'store_admin'}
                storeFilterValue={filterStore}
                onStoreFilterChange={handleStoreFilterChange}
            />

            <Box sx={{ width: '100%' }}>
                {loading ? <LoadingSpinner message="Loading brands..." /> : <DataGrid
                    rows={brands}
                    columns={columns}
                    getRowId={(row) => row._id}
                    sx={dataGridStyles}
                    checkboxSelection
                    rowSelectionModel={selectionModel}
                    onRowSelectionModelChange={setSelectionModel}
                    pageSizeOptions={[10, 25, 50]}
                    paginationMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    loading={loading}
                />}
                <BulkActionBar
                    selectedCount={getSelectedIds().length}
                    onClear={() => setSelectionModel({ type: 'include', ids: new Set<string>() })}
                    actions={[
                        { label: 'Delete', icon: <DeleteIcon />, color: 'error', onClick: () => handleBulkAction('delete') },
                        { label: 'Activate', icon: <CheckCircleIcon />, color: 'success', onClick: () => handleBulkAction('activate') },
                        { label: 'Deactivate', icon: <BlockIcon />, color: 'warning', onClick: () => handleBulkAction('deactivate') },
                    ]}
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
