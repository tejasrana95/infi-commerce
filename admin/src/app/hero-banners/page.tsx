'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import heroBannerService from '@/services/heroBanner.service';
import { HeroBanner } from '@/types/content';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';
import { useDebounce } from '@/hooks/useDebounce';

export default function HeroBannersPage() {
    const router = useRouter();
    const theme = useTheme();
    const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [totalRows, setTotalRows] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    const debouncedSearch = useDebounce(searchQuery, 500);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

    const fetchHeroBanners = async () => {
        try {
            setLoading(true);
            const response = await heroBannerService.getAll(filterStore || undefined);
            let banners = response.data.heroBanners || [];

            if (debouncedSearch) {
                banners = banners.filter(banner =>
                    banner.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                    (banner.title?.text && banner.title.text.toLowerCase().includes(debouncedSearch.toLowerCase()))
                );
            }

            if (filterStatus) {
                const isActiveFilter = filterStatus === 'active';
                banners = banners.filter(banner => banner.isActive === isActiveFilter);
            }

            setHeroBanners(banners);
            setTotalRows(banners.length);
        } catch (error) {
            console.error('Error fetching hero banners:', error);
            showNotification('Failed to load hero banners', 'error');
            setHeroBanners([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHeroBanners();
    }, [debouncedSearch, filterStore, filterStatus]);

    const handleEdit = (id: string) => {
        router.push(`/hero-banners/${id}`);
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        try {
            await heroBannerService.delete(deleteDialog.id);
            showNotification('Hero banner deleted successfully', 'success');
            fetchHeroBanners();
        } catch (error) {
            console.error('Error deleting hero banner:', error);
            showNotification('Failed to delete hero banner', 'error');
        } finally {
            setDeleteDialog({ open: false, id: null });
        }
    };

    const getStoreName = (storeId: HeroBanner['storeId']) => {
        if (typeof storeId === 'object' && storeId?.name) {
            return storeId.name;
        }
        return storeId as string || '-';
    };

    const columns: GridColDef[] = [
        {
            field: 'image',
            headerName: 'Image',
            width: 80,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    {params.row.image?.src ? (
                        <Box sx={{ width: 48, height: 48, borderRadius: '4px', overflow: 'hidden', border: '1px solid #ddd' }}>
                            <img src={params.row.image.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                    ) : (
                        <ImageIcon color="disabled" />
                    )}
                </Box>
            ),
        },
        {
            field: 'name',
            headerName: 'Name',
            width: 250,
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
                </Box>
            ),
        },
        {
            field: 'storeId',
            headerName: 'Store',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <StatusChip active={params.row.isActive} />
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" justifyContent="start" alignItems="center" height="100%">
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
                title="Hero Banners"
                subtitle="Create and manage structured storefront promotional hero banners"
                actionLabel="Add Hero Banner"
                onAction={() => router.push('/hero-banners/new')}
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

            {!loading && heroBanners.length === 0 ? (
                <EmptyState
                    message="No custom hero banners found. Add your first Hero Banner to showcase on the home page."
                    actionLabel="Add Hero Banner"
                    onAction={() => router.push('/hero-banners/new')}
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
                        rows={heroBanners}
                        columns={columns}
                        getRowId={(row) => row._id}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[10, 20, 50]}
                        disableRowSelectionOnClick
                        rowHeight={70}
                        sx={dataGridStyles}
                        loading={loading}
                    />
                </Box>
            )}

            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
                <DialogTitle>Delete Hero Banner</DialogTitle>
                <DialogContent>Are you sure you want to delete this hero banner?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
