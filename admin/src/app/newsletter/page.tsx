'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Container,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { NewsletterSubscriber, Store } from '@/types';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function NewsletterSubscribersPage() {
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [storeFilter, setStoreFilter] = useState<string>('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
    const [subscriberToDelete, setSubscriberToDelete] = useState<NewsletterSubscriber | null>(null);

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
                page: page + 1,
                limit: rowsPerPage,
            };

            if (search) params.search = search;
            if (storeFilter !== 'all') params.storeId = storeFilter;

            const response = await api.get(`/newsletter`, { params });

            setSubscribers(response.data.subscribers);
            setTotal(response.data.pagination.total);
        } catch (error) {
            console.error('Error fetching subscribers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        fetchSubscribers();
    }, [page, rowsPerPage, search, storeFilter]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDelete = async () => {
        if (!subscriberToDelete) return;

        try {
            await api.delete(`/newsletter/${subscriberToDelete._id}`);
            setDeleteDialogOpen(false);
            setSubscriberToDelete(null);
            fetchSubscribers();
        } catch (error) {
            console.error('Error deleting subscriber:', error);
        }
    };

    const handleDeleteAll = async () => {
        if (storeFilter === 'all') return;

        try {
            await api.delete(`/newsletter/bulk/delete-all`, {
                data: { storeId: storeFilter }
            });
            setDeleteAllDialogOpen(false);
            fetchSubscribers();
        } catch (error) {
            console.error('Error deleting all subscribers:', error);
        }
    };

    const handleExport = async () => {
        try {
            const params: any = {};
            if (search) params.search = search;
            if (storeFilter !== 'all') params.storeId = storeFilter;

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
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                    Newsletter Subscribers
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExport}
                    >
                        Export CSV
                    </Button>
                    {storeFilter !== 'all' && (
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

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        placeholder="Search by email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ flex: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Store</InputLabel>
                        <Select
                            value={storeFilter}
                            label="Filter by Store"
                            onChange={(e) => {
                                setStoreFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="all">All Stores</MenuItem>
                            {stores.map((store) => (
                                <MenuItem key={store._id} value={store._id}>
                                    {store.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Store</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Subscribed At</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : subscribers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No subscribers found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                subscribers.map((sub) => (
                                    <TableRow key={sub._id} hover>
                                        <TableCell>{sub.email}</TableCell>
                                        <TableCell>
                                            {(sub.storeId as any)?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={sub.status}
                                                size="small"
                                                color={sub.status === 'subscribed' ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {sub.createdAt ? format(new Date(sub.createdAt), 'MMM d, yyyy HH:mm') : 'N/A'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSubscriberToDelete(sub);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                title="Delete"
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Subscriber</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete "{subscriberToDelete?.email}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

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
