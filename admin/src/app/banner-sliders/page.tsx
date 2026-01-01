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

    const [debouncedSearch, setDebouncedSearch] = useState('');

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

    const fetchSliders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', String(paginationModel.page + 1));
            params.append('limit', String(paginationModel.pageSize));
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filterStore) params.append('storeId', filterStore);
            if (filterStatus) params.append('isActive', filterStatus === 'active' ? 'true' : filterStatus === 'inactive' ? 'false' : '');

            const response = await api.get(`/banner-sliders?${params.toString()}`);
            setSliders(response.data.sliders || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (error) {
            console.error('Error fetching banner sliders:', error);
            showNotification('Failed to load banner sliders', 'error');
            setSliders([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSliders();
    }, [paginationModel, debouncedSearch, filterStore, filterStatus]);

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



    const columns: GridColDef[] = [
        {
            field: 'icon',
            headerName: '',
            width: 50,
            sortable: false,
            renderCell: () => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><ViewCarouselIcon color="action" /></Box>
            ),
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
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
                <Box display="flex" flexDirection="row" justifyContent="start" alignItems="center" gap={0.5} height="100%">
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
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <StatusChip active={params.row.isActive} />
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" justifyContent="center" alignItems="center" height="100%">
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

            {sliders.length === 0 && !searchQuery && !filterStore && !filterStatus ? (
                <EmptyState
                    message="No banner sliders found. Create a carousel to showcase multiple banners."
                    actionLabel="Add Slider"
                    onAction={() => router.push('/banner-sliders/new')}
                />
            ) : (
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
                        rows={sliders}
                        columns={columns}
                        getRowId={(row) => row._id}
                        pageSizeOptions={[10, 25, 50]}
                        paginationMode="server"
                        rowCount={totalRows}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        disableRowSelectionOnClick
                        sx={dataGridStyles}
                        loading={loading}
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
        </Box >
    );
}
