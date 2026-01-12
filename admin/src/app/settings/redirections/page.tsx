'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    Box,
    Typography,
    CircularProgress,
    IconButton,
    Chip,
    Tooltip,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '@/components/molecules/PageHeader';
import { SearchFilterBar } from '@/components/molecules';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import api from '@/lib/api';
import { createDataGridStyles } from '@/utils/styles';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';

interface Redirection {
    _id: string;
    storeId: { _id: string; name: string } | string;
    origin_url: string;
    destination_url: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

interface RedirectionFormData {
    storeId: string;
    origin_url: string;
    destination_url: string;
    status: 'active' | 'inactive';
}

export default function RedirectionsPage() {
    const router = useRouter();
    const theme = useTheme();
    const { user, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    const [redirections, setRedirections] = useState<Redirection[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRows, setTotalRows] = useState(0);

    // Filters
    const [storeFilter, setStoreFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 20,
    });

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<RedirectionFormData>({
        storeId: '',
        origin_url: '',
        destination_url: '',
        status: 'active'
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'super_admin')) {
            router.push(user ? '/dashboard' : '/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && user.role === 'super_admin') {
            fetchRedirections();
        }
    }, [user, paginationModel, debouncedSearch, storeFilter, statusFilter]);

    const fetchRedirections = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(paginationModel.page + 1),
                limit: String(paginationModel.pageSize),
                ...(storeFilter && { storeId: storeFilter }),
                ...(statusFilter && { status: statusFilter }),
                ...(debouncedSearch && { search: debouncedSearch })
            });

            const response = await api.get(`/redirections?${params}`);
            setRedirections(response.data.data || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (error) {
            console.error('Failed to fetch redirections:', error);
            showNotification('Failed to load redirections', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (redirection?: Redirection) => {
        if (redirection) {
            setEditingId(redirection._id);
            setFormData({
                storeId: typeof redirection.storeId === 'object' ? redirection.storeId._id : redirection.storeId,
                origin_url: redirection.origin_url,
                destination_url: redirection.destination_url,
                status: redirection.status
            });
        } else {
            setEditingId(null);
            setFormData({
                storeId: '',
                origin_url: '',
                destination_url: '',
                status: 'active'
            });
        }
        setFormErrors({});
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingId(null);
        setFormData({
            storeId: '',
            origin_url: '',
            destination_url: '',
            status: 'active'
        });
        setFormErrors({});
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.storeId) {
            errors.storeId = 'Store is required';
        }

        if (!formData.origin_url) {
            errors.origin_url = 'Origin URL is required';
        } else if (!formData.origin_url.startsWith('/')) {
            errors.origin_url = 'Origin URL must start with /';
        }

        if (!formData.destination_url) {
            errors.destination_url = 'Destination URL is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setSubmitting(true);
            const response = editingId
                ? await api.put(`/redirections/${editingId}`, formData)
                : await api.post('/redirections', formData);

            showNotification(
                `Redirection ${editingId ? 'updated' : 'created'} successfully`,
                'success'
            );
            handleCloseDialog();
            fetchRedirections();
        } catch (error) {
            console.error('Failed to save redirection:', error);
            showNotification('Failed to save redirection', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({
            title: 'Delete Redirection',
            message: 'Are you sure you want to delete this redirection?',
            severity: 'error'
        })) return;

        try {
            await api.delete(`/redirections/${id}`);
            showNotification('Redirection deleted successfully', 'success');
            fetchRedirections();
        } catch (error) {
            console.error('Failed to delete redirection:', error);
            showNotification('Failed to delete redirection', 'error');
        }
    };

    const getStoreName = (storeId: Redirection['storeId']) => {
        if (typeof storeId === 'object' && storeId?.name) {
            return storeId.name;
        }
        return '-';
    };

    const columns: GridColDef[] = [
        {
            field: 'storeId',
            headerName: 'Store',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">
                        {getStoreName(params.row.storeId)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'origin_url',
            headerName: 'Origin URL',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontFamily="monospace" color="primary">
                        {params.value}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'destination_url',
            headerName: 'Destination URL',
            flex: 1,
            minWidth: 250,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontFamily="monospace" noWrap>
                        {params.value}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams) => {
                const status = params.value as string;
                const active = status === 'active';
                return (
                    <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                        <Chip
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            size="small"
                            color={active ? 'success' : 'default'}
                            variant={active ? 'filled' : 'outlined'}
                        />
                    </Box>
                );
            },
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">
                        {new Date(params.value).toLocaleDateString()}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" justifyContent="center" height="100%">
                    <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(params.row)} size="small" color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(params.row._id)} size="small" color="error">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    if (authLoading || (!user || user.role !== 'super_admin')) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="50vh">
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="URL Redirections"
                subtitle="Manage custom URL redirections that override product, category, and page slugs"
                backUrl="/settings"
                actionLabel="Add Redirection"
                onAction={() => handleOpenDialog()}
            />

            <SearchFilterBar
                searchPlaceholder="Search origin or destination URL..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                    {
                        id: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                        ],
                    },
                ]}
                activeFilters={{ status: statusFilter }}
                onFilterChange={(filters) => setStatusFilter(filters.status as string || '')}
                showStoreFilter
                storeFilterValue={storeFilter}
                onStoreFilterChange={setStoreFilter}
            />

            <Box sx={{ width: '100%', position: 'relative' }}>
                <DataGrid
                    rows={redirections}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 20, 50, 100]}
                    paginationMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    loading={loading}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                />
            </Box>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Edit Redirection' : 'Add Redirection'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <StoreAutocomplete
                            value={formData.storeId}
                            onChange={(value) => setFormData({ ...formData, storeId: (value as string) || '' })}
                            error={!!formErrors.storeId}
                            helperText={formErrors.storeId}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Origin URL"
                            placeholder="/iphone-17"
                            value={formData.origin_url}
                            onChange={(e) => setFormData({ ...formData, origin_url: e.target.value })}
                            error={!!formErrors.origin_url}
                            helperText={formErrors.origin_url || 'Relative URL path (must start with /)'}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Destination URL"
                            placeholder="/contact-us or https://www.google.com"
                            value={formData.destination_url}
                            onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
                            error={!!formErrors.destination_url}
                            helperText={formErrors.destination_url || 'Can be absolute (https://...) or relative (/)'}
                            required
                        />

                        <TextField
                            select
                            fullWidth
                            label="Status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                        >
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                        {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
