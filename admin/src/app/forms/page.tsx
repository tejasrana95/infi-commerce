'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    IconButton,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useRouter } from 'next/navigation';
import { Form } from '@/types';
import api from '@/lib/api';
import { format } from 'date-fns';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { createDataGridStyles } from '@/utils/styles';
import { useNotification } from '@/contexts/NotificationContext';

export default function FormsPage() {
    const router = useRouter();
    const theme = useTheme();
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Search
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [totalRows, setTotalRows] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [formToDelete, setFormToDelete] = useState<Form | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchForms = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
            };

            if (debouncedSearch) params.search = debouncedSearch;
            if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

            const response = await api.get(`/forms`, { params });

            setForms(response.data.forms);
            setTotalRows(response.data.pagination.total);
        } catch (error) {
            console.error('Error fetching forms:', error);
            showNotification('Failed to fetch forms', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, [paginationModel, debouncedSearch, statusFilter]);

    const handleDelete = async () => {
        if (!formToDelete) return;

        try {
            await api.delete(`/forms/${formToDelete._id}`);
            showNotification('Form deleted successfully', 'success');
            setDeleteDialogOpen(false);
            setFormToDelete(null);
            fetchForms();
        } catch (error) {
            console.error('Error deleting form:', error);
            showNotification('Failed to delete form', 'error');
        }
    };

    const handleDuplicate = async (form: Form) => {
        try {
            const response = await api.post(`/forms/${form._id}/duplicate`, {});
            showNotification('Form duplicated successfully', 'success');
            // Navigate to edit the duplicated form
            router.push(`/forms/${response.data.form._id}`);
        } catch (error) {
            console.error('Error duplicating form:', error);
            showNotification('Failed to duplicate form', 'error');
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
                    <Typography variant="body2" fontWeight={600}>{params.row.name}</Typography>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                        {params.row.slug}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Chip
                        label={params.value}
                        size="small"
                        color={params.value === 'published' ? 'success' : 'default'}
                        variant={params.value === 'published' ? 'filled' : 'outlined'}
                    />
                </Box>
            )
        },
        {
            field: 'submissionsCount',
            headerName: 'Submissions',
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="body2">{params.value}</Typography>
                </Box>
            )
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Typography variant="body2">{format(new Date(params.value), 'MMM d, yyyy')}</Typography></Box>
            )
        },
        {
            field: 'updatedAt',
            headerName: 'Updated',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Typography variant="body2">{format(new Date(params.value), 'MMM d, yyyy')}</Typography></Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 180,
            align: 'right',
            headerAlign: 'right',
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" justifyContent="end" alignItems="center" height="100%">
                    <Tooltip title="View Submissions">
                        <IconButton
                            size="small"
                            onClick={() => router.push(`/forms/${params.row._id}/submissions`)}
                        >
                            <AssignmentIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton
                            size="small"
                            onClick={() => router.push(`/forms/${params.row._id}`)}
                            color="primary"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate">
                        <IconButton
                            size="small"
                            onClick={() => handleDuplicate(params.row)}
                            color="info"
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton
                            size="small"
                            onClick={() => {
                                setFormToDelete(params.row);
                                setDeleteDialogOpen(true);
                            }}
                            color="error"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    if (!loading && forms.length === 0 && !search && !statusFilter) {
        return (
            <Box>
                <PageHeader
                    title="Form Builder"
                    subtitle="Create and manage forms"
                    actionLabel="Create New Form"
                    onAction={() => router.push('/forms/new')}
                />
                <EmptyState
                    message="No forms found. Create your first form!"
                    actionLabel="Create New Form"
                    onAction={() => router.push('/forms/new')}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Form Builder"
                subtitle="Create and manage forms"
                actionLabel="Create New Form"
                onAction={() => router.push('/forms/new')}
            />

            <SearchFilterBar
                searchPlaceholder="Search forms..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        id: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: 'published', label: 'Published' },
                            { value: 'draft', label: 'Draft' },
                        ],
                    }
                ]}
                activeFilters={{ status: statusFilter }}
                onFilterChange={(filters) => setStatusFilter(filters.status as string)}
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
                        backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>
                        <LoadingSpinner />
                    </Box>
                )}
                <DataGrid
                    rows={forms}
                    columns={columns}
                    getRowId={(row) => row._id}
                    sx={dataGridStyles}
                    disableRowSelectionOnClick
                    paginationMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 25, 50]}
                    loading={loading}
                />
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Form</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete "{formToDelete?.name}"? This will also delete all
                        submissions for this form. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
