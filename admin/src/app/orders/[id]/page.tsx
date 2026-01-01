'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    Button,
    Divider,
    IconButton,
    Card,
    CardContent,
    CardHeader,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Order, OrderStatus } from '@/types/order';
import LoadingSpinner from '@/components/atoms/LoadingSpinner';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useConfirm } from '@/contexts/ConfirmContext';

export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { convertAndFormat } = useCurrency();
    const { confirm } = useConfirm();
    // Status update state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [shipDialogOpen, setShipDialogOpen] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [courierName, setCourierName] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [isEditingTracking, setIsEditingTracking] = useState(false);
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [refundAction, setRefundAction] = useState<'approved' | 'rejected' | 'processed'>('approved');
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/orders/${id}`);
            if (response.data.success) {
                setOrder(response.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load order');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: OrderStatus, extraData: any = {}) => {
        setActionLoading(true);
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus, ...extraData });
            await fetchOrder(); // Refresh
            setShipDialogOpen(false);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setActionLoading(false);
            setAnchorEl(null);
        }
    };

    const handleCancelOrder = async () => {
        setActionLoading(true);
        try {
            await api.post(`/orders/${id}/cancel`, { reason: cancelReason });
            await fetchOrder();
            setCancelDialogOpen(false);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to cancel order');
        } finally {
            setActionLoading(false);
        }
    };

    const handleProcessRefund = async () => {
        if (!await confirm({ title: 'Process Refund', message: 'Are you sure you want to mark this order as refunded?', severity: 'warning' })) return;
        setActionLoading(true);
        try {
            await api.patch(`/orders/${id}/refund`);
            await fetchOrder();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to refund');
        } finally {
            setActionLoading(false);
            setAnchorEl(null);
        }
    };

    const handleReturnUpdate = async (status: string) => {
        setActionLoading(true);
        try {
            await api.patch(`/orders/${id}/return-status`, { status });
            await fetchOrder();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update return status');
        } finally {
            setActionLoading(false);
            setAnchorEl(null);
        }
    };

    const handleRefundUpdate = async () => {
        setActionLoading(true);
        try {
            await api.patch(`/orders/${id}/refund-status`, {
                status: refundAction,
                adminNote: adminNote
            });
            await fetchOrder();
            setRefundDialogOpen(false);
            setAdminNote('');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update refund status');
        } finally {
            setActionLoading(false);
        }
    };

    if (error && !loading) return <Alert severity="error">{error || 'Order not found'}</Alert>;

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'processing': return 'info';
            case 'shipped': return 'primary';
            case 'delivered': return 'success';
            case 'cancelled': return 'error';
            case 'refunded': return 'default';
            case 'return_requested': return 'warning';
            case 'returned': return 'info';
            default: return 'default';
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3} gap={2}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Box flexGrow={1}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h4" fontWeight="bold">Order #{order?.orderNumber || '...'}</Typography>
                        {order && (
                            <>
                                <Chip
                                    label={order.status}
                                    color={getStatusColor(order.status)}
                                    sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}
                                />
                                <Chip
                                    label={order.paymentStatus}
                                    variant="outlined"
                                    color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                                    sx={{ textTransform: 'capitalize' }}
                                />
                            </>
                        )}
                    </Box>
                    <Typography color="text.secondary" variant="body2" mt={0.5}>
                        {order ? `Placed on ${new Date(order.createdAt).toLocaleString()}` : 'Loading order details...'}
                    </Typography>
                </Box>

                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/orders/${id}/edit`)}
                        disabled={!order}
                    >
                        Edit Order
                    </Button>
                    <Button
                        variant="contained"
                        endIcon={<MoreVertIcon />}
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        disabled={!order || actionLoading || ['cancelled', 'refunded'].includes(order.status) && order.paymentStatus === 'refunded'}
                    >
                        Update Status
                    </Button>
                </Box>
                {order && (
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        {order.status === 'pending' && (
                            <MenuItem onClick={() => handleStatusUpdate('processing')}>Mark as Processing</MenuItem>
                        )}
                        {['pending', 'processing'].includes(order.status) && (
                            <MenuItem onClick={() => setShipDialogOpen(true)}>Mark as Shipped</MenuItem>
                        )}
                        {order.status === 'shipped' && (
                            <MenuItem onClick={() => handleStatusUpdate('delivered')}>Mark as Delivered</MenuItem>
                        )}

                        {/* Return Workflow */}
                        {order.status === 'delivered' && (
                            <MenuItem onClick={() => handleReturnUpdate('return_requested')}>Initiate Return</MenuItem>
                        )}
                        {order.status === 'return_requested' && (
                            <MenuItem onClick={() => handleReturnUpdate('returned')}>Complete Return</MenuItem>
                        )}

                        {/* Refund Workflow */}
                        {['cancelled', 'returned'].includes(order.status) &&
                            order.paymentStatus !== 'refunded' && order.paymentStatus === 'paid' && [
                                <Divider key="refund-divider" />,
                                <MenuItem
                                    key="refund"
                                    onClick={handleProcessRefund}
                                    sx={{ color: 'warning.main' }}
                                >
                                    Process Refund
                                </MenuItem>,
                            ]}

                        {/* Cancel Order */}
                        {!['cancelled', 'returned', 'refunded'].includes(order.status) && [
                            <Divider key="cancel-divider" />,
                            <MenuItem
                                key="cancel"
                                onClick={() => setCancelDialogOpen(true)}
                                sx={{ color: 'error.main' }}
                            >
                                Cancel Order
                            </MenuItem>,
                        ]}
                    </Menu>
                )}
            </Box>

            <Box sx={{ position: 'relative', minHeight: order ? 'auto' : 400 }}>
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
                        borderRadius: 1,
                    }}>
                        <LoadingSpinner />
                    </Box>
                )}

                {order ? (
                    <Grid container spacing={3}>
                        {/* Main Content - Items */}
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Paper sx={{ mb: 3, overflow: 'hidden' }}>
                                <Box p={2} bgcolor="grey.50" borderBottom={1} borderColor="divider">
                                    <Typography variant="h6">Order Items</Typography>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Product</TableCell>
                                                <TableCell align="right">Price</TableCell>
                                                <TableCell align="right">Quantity</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {order.items.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={2}>
                                                            {item.image && (
                                                                <Box
                                                                    component="img"
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
                                                                />
                                                            )}
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                                                                <Typography variant="caption" color="text.secondary">SKU: {item.sku}</Typography>
                                                                {item.attributes && Object.entries(item.attributes).length > 0 && (
                                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                                        {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {convertAndFormat(item.price, order.currency)}
                                                    </TableCell>
                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                                                        {convertAndFormat(item.price * item.quantity, order.currency)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>

                            {/* Order Summary */}
                            <Box display="flex" justifyContent="flex-end">
                                <Paper sx={{ width: '100%', maxWidth: 400, p: 2 }}>
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography color="text.secondary">Subtotal</Typography>
                                        <Typography>
                                            {convertAndFormat(order.subtotal, order.currency)}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography color="text.secondary">Shipping</Typography>
                                        <Typography>{convertAndFormat(order.shippingCost, order.currency)}</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography color="text.secondary">Tax</Typography>
                                        <Typography>{convertAndFormat(order.tax, order.currency)}</Typography>
                                    </Box>
                                    {order.discount > 0 && (
                                        <Box display="flex" justifyContent="space-between" mb={1} color="success.main">
                                            <Typography>Discount{order.couponCode && ` (${order.couponCode})`}</Typography>
                                            <Typography>-{convertAndFormat(order.discount, order.currency)}</Typography>
                                        </Box>
                                    )}
                                    <Divider sx={{ my: 2 }} />
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="h6" fontWeight="bold">Total</Typography>
                                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                                            {convertAndFormat(order.total, order.currency)}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Box>
                        </Grid>

                        {/* Sidebar Info */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box display="flex" flexDirection="column" gap={3}>
                                {/* Customer Info */}
                                <Card variant="outlined">
                                    <CardHeader
                                        title="Customer"
                                        avatar={<PersonIcon color="action" />}
                                        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                                    />
                                    <Divider />
                                    <CardContent>
                                        <Typography variant="body2" fontWeight={600} gutterBottom>
                                            {/* @ts-ignore */}
                                            {order.customerId ? `${order.customerId.firstName} ${order.customerId.lastName}` : 'Guest User'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {/* @ts-ignore */}
                                            {order.customerId?.email || order.guestEmail}
                                        </Typography>
                                        {order.customerNote && (
                                            <Alert severity="info" sx={{ mt: 2 }}>
                                                <Typography variant="caption" fontWeight={600} display="block">Note:</Typography>
                                                {order.customerNote}
                                            </Alert>
                                        )}
                                        {/* @ts-ignore */}
                                        {order.refundStatus === 'requested' && (
                                            <Alert severity="warning" sx={{ mt: 2 }}>
                                                <Typography variant="caption" fontWeight={600} display="block">Refund Requested:</Typography>
                                                {/* @ts-ignore */}
                                                {order.refundReason || 'No reason provided'}
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="warning"
                                                    sx={{ mt: 1, display: 'block' }}
                                                    onClick={() => {
                                                        setRefundAction('approved');
                                                        setRefundDialogOpen(true);
                                                    }}
                                                >
                                                    Manage Refund
                                                </Button>
                                            </Alert>
                                        )}
                                        {/* @ts-ignore */}
                                        {order.refundStatus && !['none', 'requested'].includes(order.refundStatus) && (
                                            <Alert severity={order.refundStatus === 'rejected' ? 'error' : 'success'} sx={{ mt: 2 }}>
                                                <Typography variant="caption" fontWeight={600} display="block">
                                                    Refund {order.refundStatus}:
                                                </Typography>
                                                {/* @ts-ignore */}
                                                {order.adminNote}
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Shipping Address */}
                                <Card variant="outlined">
                                    <CardHeader
                                        title="Shipping Address"
                                        avatar={<LocalShippingIcon color="action" />}
                                        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                                        action={
                                            order.status === 'shipped' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setIsEditingTracking(true);
                                                        setCourierName(order.courierName || '');
                                                        setTrackingNumber(order.trackingNumber || '');
                                                        setTrackingUrl(order.trackingUrl || '');
                                                        setShipDialogOpen(true);
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            )
                                        }
                                    />
                                    <Divider />
                                    <CardContent>
                                        {order.shippingAddress ? (
                                            <>
                                                <Typography variant="body2">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</Typography>
                                                <Typography variant="body2" color="text.secondary">{order.shippingAddress.address1}</Typography>
                                                {order.shippingAddress.address2 && <Typography variant="body2" color="text.secondary">{order.shippingAddress.address2}</Typography>}
                                                <Typography variant="body2" color="text.secondary">
                                                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">{order.shippingAddress.country}</Typography>
                                                <Typography variant="body2" color="text.secondary" mt={1}>{order.shippingAddress.phone}</Typography>
                                            </>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">No address provided</Typography>
                                        )}

                                        {order.trackingNumber && (
                                            <Box mt={2} p={1.5} bgcolor="primary.50" borderRadius={1}>
                                                <Typography variant="caption" fontWeight={600} color="primary.main" display="block">
                                                    Tracking Details
                                                </Typography>
                                                {/* @ts-ignore */}
                                                {order.courierName && (
                                                    <Typography variant="body2" component="span" display="block">
                                                        Courier: <strong>{order.courierName}</strong>
                                                    </Typography>
                                                )}
                                                <Typography variant="body2" component="span" display="block">
                                                    Number: <strong>{order.trackingNumber}</strong>
                                                </Typography>
                                                {/* @ts-ignore */}
                                                {order.trackingUrl && (
                                                    <Button
                                                        variant="text"
                                                        size="small"
                                                        href={order.trackingUrl}
                                                        target="_blank"
                                                        sx={{ mt: 0.5, p: 0, minWidth: 'auto', textTransform: 'none' }}
                                                    >
                                                        Track Shipment →
                                                    </Button>
                                                )}
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Payment Info */}
                                <Card variant="outlined">
                                    <CardHeader
                                        title="Payment"
                                        avatar={<PaymentIcon color="action" />}
                                        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                                    />
                                    <Divider />
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" mb={1}>
                                            <Typography variant="body2" color="text.secondary">Method</Typography>
                                            <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                                                {order.paymentMethod}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="body2" color="text.secondary">Status</Typography>
                                            <Chip
                                                label={order.paymentStatus}
                                                size="small"
                                                color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                                                sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.75rem' }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Grid>
                    </Grid>
                ) : !loading && (
                    <Alert severity="warning">Order details could not be loaded.</Alert>
                )}
            </Box>

            {/* Ship Dialog */}
            <Dialog open={shipDialogOpen} onClose={() => {
                setShipDialogOpen(false);
                setIsEditingTracking(false);
            }}>
                <DialogTitle>{isEditingTracking ? 'Edit Tracking Details' : 'Mark as Shipped'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Courier Name"
                        fullWidth
                        variant="outlined"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Tracking Number"
                        fullWidth
                        variant="outlined"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Tracking URL"
                        fullWidth
                        variant="outlined"
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        placeholder="https://..."
                        helperText="Provide full URL including https://"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setShipDialogOpen(false);
                        setIsEditingTracking(false);
                    }}>Cancel</Button>
                    <Button
                        onClick={() => handleStatusUpdate('shipped', { trackingNumber, courierName, trackingUrl })}
                        variant="contained"
                        disabled={!trackingNumber || !courierName}
                    >
                        {isEditingTracking ? 'Update Tracking' : 'Update Status'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
                <DialogTitle>Cancel Order</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Reason for cancellation"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone. Stock will be restored.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialogOpen(false)}>Back</Button>
                    <Button onClick={handleCancelOrder} variant="contained" color="error">
                        Confirm Cancel
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Refund Management Dialog */}
            <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Manage Refund Request</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Action</Typography>
                        <Box display="flex" gap={2} mb={3}>
                            <Button
                                variant={refundAction === 'approved' ? 'contained' : 'outlined'}
                                color="success"
                                onClick={() => setRefundAction('approved')}
                            >
                                Approve
                            </Button>
                            <Button
                                variant={refundAction === 'rejected' ? 'contained' : 'outlined'}
                                color="error"
                                onClick={() => setRefundAction('rejected')}
                            >
                                Reject
                            </Button>
                            <Button
                                variant={refundAction === 'processed' ? 'contained' : 'outlined'}
                                color="primary"
                                onClick={() => setRefundAction('processed')}
                            >
                                Mark as Processed
                            </Button>
                        </Box>

                        <TextField
                            label={refundAction === 'rejected' ? 'Rejection Reason' : 'Admin Note'}
                            fullWidth
                            multiline
                            rows={3}
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder={refundAction === 'rejected' ? 'Explain why the refund was rejected...' : 'Add a note for the customer...'}
                            helperText="This note will be visible to the customer."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleRefundUpdate}
                        variant="contained"
                        disabled={actionLoading || (refundAction === 'rejected' && !adminNote)}
                    >
                        Confirm {refundAction}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
