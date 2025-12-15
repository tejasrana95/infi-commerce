'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import api from '@/lib/api';
import { Banner } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

export default function BannersPage() {
    const router = useRouter();
    const theme = useTheme();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filterStore) params.storeId = filterStore;
            if (filterStatus) params.isActive = filterStatus === 'active';

            const response = await api.get('/banners', { params });
            setBanners(response.data.banners || []);
        } catch (error) {
            console.error('Error fetching banners:', error);
            showNotification('Failed to load banners', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, [filterStore, filterStatus]);

    const handleEdit = (id: string) => {
        router.push(`/banners/${id}`);
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        try {
            await api.delete(`/banners/${deleteDialog.id}`);
            showNotification('Banner deleted successfully', 'success');
            fetchBanners();
        } catch (error) {
            console.error('Error deleting banner:', error);
            showNotification('Failed to delete banner', 'error');
        } finally {
            setDeleteDialog({ open: false, id: null });
        }
    };

    const getStoreName = (storeId: Banner['storeId']) => {
        if (typeof storeId === 'object' && storeId?.name) {
            return storeId.name;
        }
        return storeId as string || '-';
    };

    const filteredBanners = useMemo(() => {
        if (!searchQuery) return banners;
        const q = searchQuery.toLowerCase();
        return banners.filter(b =>
            b.name.toLowerCase().includes(q) ||
            b.title?.toLowerCase().includes(q)
        );
    }, [banners, searchQuery]);

    const columns: GridColDef[] = [
        {
            field: 'image',
            headerName: 'Preview',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Avatar
                    variant="rounded"
                    src={params.row.image}
                    sx={{ width: 80, height: 45 }}
                >
                    <ImageIcon />
                </Avatar>
            ),
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={() => handleEdit(params.row._id)}
                    >
                        {params.row.name}
                    </Typography>
                    {params.row.title && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {params.row.title}
                        </Typography>
                    )}
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
            field: 'alignment',
            headerName: 'Alignment',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2" textTransform="capitalize">
                    {params.row.alignment}
                </Typography>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <StatusChip active={params.row.isActive} />
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(params.row._id)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, id: params.row._id })}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    if (loading && banners.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <Box>
            <PageHeader
                title="Banners"
                subtitle="Manage hero banners and promotional images"
                actionLabel="Add Banner"
                onAction={() => router.push('/banners/new')}
            />

            <SearchFilterBar
                searchPlaceholder="Search banners..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                showStoreFilter
                storeFilterValue={filterStore}
                onStoreFilterChange={setFilterStore}
                filters={[
                    {
                        id: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: '', label: 'All' },
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                        ],
                    },
                ]}
                activeFilters={{ status: filterStatus }}
                onFilterChange={(filters) => setFilterStatus(filters.status as string || '')}
            />

            {filteredBanners.length === 0 ? (
                <EmptyState
                    message="No banners found. Get started by creating your first banner."
                    actionLabel="Add Banner"
                    onAction={() => router.push('/banners/new')}
                />
            ) : (
                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={filteredBanners}
                        columns={columns}
                        getRowId={(row) => row._id}
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 25 } },
                        }}
                        disableRowSelectionOnClick
                        rowHeight={70}
                        sx={dataGridStyles}
                    />
                </Box>
            )}

            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
                <DialogTitle>Delete Banner</DialogTitle>
                <DialogContent>Are you sure you want to delete this banner?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
