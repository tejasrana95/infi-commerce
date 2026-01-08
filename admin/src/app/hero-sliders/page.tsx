'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tooltip,
    useTheme
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import heroSliderService, { HeroSlider } from '@/services/heroSlider.service';
import { useNotification } from '@/contexts/NotificationContext';
// Using consistent components as seen in products/page.tsx
import { PageHeader, EmptyState } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { createDataGridStyles } from '@/utils/styles';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
// Re-importing StoreAutocomplete as it was required for creation
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';

export default function HeroSliderListPage() {
    const router = useRouter();
    const theme = useTheme();
    const { showNotification } = useNotification();
    const [sliders, setSliders] = useState<HeroSlider[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

    // For delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    useEffect(() => {
        fetchSliders();
    }, []);

    const fetchSliders = async () => {
        try {
            setLoading(true);
            const response = await heroSliderService.getAll();
            setSliders(response.data);
        } catch (error) {
            showNotification('Failed to load sliders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;

        try {
            // Create with default settings
            const response = await heroSliderService.create({
                name: newName,
                storeId: selectedStoreId!,
                slides: [],
                settings: {
                    width: 1920,
                    height: 800,
                    responsive: true,
                    autoPlay: true,
                    delay: 5000,
                    effect: 'fade'
                },
                isActive: true
            });

            showNotification('Hero Slider created', 'success');
            setCreateOpen(false);
            setNewName('');
            // Navigate to editor
            router.push(`/hero-sliders/${response.data._id}`);
        } catch (error) {
            showNotification('Failed to create slider', 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await heroSliderService.delete(deleteId);
            showNotification('Slider deleted', 'success');
            setSliders(sliders.filter(s => s._id !== deleteId));
            setDeleteId(null);
        } catch (error) {
            showNotification('Failed to delete slider', 'error');
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="body2" fontWeight={600}>
                        {params.value}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'slides',
            headerName: 'Slides',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="body2">
                        {params.row.slides?.length || 0}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><StatusChip active={params.value as boolean} /></Box>
            )
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="body2">
                        {new Date(params.value).toLocaleDateString()}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" gap={1}>
                    <Tooltip title="Edit">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => router.push(`/hero-sliders-edit/${params.row._id}`)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(params.row._id)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    if (!loading && sliders.length === 0) {
        return (
            <Box>
                <PageHeader
                    title="Hero Sliders"
                    subtitle="Manage your hero sliders"
                    actionLabel="Create New Slider"
                    onAction={() => setCreateOpen(true)}
                />
                <EmptyState
                    message="No sliders found. Create your first one!"
                    actionLabel="Create New Slider"
                    onAction={() => setCreateOpen(true)}
                />
                {/* Create Dialog - Needs to be present even in empty state */}
                <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Create New Hero Slider</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Slider Name"
                            fullWidth
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            sx={{ mb: 2, mt: 1 }}
                        />
                        <StoreAutocomplete
                            value={selectedStoreId}
                            onChange={(val) => setSelectedStoreId(val as string)}
                            label="Select Store"
                            required
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreate}
                            variant="contained"
                            disabled={!newName.trim() || !selectedStoreId}
                        >
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Hero Sliders"
                subtitle="Manage your hero sliders"
                actionLabel="Create New Slider"
                onAction={() => setCreateOpen(true)}
            />

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
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    }}>
                        <LoadingSpinner message="Loading sliders..." />
                    </Box>
                )}

                <DataGrid
                    rows={sliders}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    autoHeight
                />
            </Box>

            {/* Create Dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Hero Slider</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Slider Name"
                        fullWidth
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <StoreAutocomplete
                        value={selectedStoreId}
                        onChange={(val) => setSelectedStoreId(val as string)}
                        label="Select Store"
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={!newName.trim() || !selectedStoreId}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteId}
                title="Delete Slider"
                message="Are you sure you want to delete this slider? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </Box>
    );
}
