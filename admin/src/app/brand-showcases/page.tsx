'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Avatar, AvatarGroup, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import api from '@/lib/api';
import { BrandShowcase } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

export default function BrandShowcasesPage() {
    const router = useRouter();
    const theme = useTheme();
    const [showcases, setShowcases] = useState<BrandShowcase[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

    const fetchShowcases = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filterStore) params.storeId = filterStore;
            if (filterStatus) params.isActive = filterStatus === 'active';

            const response = await api.get('/brand-showcases', { params });
            setShowcases(response.data.showcases || []);
        } catch (error) {
            console.error('Error fetching brand showcases:', error);
            showNotification('Failed to load brand showcases', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShowcases();
    }, [filterStore, filterStatus]);

    const handleEdit = (id: string) => {
        router.push(`/brand-showcases/${id}`);
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        try {
            await api.delete(`/brand-showcases/${deleteDialog.id}`);
            showNotification('Brand showcase deleted successfully', 'success');
            fetchShowcases();
        } catch (error) {
            console.error('Error deleting showcase:', error);
            showNotification('Failed to delete brand showcase', 'error');
        } finally {
            setDeleteDialog({ open: false, id: null });
        }
    };

    const getStoreName = (storeId: BrandShowcase['storeId']) => {
        if (typeof storeId === 'object' && storeId?.name) {
            return storeId.name;
        }
        return storeId as string || '-';
    };

    const filteredShowcases = useMemo(() => {
        if (!searchQuery) return showcases;
        const q = searchQuery.toLowerCase();
        return showcases.filter(s => s.name.toLowerCase().includes(q));
    }, [showcases, searchQuery]);

    const columns: GridColDef[] = [
        {
            field: 'logos',
            headerName: 'Preview',
            width: 150,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                    {params.row.logos?.slice(0, 4).map((logo: any, idx: number) => (
                        <Avatar
                            key={idx}
                            src={logo.image}
                            variant="rounded"
                            sx={{ width: 32, height: 32, bgcolor: 'background.paper' }}
                        >
                            <ImageIcon fontSize="small" />
                        </Avatar>
                    ))}
                </AvatarGroup>
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
                        {params.row.logos?.length || 0} logos
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'layout',
            headerName: 'Layout',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.row.settings?.layout || 'grid'}
                    size="small"
                    variant="outlined"
                />
            ),
        },
        {
            field: 'columns',
            headerName: 'Columns',
            width: 80,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">{params.row.settings?.columns || 6}</Typography>
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

    if (loading && showcases.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <Box>
            <PageHeader
                title="Brand Showcases"
                subtitle="Manage brand logo collections for your storefront"
                actionLabel="Add Showcase"
                onAction={() => router.push('/brand-showcases/new')}
            />

            <SearchFilterBar
                searchPlaceholder="Search showcases..."
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

            {filteredShowcases.length === 0 ? (
                <EmptyState
                    message="No brand showcases found. Create a collection of brand logos to display on your store."
                    actionLabel="Add Showcase"
                    onAction={() => router.push('/brand-showcases/new')}
                />
            ) : (
                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={filteredShowcases}
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
                <DialogTitle>Delete Brand Showcase</DialogTitle>
                <DialogContent>Are you sure you want to delete this brand showcase?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
