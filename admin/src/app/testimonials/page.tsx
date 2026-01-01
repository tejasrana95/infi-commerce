'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Avatar, Rating, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import api from '@/lib/api';
import { Testimonial } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';
import { useDebounce } from '@/hooks/useDebounce';

export default function TestimonialsPage() {
    const router = useRouter();
    const theme = useTheme();
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Pagination & Filter states
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [totalRows, setTotalRows] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    const debouncedSearch = useDebounce(searchQuery, 500);

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debouncedSearch,
            };
            if (filterStore) params.storeId = filterStore;
            if (filterStatus) params.isActive = filterStatus === 'active';

            const response = await api.get('/testimonials', { params });
            // Handle potentially different response structure if backend returns { data: [], pagination: {} } vs { testimonials: [], pagination: {} }
            // Using testimonials based on previous files, but falling back to data if needed
            setTestimonials(response.data.testimonials || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            showNotification('Failed to load testimonials', 'error');
            setTestimonials([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, [paginationModel, debouncedSearch, filterStore, filterStatus]);

    const handleEdit = (id: string) => {
        router.push(`/testimonials/${id}`);
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        try {
            await api.delete(`/testimonials/${deleteDialog.id}`);
            showNotification('Testimonial deleted successfully', 'success');
            fetchTestimonials();
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            showNotification('Failed to delete testimonial', 'error');
        } finally {
            setDeleteDialog({ open: false, id: null });
        }
    };

    const getStoreName = (storeId: Testimonial['storeId']) => {
        if (typeof storeId === 'object' && storeId?.name) {
            return storeId.name;
        }
        return storeId as string || '-';
    };



    const columns: GridColDef[] = [
        {
            field: 'customerImage',
            headerName: '',
            width: 60,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Avatar src={params.row.customerImage}>
                        <PersonIcon />
                    </Avatar>
                </Box>
            ),
        },
        {
            field: 'customerName',
            headerName: 'Customer',
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={() => handleEdit(params.row._id)}
                    >
                        {params.row.customerName}
                    </Typography>
                    {params.row.customerTitle && (
                        <Typography variant="caption" color="text.secondary">
                            {params.row.customerTitle}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: 'content',
            headerName: 'Testimonial',
            flex: 1,
            minWidth: 300,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        &ldquo;{params.row.content}&rdquo;
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'rating',
            headerName: 'Rating',
            width: 130,
            renderCell: (params: GridRenderCellParams) => (
                params.row.rating ? (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                        <Rating value={params.row.rating} readOnly size="small" />
                    </Box>
                ) : (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                        <Typography variant="caption" color="text.secondary">-</Typography>
                    </Box>
                )
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
                title="Testimonials"
                subtitle="Manage customer testimonials and reviews"
                actionLabel="Add Testimonial"
                onAction={() => router.push('/testimonials/new')}
            />

            <SearchFilterBar
                searchPlaceholder="Search testimonials..."
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

            {!loading && testimonials.length === 0 && !searchQuery && !filterStore && !filterStatus ? (
                <EmptyState
                    message="No testimonials found. Get started by adding customer testimonials."
                    actionLabel="Add Testimonial"
                    onAction={() => router.push('/testimonials/new')}
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
                        rows={testimonials}
                        columns={columns}
                        getRowId={(row) => row._id}
                        paginationMode="server"
                        rowCount={totalRows}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[10, 25, 50]}
                        disableRowSelectionOnClick
                        rowHeight={70}
                        sx={dataGridStyles}
                        loading={loading}
                    />
                </Box>
            )}

            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
                <DialogTitle>Delete Testimonial</DialogTitle>
                <DialogContent>Are you sure you want to delete this testimonial?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
