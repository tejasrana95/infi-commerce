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
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Order, OrderStatus } from '@/types/order';
import LoadingSpinner from '@/components/atoms/LoadingSpinner';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useNotification } from '@/contexts/NotificationContext';
import OrderAccountingSection from '@/components/organisms/OrderAccountingSection';

export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { convertAndFormat } = useCurrency();
    const { confirm } = useConfirm();
    const { showNotification } = useNotification();
    // Status update state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(null);
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

    // Notification choice state
    const [notifyCustomer, setNotifyCustomer] = useState(true);
    const [confirmDialogState, setConfirmDialogState] = useState<{
        open: boolean;
        title: string;
        message: string;
        action: (notify: boolean) => Promise<void>;
    } | null>(null);

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

    const handleStatusUpdate = async (newStatus: OrderStatus, extraData: any = {}, notify: boolean = true) => {
        setActionLoading(true);
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus, notifyCustomer: notify, ...extraData });
            await fetchOrder(); // Refresh
            setShipDialogOpen(false);
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setActionLoading(false);
            setAnchorEl(null);
            setConfirmDialogState(null);
        }
    };

    const openStatusConfirm = (status: OrderStatus, title: string) => {
        setAnchorEl(null);
        setNotifyCustomer(true);
        setConfirmDialogState({
            open: true,
            title,
            message: `Are you sure you want to mark this order as ${status}?`,
            action: async (notify) => handleStatusUpdate(status, {}, notify)
        });
    };

    const handleCancelOrder = async () => {
        setActionLoading(true);
        try {
            await api.post(`/orders/${id}/cancel`, { reason: cancelReason, notifyCustomer });
            await fetchOrder();
            setCancelDialogOpen(false);
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to cancel order', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleProcessRefund = async () => {
        setAnchorEl(null);
        setNotifyCustomer(true);
        setConfirmDialogState({
            open: true,
            title: 'Process Refund',
            message: 'Are you sure you want to mark this order as refunded? This action cannot be undone.',
            action: async (notify) => {
                setActionLoading(true);
                try {
                    await api.patch(`/orders/${id}/refund`, { notifyCustomer: notify });
                    await fetchOrder();
                } catch (err: any) {
                    showNotification(err.response?.data?.message || 'Failed to refund', 'error');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleReturnUpdate = async (status: string) => {
        setAnchorEl(null);
        setNotifyCustomer(true);
        setConfirmDialogState({
            open: true,
            title: status === 'return_requested' ? 'Initiate Return' : 'Complete Return',
            message: `Are you sure you want to update the return status to ${status.replace('_', ' ')}?`,
            action: async (notify) => {
                setActionLoading(true);
                try {
                    await api.patch(`/orders/${id}/return-status`, { status, notifyCustomer: notify });
                    await fetchOrder();
                } catch (err: any) {
                    showNotification(err.response?.data?.message || 'Failed to update return status', 'error');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleRefundUpdate = async () => {
        setActionLoading(true);
        try {
            await api.patch(`/orders/${id}/refund-status`, {
                status: refundAction,
                adminNote: adminNote,
                notifyCustomer
            });
            await fetchOrder();
            setRefundDialogOpen(false);
            setAdminNote('');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update refund status', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownload = async (type: 'invoice' | 'packing-slip') => {
        try {
            const response = await api.get(`/orders/${id}/${type}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}-${order?.orderNumber || id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            showNotification(`Failed to download ${type}`, 'error');
        } finally {
            setDownloadAnchorEl(null);
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
            case 'partially_returned': return 'warning';
            case 'returned': return 'info';
            default: return 'default';
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box display="flex" flexWrap="wrap" alignItems="center" mb={3} gap={2}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Box flexGrow={1}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h4" fontWeight="bold">Order #{order?.orderNumber || '...'}</Typography>
                        {order && (
                            <>
                                <Chip
                                    label={order?.status?.replace(/_/g, ' ')}
                                    color={getStatusColor(order.status)}
                                    sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}
                                />
                                <Chip
                                    label={order.paymentStatus}
                                    variant="outlined"
                                    color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                                    sx={{ textTransform: 'capitalize' }}
                                />
                                {order.isPOSOrder && (
                                    <Chip
                                        label="POS Order"
                                        variant="filled"
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                )}
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
                        startIcon={<DownloadIcon />}
                        endIcon={<MoreVertIcon />}
                        onClick={(e) => setDownloadAnchorEl(e.currentTarget)}
                        disabled={!order}
                    >
                        Download
                    </Button>
                    <Menu
                        anchorEl={downloadAnchorEl}
                        open={Boolean(downloadAnchorEl)}
                        onClose={() => setDownloadAnchorEl(null)}
                    >
                        <MenuItem onClick={() => handleDownload('invoice')}>
                            <ReceiptIcon sx={{ mr: 1, fontSize: 'small' }} /> Invoice
                        </MenuItem>
                        {['shipped', 'delivered'].includes(order?.status || '') && (
                            <MenuItem onClick={() => handleDownload('packing-slip')}>
                                <AssignmentIcon sx={{ mr: 1, fontSize: 'small' }} /> Packing Slip
                            </MenuItem>
                        )}
                    </Menu>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/orders/${id}/edit`)}
                        disabled={!order}
                    >
                        Edit Order
                    </Button>
                    {order && !['cancelled', 'refunded'].includes(order.status) && (
                        <Button
                            variant="contained"
                            endIcon={<MoreVertIcon />}
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            disabled={!order || actionLoading || ['cancelled', 'refunded'].includes(order.status) && order.paymentStatus === 'refunded'}
                        >
                            Update Status
                        </Button>
                    )}
                </Box>
                {order && (
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        {order.status === 'pending' && (
                            <MenuItem onClick={() => openStatusConfirm('processing', 'Mark as Processing')}>Mark as Processing</MenuItem>
                        )}
                        {['pending', 'processing'].includes(order.status) && (
                            <MenuItem onClick={() => {
                                setNotifyCustomer(true);
                                setShipDialogOpen(true);
                                setAnchorEl(null);
                            }}>Mark as Shipped</MenuItem>
                        )}
                        {order.status === 'shipped' && (
                            <MenuItem onClick={() => openStatusConfirm('delivered', 'Mark as Delivered')}>Mark as Delivered</MenuItem>
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
                                onClick={() => {
                                    setNotifyCustomer(true);
                                    setCancelDialogOpen(true);
                                    setAnchorEl(null);
                                }}
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
                                                                {item?.discount?.amount && <Typography variant="caption" color="success">Additional Discount: {item.discount?.amount || 0}{item.discount?.discountType === 'percentage' ? '%' : ''}</Typography>}
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

                            {/* Returns Section */}
                            {order.returns && order.returns.length > 0 && (
                                <Paper sx={{ mb: 3, overflow: 'hidden' }}>
                                    <Box p={2} bgcolor="grey.50" borderBottom={1} borderColor="divider">
                                        <Typography variant="h6">Returns History</Typography>
                                    </Box>
                                    <Box sx={{ p: 2 }}>
                                        {order.returns.map((returnRecord: any, idx: number) => (
                                            <Box key={idx} sx={{ mb: 3, bgcolor: 'warning.50' }}>
                                                {/* Return Header */}
                                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            {new Date(returnRecord.returnedAt).toLocaleString()}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Ref: {returnRecord.refundReference}
                                                        </Typography>
                                                    </Box>
                                                    <Box textAlign="right">
                                                        <Typography variant="subtitle2" fontWeight={600} color="success.main">
                                                            {convertAndFormat(returnRecord.totalRefundAmount || 0, order.currency)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {returnRecord.refundMethod}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Returned Items */}
                                                <Typography variant="caption" fontWeight={600} display="block" mb={1}>
                                                    Returned Items:
                                                </Typography>
                                                <TableContainer>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Product</TableCell>
                                                                <TableCell align="center">Qty</TableCell>
                                                                <TableCell align="right">Reason</TableCell>
                                                                <TableCell align="right">Refund Amount</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {returnRecord.items.map((item: any, itemIdx: number) => {
                                                                const originalItem = order.items.find((oi: any) => {
                                                                    const pid = typeof oi.productId === 'object' ? oi.productId._id : oi.productId;
                                                                    const iid = typeof item.productId === 'object' ? item.productId._id : item.productId;
                                                                    return pid === iid;
                                                                });
                                                                return (
                                                                    <TableRow key={itemIdx}>
                                                                        <TableCell variant="head">{originalItem?.name || 'Unknown Product'}</TableCell>
                                                                        <TableCell align="center">{item.quantity}</TableCell>
                                                                        <TableCell align="right">
                                                                            <Typography variant="caption">{item.reason}</Typography>
                                                                        </TableCell>
                                                                        <TableCell align="right">
                                                                            <Typography variant="caption" fontWeight={500}>
                                                                                {convertAndFormat(item.refundAmount || 0, order.currency)}
                                                                            </Typography>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>

                                                {/* Return Note */}
                                                {returnRecord.note && (
                                                    <Alert severity="info" sx={{ mt: 2 }}>
                                                        <Typography variant="caption" fontWeight={600} display="block">Note:</Typography>
                                                        {returnRecord.note}
                                                    </Alert>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                </Paper>
                            )}

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
                                            {order.customerId && typeof order.customerId === 'object'
                                                ? `${(order.customerId as any).firstName} ${(order.customerId as any).lastName}`
                                                : order.guestEmail ? 'Guest User' : 'Unknown User'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {order.customerId && typeof order.customerId === 'object'
                                                ? (order.customerId as any).email
                                                : order.guestEmail}
                                        </Typography>
                                        {order.customerNote && (
                                            <Alert severity="info" sx={{ mt: 2 }}>
                                                <Typography variant="caption" fontWeight={600} display="block">Note:</Typography>
                                                {order.customerNote}
                                            </Alert>
                                        )}
                                        {order.refundStatus === 'requested' && (
                                            <Alert severity="warning" sx={{ mt: 2 }}>
                                                <Typography variant="caption" fontWeight={600} display="block">Refund Requested:</Typography>
                                                {order.refundReason || 'No reason provided'}
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="warning"
                                                    sx={{ mt: 1, display: 'block' }}
                                                    onClick={() => {
                                                        setRefundAction('approved');
                                                        setNotifyCustomer(true);
                                                        setRefundDialogOpen(true);
                                                    }}
                                                >
                                                    Manage Refund
                                                </Button>
                                            </Alert>
                                        )}
                                        {order.refundStatus && !['none', 'requested'].includes(order.refundStatus) && (
                                            <Alert severity={order.refundStatus === 'rejected' ? 'error' : 'success'} sx={{ mt: 2 }}>
                                                <Typography variant="caption" fontWeight={600} display="block">
                                                    Refund {order.refundStatus === 'rejected' ? 'Rejected' : 'Processed'}:
                                                </Typography>
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
                                                        setNotifyCustomer(true);
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
                                                {order.courierName && (
                                                    <Typography variant="body2" component="span" display="block">
                                                        Courier: <strong>{order.courierName}</strong>
                                                    </Typography>
                                                )}
                                                <Typography variant="body2" component="span" display="block">
                                                    Number: <strong>{order.trackingNumber}</strong>
                                                </Typography>
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
                {order && order.paymentStatus === 'paid' && (
                    <OrderAccountingSection
                        orderId={order._id}
                        orderTotal={order.total}
                        orderCurrency={order.currency}
                        orderReturns={order.returns}
                        order={order}
                    />
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
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={notifyCustomer}
                                onChange={(e) => setNotifyCustomer(e.target.checked)}
                            />
                        }
                        label="Notify Customer"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setShipDialogOpen(false);
                        setIsEditingTracking(false);
                    }}>Cancel</Button>
                    <Button
                        onClick={() => handleStatusUpdate('shipped', { trackingNumber, courierName, trackingUrl }, notifyCustomer)}
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
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={notifyCustomer}
                                onChange={(e) => setNotifyCustomer(e.target.checked)}
                            />
                        }
                        label="Notify Customer"
                    />
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
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={notifyCustomer}
                                    onChange={(e) => setNotifyCustomer(e.target.checked)}
                                />
                            }
                            label="Notify Customer"
                            sx={{ mt: 2 }}
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
            {ConfirmStateDialog()}
        </Box>
    );

    function ConfirmStateDialog() {
        if (!confirmDialogState) return null;
        return (
            <Dialog open={confirmDialogState.open} onClose={() => setConfirmDialogState(null)}>
                <DialogTitle>{confirmDialogState.title}</DialogTitle>
                <DialogContent>
                    <Typography>{confirmDialogState.message}</Typography>
                    <Box mt={2}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={notifyCustomer}
                                    onChange={(e) => setNotifyCustomer(e.target.checked)}
                                />
                            }
                            label="Notify Customer"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogState(null)}>Cancel</Button>
                    <Button
                        onClick={() => confirmDialogState.action(notifyCustomer)}
                        variant="contained"
                        autoFocus
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
