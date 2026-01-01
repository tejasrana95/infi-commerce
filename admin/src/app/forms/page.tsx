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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useRouter } from 'next/navigation';
import { Form } from '@/types';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function FormsPage() {
    const router = useRouter();
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [formToDelete, setFormToDelete] = useState<Form | null>(null);

    const fetchForms = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params: any = {
                page: page + 1,
                limit: rowsPerPage,
            };

            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await api.get(`/forms`, { params });

            setForms(response.data.forms);
            setTotal(response.data.pagination.total);
        } catch (error) {
            console.error('Error fetching forms:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, [page, rowsPerPage, search, statusFilter]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDelete = async () => {
        if (!formToDelete) return;

        try {
            await api.delete(`/forms/${formToDelete._id}`);

            setDeleteDialogOpen(false);
            setFormToDelete(null);
            fetchForms();
        } catch (error) {
            console.error('Error deleting form:', error);
        }
    };

    const handleDuplicate = async (form: Form) => {
        try {
            const response = await api.post(`/forms/${form._id}/duplicate`, {});

            // Navigate to edit the duplicated form
            router.push(`/forms/${response.data.form._id}`);
        } catch (error) {
            console.error('Error duplicating form:', error);
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                    Form Builder
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/forms/new')}
                >
                    Create New Form
                </Button>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        placeholder="Search forms..."
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
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="published">Published</MenuItem>
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
                                <TableCell>Name</TableCell>
                                <TableCell>Slug</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Submissions</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Updated</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : forms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        No forms found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                forms.map((form) => (
                                    <TableRow key={form._id} hover>
                                        <TableCell>{form.name}</TableCell>
                                        <TableCell>
                                            <code style={{ fontSize: '0.875rem', color: '#666' }}>
                                                {form.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={form.status}
                                                size="small"
                                                color={form.status === 'published' ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>{form.submissionsCount}</TableCell>
                                        <TableCell>
                                            {format(new Date(form.createdAt), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(form.updatedAt), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => router.push(`/forms/${form._id}/submissions`)}
                                                title="View Submissions"
                                            >
                                                <AssignmentIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => router.push(`/forms/${form._id}`)}
                                                title="Edit"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDuplicate(form)}
                                                title="Duplicate"
                                            >
                                                <ContentCopyIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setFormToDelete(form);
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
                    rowsPerPageOptions={[10, 20, 50]}
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
