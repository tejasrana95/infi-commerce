'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Paper,
    IconButton,
    Chip,
    Rating,
    Avatar,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    TextField,
    InputAdornment,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

interface Review {
    _id: string;
    storeId: { _id: string; name: string };
    productId: { _id: string; name: string; sku: string; images?: string[] };
    customerId?: { _id: string; firstName: string; lastName: string; email: string };
    isGuestReview: boolean;
    guestName?: string;
    guestEmail?: string;
    guestEmailVerified: boolean;
    rating: number;
    title: string;
    content: string;
    isApproved: boolean;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    createdAt: string;
}

export default function ReviewsPage() {
    const router = useRouter();
    const theme = useTheme();
    const { showNotification } = useNotification();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterRating, setFilterRating] = useState<string>('');

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = {
                page: page + 1,
                limit: pageSize,
            };

            if (searchQuery) params.search = searchQuery;
            if (filterStatus === 'approved') params.isApproved = 'true';
            if (filterStatus === 'pending') params.isApproved = 'false';
            if (filterRating) params.rating = filterRating;

            const response = await api.get('/reviews', { params });
            setReviews(response.data.reviews || []);
            setTotal(response.data.pagination?.total || 0);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            showNotification('Failed to fetch reviews', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchQuery, filterStatus, filterRating, showNotification]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, review: Review) => {
        setAnchorEl(event.currentTarget);
        setSelectedReview(review);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedReview(null);
    };

    const handleApprove = async (isApproved: boolean) => {
        if (!selectedReview) return;
        try {
            await api.put(`/reviews/${selectedReview._id}/status`, { isApproved });
            showNotification(`Review ${isApproved ? 'approved' : 'rejected'}`, 'success');
            fetchReviews();
        } catch (error) {
            showNotification('Failed to update review status', 'error');
        }
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        setReviewToDelete(selectedReview);
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const handleDeleteConfirm = async () => {
        if (!reviewToDelete) return;
        try {
            await api.delete(`/reviews/${reviewToDelete._id}`);
            showNotification('Review deleted successfully', 'success');
            fetchReviews();
        } catch (error) {
            showNotification('Failed to delete review', 'error');
        }
        setDeleteDialogOpen(false);
        setReviewToDelete(null);
    };

    const getReviewerName = (review: Review) => {
        if (review.isGuestReview) {
            return review.guestName || 'Guest';
        }
        return review.customerId
            ? `${review.customerId.firstName} ${review.customerId.lastName}`
            : 'Unknown';
    };

    const columns: GridColDef[] = [
        {
            field: 'product',
            headerName: 'Product',
            width: 250,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar
                        src={params.row.productId?.images?.[0]}
                        variant="rounded"
                        sx={{ width: 40, height: 40 }}
                    >
                        {params.row.productId?.name?.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={500} noWrap>
                            {params.row.productId?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {params.row.productId?.sku}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'rating',
            headerName: 'Rating',
            width: 130,
            renderCell: (params: GridRenderCellParams) => (
                <Rating value={params.row.rating} readOnly size="small" />
            ),
        },
        {
            field: 'reviewer',
            headerName: 'Reviewer',
            width: 180,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" color="action" />
                    <Box>
                        <Typography variant="body2">
                            {getReviewerName(params.row)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {params.row.isGuestReview ? 'Guest' : 'Customer'}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'title',
            headerName: 'Title',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2" noWrap>
                    {params.row.title}
                </Typography>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" gap={0.5} alignItems="center">
                    <Chip
                        label={params.row.isApproved ? 'Approved' : 'Pending'}
                        size="small"
                        color={params.row.isApproved ? 'success' : 'warning'}
                        variant="outlined"
                    />
                    {params.row.isVerifiedPurchase && (
                        <Tooltip title="Verified Purchase">
                            <VerifiedIcon fontSize="small" color="primary" />
                        </Tooltip>
                    )}
                </Box>
            ),
        },
        {
            field: 'store',
            headerName: 'Store',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">
                    {params.row.storeId?.name}
                </Typography>
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Date',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">
                    {new Date(params.row.createdAt).toLocaleDateString()}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: '',
            width: 60,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, params.row)}
                >
                    <MoreVertIcon />
                </IconButton>
            ),
        },
    ];

    if (loading && reviews.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight={600}>
                    Reviews
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/reviews/new')}
                >
                    Add Review
                </Button>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                    <TextField
                        size="small"
                        placeholder="Search reviews..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: 250 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filterStatus}
                            label="Status"
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Rating</InputLabel>
                        <Select
                            value={filterRating}
                            label="Rating"
                            onChange={(e) => setFilterRating(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="5">5 Stars</MenuItem>
                            <MenuItem value="4">4 Stars</MenuItem>
                            <MenuItem value="3">3 Stars</MenuItem>
                            <MenuItem value="2">2 Stars</MenuItem>
                            <MenuItem value="1">1 Star</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* Data Grid */}
            <Paper sx={{ height: 600 }}>
                <DataGrid
                    rows={reviews}
                    columns={columns}
                    getRowId={(row) => row._id}
                    rowCount={total}
                    paginationMode="server"
                    paginationModel={{ page, pageSize }}
                    onPaginationModelChange={(model) => {
                        setPage(model.page);
                        setPageSize(model.pageSize);
                    }}
                    pageSizeOptions={[10, 20, 50]}
                    loading={loading}
                    disableRowSelectionOnClick
                    sx={createDataGridStyles(theme)}
                />
            </Paper>

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => router.push(`/reviews/${selectedReview?._id}/edit`)}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                </MenuItem>
                {selectedReview && !selectedReview.isApproved && (
                    <MenuItem onClick={() => handleApprove(true)}>
                        <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} color="success" /> Approve
                    </MenuItem>
                )}
                {selectedReview && selectedReview.isApproved && (
                    <MenuItem onClick={() => handleApprove(false)}>
                        <CancelIcon fontSize="small" sx={{ mr: 1 }} color="warning" /> Reject
                    </MenuItem>
                )}
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                </MenuItem>
            </Menu>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Review</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this review? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
