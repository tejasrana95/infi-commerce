'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import api from '@/lib/api';
import { BannerSlider } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

export default function BannerSlidersPage() {
    const router = useRouter();
    const theme = useTheme();
    const [sliders, setSliders] = useState<BannerSlider[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

    const fetchSliders = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filterStore) params.storeId = filterStore;
            if (filterStatus) params.isActive = filterStatus === 'active';

            const response = await api.get('/banner-sliders', { params });
            setSliders(response.data.sliders || []);
        } catch (error) {
            console.error('Error fetching banner sliders:', error);
            showNotification('Failed to load banner sliders', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSliders();
    }, [filterStore, filterStatus]);

    const handleEdit = (id: string) => {
        router.push(`/banner-sliders/${id}`);
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        try {
            await api.delete(`/banner-sliders/${deleteDialog.id}`);
            showNotification('Banner slider deleted successfully', 'success');
            fetchSliders();
        } catch (error) {
            console.error('Error deleting slider:', error);
            showNotification('Failed to delete banner slider', 'error');
        } finally {
            setDeleteDialog({ open: false, id: null });
        }
    };

    const getStoreName = (storeId: BannerSlider['storeId']) => {
        if (typeof storeId === 'object' && storeId?.name) {
            return storeId.name;
        }
        return storeId as string || '-';
    };

    const filteredSliders = useMemo(() => {
        if (!searchQuery) return sliders;
        const q = searchQuery.toLowerCase();
        return sliders.filter(s => s.name.toLowerCase().includes(q));
    }, [sliders, searchQuery]);

    const columns: GridColDef[] = [
        {
            field: 'icon',
            headerName: '',
            width: 50,
            sortable: false,
            renderCell: () => (
                <ViewCarouselIcon color="action" />
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
                    <Typography variant="caption" color="text.secondary">
                        {params.row.slides?.length || 0} slides
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'settings',
            headerName: 'Settings',
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center" height="100%">
                    <Chip
                        label={params.row.settings?.effect || 'slide'}
                        size="small"
                        variant="outlined"
                    />
                    {params.row.settings?.autoplay && (
                        <Chip
                            label={`${(params.row.settings?.interval || 3000) / 1000}s`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    )}
                </Box>
            ),
        },
        {
            field: 'storeId',
            headerName: 'Store',
            width: 130,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
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
            width: 100,
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

    if (loading && sliders.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <Box>
            <PageHeader
                title="Banner Sliders"
                subtitle="Manage rotating banner carousels for your storefront"
                actionLabel="Add Slider"
                onAction={() => router.push('/banner-sliders/new')}
            />

            <SearchFilterBar
                searchPlaceholder="Search sliders..."
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

            {filteredSliders.length === 0 ? (
                <EmptyState
                    message="No banner sliders found. Create a carousel to showcase multiple banners."
                    actionLabel="Add Slider"
                    onAction={() => router.push('/banner-sliders/new')}
                />
            ) : (
                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={filteredSliders}
                        columns={columns}
                        getRowId={(row) => row._id}
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 25 } },
                        }}
                        disableRowSelectionOnClick
                        sx={dataGridStyles}
                    />
                </Box>
            )}

            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
                <DialogTitle>Delete Banner Slider</DialogTitle>
                <DialogContent>Are you sure you want to delete this banner slider?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
