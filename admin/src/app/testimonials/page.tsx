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

export default function TestimonialsPage() {
    const router = useRouter();
    const theme = useTheme();
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filterStore) params.storeId = filterStore;
            if (filterStatus) params.isActive = filterStatus === 'active';

            const response = await api.get('/testimonials', { params });
            setTestimonials(response.data.testimonials || []);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            showNotification('Failed to load testimonials', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, [filterStore, filterStatus]);

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

    const filteredTestimonials = useMemo(() => {
        if (!searchQuery) return testimonials;
        const q = searchQuery.toLowerCase();
        return testimonials.filter(t =>
            t.customerName.toLowerCase().includes(q) ||
            t.content.toLowerCase().includes(q)
        );
    }, [testimonials, searchQuery]);

    const columns: GridColDef[] = [
        {
            field: 'customerImage',
            headerName: '',
            width: 60,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Avatar src={params.row.customerImage}>
                    <PersonIcon />
                </Avatar>
            ),
        },
        {
            field: 'customerName',
            headerName: 'Customer',
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
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
            ),
        },
        {
            field: 'rating',
            headerName: 'Rating',
            width: 130,
            renderCell: (params: GridRenderCellParams) => (
                params.row.rating ? (
                    <Rating value={params.row.rating} readOnly size="small" />
                ) : (
                    <Typography variant="caption" color="text.secondary">-</Typography>
                )
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

    if (loading && testimonials.length === 0) {
        return <LoadingSpinner />;
    }

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

            {filteredTestimonials.length === 0 ? (
                <EmptyState
                    message="No testimonials found. Get started by adding customer testimonials."
                    actionLabel="Add Testimonial"
                    onAction={() => router.push('/testimonials/new')}
                />
            ) : (
                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={filteredTestimonials}
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
