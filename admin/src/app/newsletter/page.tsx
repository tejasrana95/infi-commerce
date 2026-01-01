'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Paper,
    IconButton,
    Typography,
    Container,
    Tooltip,
    useTheme,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { NewsletterSubscriber, Store } from '@/types';
import api from '@/lib/api';
import { format } from 'date-fns';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';
import { useDebounce } from '@/hooks/useDebounce';

export default function NewsletterSubscribersPage() {
    const theme = useTheme();
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Filter states
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [totalRows, setTotalRows] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('all');

    // Dialog states
    const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 500);

    const fetchStores = async () => {
        try {
            const response = await api.get('/stores');
            setStores(response.data.stores || response.data);
        } catch (error) {
            console.error('Error fetching stores:', error);
        }
    };

    const fetchSubscribers = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debouncedSearch,
            };

            if (filterStore && filterStore !== 'all') {
                params.storeId = filterStore;
            }

            const response = await api.get(`/newsletter`, { params });

            setSubscribers(response.data.subscribers);
            setTotalRows(response.data.pagination.total);
        } catch (error: any) {
            console.error('Error fetching subscribers:', error);
            showNotification(error.response?.data?.message || 'Failed to fetch subscribers', 'error');
            setSubscribers([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        fetchSubscribers();
    }, [paginationModel, debouncedSearch, filterStore]);

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Subscriber', message: 'Are you sure you want to remove this subscriber?', severity: 'error' })) return;

        try {
            await api.delete(`/newsletter/${id}`);
            fetchSubscribers();
            showNotification('Subscriber removed successfully', 'success');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to remove subscriber', 'error');
        }
    };

    const handleDeleteAll = async () => {
        if (filterStore === 'all') return;

        try {
            await api.delete(`/newsletter/bulk/delete-all`, {
                data: { storeId: filterStore }
            });
            setDeleteAllDialogOpen(false);
            fetchSubscribers();
            showNotification('All subscribers for this store deleted successfully', 'success');
        } catch (error: any) {
            console.error('Error deleting all subscribers:', error);
            showNotification(error.response?.data?.message || 'Failed to delete all subscribers', 'error');
        }
    };

    const handleExport = async () => {
        try {
            const params: any = {};
            if (debouncedSearch) params.search = debouncedSearch;
            if (filterStore !== 'all') params.storeId = filterStore;

            const response = await api.get('/newsletter/export', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'subscribers.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting subscribers:', error);
            showNotification('Failed to export subscribers', 'error');
        }
    };

    const getStoreName = (storeId: any) => {
        if (typeof storeId === 'object' && storeId !== null) {
            return storeId.name;
        }
        // Fallback to finding in stores list if only ID string is provided
        if (typeof storeId === 'string') {
            const store = stores.find(s => s._id === storeId);
            return store ? store.name : storeId;
        }
        return '-';
    };

    const columns: GridColDef[] = [
        {
            field: 'email',
            headerName: 'Email',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="body2">{params.value}</Typography>
                </Box>
            )
        },
        {
            field: 'storeId',
            headerName: 'Store',
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Typography variant="body2">{getStoreName(params.row.storeId)}</Typography></Box>
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Subscribed Date',
            width: 200,
            valueFormatter: (value: any) => {
                if (!value) return '-';
                try {
                    return format(new Date(value), 'MMM dd, yyyy HH:mm');
                } catch (e) {
                    return value;
                }
            },
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="body2">{format(new Date(params.value), 'MMM dd, yyyy HH:mm')}</Typography>
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Tooltip title="Delete">
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                        <IconButton
                            onClick={() => handleDelete(params.row._id)}
                            size="small"
                            color="error"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Tooltip>
            ),
        },
    ];

    if (!loading && subscribers.length === 0 && !searchQuery && (!filterStore || filterStore === 'all')) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <PageHeader title="Newsletter Subscribers" subtitle="Manage email subscribers" />
                <EmptyState
                    message="No subscribers found yet."
                />
            </Container>
        );
    }

    return (
        <Box >
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <PageHeader title="Newsletter Subscribers" subtitle="Manage email subscribers" />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExport}
                    >
                        Export CSV
                    </Button>
                    {filterStore !== 'all' && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteSweepIcon />}
                            onClick={() => setDeleteAllDialogOpen(true)}
                        >
                            Delete All for Store
                        </Button>
                    )}
                </Box>
            </Box>

            <SearchFilterBar
                searchPlaceholder="Search by email..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                showStoreFilter
                storeFilterValue={filterStore}
                onStoreFilterChange={setFilterStore}
            />

            <Paper sx={{ width: '100%', position: 'relative', mt: 3 }}>
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
                    rows={subscribers}
                    columns={columns}
                    getRowId={(row) => row._id}
                    paginationMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 20, 50]}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    loading={loading}
                />
            </Paper>

            {/* Delete All Confirmation Dialog */}
            <Dialog open={deleteAllDialogOpen} onClose={() => setDeleteAllDialogOpen(false)}>
                <DialogTitle>Delete All Subscribers</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete ALL newsletter subscribers for the selected store?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteAll} color="error" variant="contained">
                        Delete All
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
