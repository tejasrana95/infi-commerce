'use client';

import { JSX, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Box, Button, Typography, Card, CardContent, Chip,
    Divider, Alert, TextField, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Stepper, Step, StepLabel, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Stack,
    FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import InventoryIcon from '@mui/icons-material/Inventory';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { useCurrency } from '@/contexts/CurrencyContext';

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'pickup_scheduled' | 'picked_up' | 'received' | 'inspected' | 'refund_initiated' | 'refund_completed' | 'exchange_shipped' | 'completed' | 'cancelled';;

interface ReturnRequest {
    _id: string;
    returnNumber: string;
    orderId: {
        _id: string;
        orderNumber: string;
        total: number;
        currency?: string;
        shippingAddress?: {
            firstName: string;
            lastName: string;
            address1: string;
            address2?: string;
            city: string;
            state: string;
            country: string;
            postalCode: string;
            phone: string;
        };
    };
    customerId?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
    storeId: string;
    type: 'return' | 'exchange';
    status: ReturnStatus;
    reason: string;
    customerNotes?: string;
    items: Array<{
        productId: string;
        variantId?: string;
        name: string;
        sku: string;
        quantity: number;
        refundAmount: number;
        reason?: string;
    }>;
    totalRefundAmount: number;
    refundMethod?: 'original' | 'bank_transfer';
    pickup?: {
        scheduled: boolean;
        scheduledDate?: string;
        address?: object;
        trackingNumber?: string;
    };
    exchange?: {
        newProductId?: string;
        newVariantId?: string;
        newOrderId?: string;
        newOrderNumber?: string;
        priceDifference?: number;
    };
    refund?: {
        processed: boolean;
        processedAt?: string;
        amount?: number;
        transactionId?: string;
    };
    adminNotes?: string;
    timeline: Array<{
        status: string;
        date: string;
        note?: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

const returnStatusSteps = [
    'pending',
    'approved',
    'pickup_scheduled',
    'items_received',
    'refund_processed',
    'completed',
];

const exchangeStatusSteps = [
    'pending',
    'approved',
    'pickup_scheduled',
    'items_received',
    'exchange_shipped',
    'completed',
];

const RETURN_REASONS = {
    defective: 'Defective or Damaged',
    wrong_item: 'Wrong Item Received',
    not_as_described: 'Product Not As Described',
    size_fit: 'Size or Fit Issue',
    quality: 'Quality Issue',
    changed_mind: 'Changed my mind',
    other: 'Other',
};

const getStatusStep = (status: ReturnStatus, type: 'return' | 'exchange') => {
    if (status === 'rejected' || status === 'cancelled') return -1;
    const steps = type === 'exchange' ? exchangeStatusSteps : returnStatusSteps;
    return steps.indexOf(status);
};

export default function ReturnDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { formatPrice } = useCurrency();

    // Action states
    const [actionModal, setActionModal] = useState<{
        open: boolean;
        action: 'approve' | 'reject' | 'schedule_pickup' | 'mark_received' | 'process_refund' | 'ship_exchange' | 'complete' | null;
    }>({
        open: false,
        action: null,
    });
    const [actionNotes, setActionNotes] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledSlot, setScheduledSlot] = useState('');
    const [pickupMethod, setPickupMethod] = useState<'internal' | 'courier' | 'dropoff'>('internal');
    const [courierName, setCourierName] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');
    const [newOrderId, setNewOrderId] = useState('');
    const [newOrderNumber, setNewOrderNumber] = useState('');
    const [customerOrders, setCustomerOrders] = useState<Array<{ _id: string; orderNumber: string; total: number; createdAt: string; courierName?: string; trackingNumber?: string; status: string }>>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Address fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [phone, setPhone] = useState('');

    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchReturn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchReturn = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/returns/${id}`);
            setReturnRequest(response.data.data);
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to load return details', 'error');
            router.push('/returns');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerOrders = async (customerId: string) => {
        try {
            setLoadingOrders(true);
            const response = await api.get(`/orders?customerId=${customerId}&limit=50&sort=-createdAt`);
            setCustomerOrders(response.data.data || []);
        } catch (err: any) {
            console.error('Failed to fetch customer orders:', err);
            setCustomerOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleAction = (action: typeof actionModal.action) => {
        setActionModal({ open: true, action });
        setActionNotes('');
        setScheduledDate('');
        setScheduledSlot('');
        setPickupMethod('internal');
        setCourierName('');
        setTrackingNumber('');
        setTrackingUrl('');
        setNewOrderId('');
        setNewOrderNumber('');

        // Fetch customer orders for ship_exchange action
        if (action === 'ship_exchange' && returnRequest?.customerId?._id) {
            fetchCustomerOrders(returnRequest.customerId._id);
        }

        const populateAddress = (addr: any) => {
            setFirstName(addr?.firstName || '');
            setLastName(addr?.lastName || '');
            setAddress1(addr?.address1 || '');
            setAddress2(addr?.address2 || '');
            setCity(addr?.city || '');
            setState(addr?.state || '');
            setCountry(addr?.country || '');
            setPostalCode(addr?.postalCode || '');
            setPhone(addr?.phone || '');
        };

        if (returnRequest?.pickup?.address) {
            populateAddress(returnRequest.pickup.address);
        } else if (returnRequest?.orderId?.shippingAddress) {
            populateAddress(returnRequest.orderId.shippingAddress);
        } else {
            populateAddress({});
        }
    };

    const handleConfirmAction = async () => {
        if (!actionModal.action) return;

        setProcessing(true);
        try {
            let endpoint = '';
            let payload: any = { adminNotes: actionNotes };

            switch (actionModal.action) {
                case 'approve':
                    endpoint = `/returns/${id}/approve`;
                    break;
                case 'reject':
                    endpoint = `/returns/${id}/reject`;
                    break;
                case 'schedule_pickup':
                    endpoint = `/returns/${id}/schedule-pickup`;
                    payload = {
                        ...payload,
                        method: pickupMethod,
                        scheduledDate,
                        scheduledSlot,
                        trackingNumber,
                        trackingUrl,
                        courierName,
                        address: {
                            firstName,
                            lastName,
                            address1,
                            address2,
                            city,
                            state,
                            country,
                            postalCode,
                            phone,
                        },
                    };
                    break;
                case 'mark_received':
                    endpoint = `/returns/${id}/mark-received`;
                    break;
                case 'process_refund':
                    endpoint = `/returns/${id}/process-refund`;
                    break;
                case 'ship_exchange':
                    endpoint = `/returns/${id}/ship-exchange`;
                    payload = {
                        ...payload,
                        newOrderId,
                        newOrderNumber,
                        trackingNumber,
                        courierName,
                    };
                    break;
                case 'complete':
                    endpoint = `/returns/${id}/complete`;
                    break;
            }

            await api.patch(endpoint, payload);
            showNotification('Action completed successfully', 'success');
            fetchReturn();
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Action failed', 'error');
        } finally {
            setProcessing(false);
            setActionModal({ open: false, action: null });
        }
    };

    const getStatusColor = (status: ReturnStatus): 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default' => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'info';
            case 'rejected': return 'error';
            case 'pickup_scheduled': return 'info';
            case 'received': return 'primary';
            case 'refund_initiated': return 'success';
            case 'refund_completed': return 'success';
            case 'exchange_shipped': return 'primary';
            case 'completed': return 'success';
            case 'cancelled': return 'default';
            default: return 'default';
        }
    };

    const getActionButtons = () => {
        if (!returnRequest) return null;

        const buttons: JSX.Element[] = [];

        switch (returnRequest.status) {
            case 'pending':
                buttons.push(
                    <Button
                        key="approve"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleAction('approve')}
                    >
                        Approve
                    </Button>,
                    <Button
                        key="reject"
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleAction('reject')}
                    >
                        Reject
                    </Button>
                );
                break;
            case 'approved':
                buttons.push(
                    <Button
                        key="schedule"
                        variant="contained"
                        color="primary"
                        startIcon={<LocalShippingIcon />}
                        onClick={() => handleAction('schedule_pickup')}
                    >
                        Schedule Pickup
                    </Button>
                );
                break;
            case 'pickup_scheduled':
                buttons.push(
                    <Stack direction="row" gap={2} flexWrap="wrap">
                        <Button
                            key="received"
                            variant="contained"
                            color="primary"
                            startIcon={<InventoryIcon />}
                            onClick={() => handleAction('mark_received')}
                        >
                            Mark Items Received
                        </Button>
                        <Button
                            key="schedule"
                            variant="contained"
                            color="primary"
                            startIcon={<LocalShippingIcon />}
                            onClick={() => handleAction('schedule_pickup')}
                        >
                            Re-schedule Pickup
                        </Button>
                    </Stack>
                );
                break;
            case 'received':
                if (returnRequest.type === 'exchange') {
                    buttons.push(
                        <Button
                            key="ship_exchange"
                            variant="contained"
                            color="primary"
                            startIcon={<LocalShippingIcon />}
                            onClick={() => handleAction('ship_exchange')}
                        >
                            Ship Exchange
                        </Button>
                    );
                } else {
                    buttons.push(
                        <Button
                            key="refund"
                            variant="contained"
                            color="success"
                            startIcon={<PaymentIcon />}
                            onClick={() => handleAction('process_refund')}
                        >
                            Process Refund
                        </Button>
                    );
                }
                break;
            case 'refund_initiated':
            case 'refund_completed':
            case 'exchange_shipped':
                buttons.push(
                    <Button
                        key="complete"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleAction('complete')}
                    >
                        Mark Complete
                    </Button>
                );
                break;
        }

        return buttons.length > 0 ? (
            <Stack direction="row" spacing={2}>{buttons}</Stack>
        ) : null;
    };

    const getActionModalContent = () => {
        switch (actionModal.action) {
            case 'approve':
                return (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Are you sure you want to approve this return request?
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Notes (optional)"
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                        />
                    </>
                );
            case 'reject':
                return (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Are you sure you want to reject this return request?
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Reason for rejection"
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            required
                        />
                    </>
                );
            case 'schedule_pickup':
                return (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Fill in the pickup details for this return.
                        </Typography>
                        <Stack spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Pickup Method</InputLabel>
                                <Select
                                    label="Pickup Method"
                                    value={pickupMethod}
                                    onChange={(e) => setPickupMethod(e.target.value as any)}
                                >
                                    <MenuItem value="internal">Internal Pickup</MenuItem>
                                    <MenuItem value="courier">Courier Service</MenuItem>
                                    <MenuItem value="dropoff">Customer Drop-off</MenuItem>
                                </Select>
                            </FormControl>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="datetime-local"
                                        label="Scheduled Date"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Scheduled Slot</InputLabel>
                                        <Select
                                            label="Scheduled Slot"
                                            value={scheduledSlot}
                                            onChange={(e) => setScheduledSlot(e.target.value)}
                                        >
                                            <MenuItem value="08:00 AM - 12:00 PM">08:00 AM - 12:00 PM</MenuItem>
                                            <MenuItem value="12:00 PM - 04:00 PM">12:00 PM - 04:00 PM</MenuItem>
                                            <MenuItem value="04:00 PM - 08:00 PM">04:00 PM - 08:00 PM</MenuItem>
                                            <MenuItem value="08:00 PM - 10:00 PM">08:00 PM - 10:00 PM</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            {pickupMethod === 'courier' && (
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Courier Name"
                                            value={courierName}
                                            onChange={(e) => setCourierName(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Tracking Number"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label="Tracking URL"
                                            value={trackingUrl}
                                            onChange={(e) => setTrackingUrl(e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                            )}

                            <Typography variant="subtitle2" sx={{ mt: 1 }}>Pickup Address</Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Address Line 1"
                                        value={address1}
                                        onChange={(e) => setAddress1(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Address Line 2 (Optional)"
                                        value={address2}
                                        onChange={(e) => setAddress2(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="City"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="State / Province"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Postal Code"
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Country"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </Grid>
                            </Grid>

                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Admin Notes"
                                value={actionNotes}
                                onChange={(e) => setActionNotes(e.target.value)}
                                placeholder="Additional instructions for pickup..."
                            />
                        </Stack>
                    </>
                );
            case 'mark_received':
                return (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Confirm that all items have been received and inspected
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Inspection notes (optional)"
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                        />
                    </>
                );
            case 'process_refund':
                return (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Process refund of {formatPrice(returnRequest?.totalRefundAmount || 0)} via{' '}
                            {returnRequest?.refundMethod?.replace('_', ' ') || 'original payment method'}?
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Notes (optional)"
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                        />
                    </>
                );
            case 'ship_exchange':
                return (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Ship exchange items to customer. Select the replacement order if one was created.
                        </Typography>
                        <Stack spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Link to New Order (optional)</InputLabel>
                                <Select
                                    label="Link to New Order (optional)"
                                    value={newOrderId}
                                    onChange={(e) => {
                                        const selectedOrder = customerOrders.find(o => o._id === e.target.value);
                                        setNewOrderId(e.target.value);
                                        setNewOrderNumber(selectedOrder?.orderNumber || '');
                                        // Auto-populate courier and tracking from the selected order
                                        setCourierName(selectedOrder?.courierName || '');
                                        setTrackingNumber(selectedOrder?.trackingNumber || '');
                                    }}
                                    disabled={loadingOrders}
                                >
                                    <MenuItem value="">
                                        <em>None - No linked order</em>
                                    </MenuItem>
                                    {customerOrders.map((order) => (
                                        <MenuItem key={order._id} value={order._id}>
                                            {order.orderNumber} - {formatPrice(order.total)} - {order.status.replace(/_/g, ' ')} ({new Date(order.createdAt).toLocaleDateString()})
                                        </MenuItem>
                                    ))}
                                </Select>
                                {loadingOrders && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Loading customer orders...
                                    </Typography>
                                )}
                            </FormControl>
                            {/* Only show manual entry fields when no order is selected */}
                            {!newOrderId && (
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Courier Name"
                                            value={courierName}
                                            onChange={(e) => setCourierName(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Tracking Number"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                            )}
                            {/* Show read-only tracking info when order is selected */}
                            {newOrderId && (courierName || trackingNumber) && (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    Tracking from selected order: <strong>{courierName || 'N/A'}</strong> - {trackingNumber || 'No tracking number'}
                                </Alert>
                            )}
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Admin Notes (optional)"
                                value={actionNotes}
                                onChange={(e) => setActionNotes(e.target.value)}
                            />
                        </Stack>
                    </>
                );
            case 'complete':
                return (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Mark this {returnRequest?.type === 'exchange' ? 'exchange' : 'return'} as complete?
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Final notes (optional)"
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                        />
                    </>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!returnRequest) {
        return (
            <Alert severity="error">Return request not found</Alert>
        );
    }

    const activeStep = getStatusStep(returnRequest.status, returnRequest.type);

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.back()}
                        variant="outlined"
                    >
                        Back
                    </Button>
                    <Box>
                        <Typography variant="h4" fontWeight={600}>
                            {returnRequest.returnNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Created {new Date(returnRequest.createdAt).toLocaleString()}
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                    <Chip
                        label={returnRequest.type}
                        color={returnRequest.type === 'return' ? 'primary' : 'secondary'}
                        sx={{ textTransform: 'capitalize' }}
                    />
                    <Chip
                        label={returnRequest.status.replace(/_/g, ' ')}
                        color={getStatusColor(returnRequest.status)}
                        sx={{ textTransform: 'capitalize' }}
                    />
                </Box>
            </Box>

            {/* Status Stepper */}
            {activeStep >= 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Stepper activeStep={activeStep} alternativeLabel>
                            {(returnRequest.type === 'exchange' ? exchangeStatusSteps : returnStatusSteps).map((step) => (
                                <Step key={step}>
                                    <StepLabel>{step.replace(/_/g, ' ')}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </CardContent>
                </Card>
            )}

            {/* Rejected/Cancelled Alert */}
            {(returnRequest.status === 'rejected' || returnRequest.status === 'cancelled') && (
                <Alert severity={returnRequest.status === 'rejected' ? 'error' : 'warning'} sx={{ mb: 3 }}>
                    This return has been {returnRequest.status}.
                    {returnRequest.adminNotes && ` Reason: ${returnRequest.adminNotes}`}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Main Info */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {/* Items */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                {returnRequest.type === 'exchange' ? 'Exchange' : 'Return'} Items
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Product</TableCell>
                                            <TableCell>SKU</TableCell>
                                            <TableCell align="center">Qty</TableCell>
                                            {returnRequest.type === 'return' && (
                                                <TableCell align="right">Refund</TableCell>
                                            )}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {returnRequest.items.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {item.name}
                                                    </Typography>
                                                    {item.reason && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Reason: {item.reason}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>{item.sku}</TableCell>
                                                <TableCell align="center">{item.quantity}</TableCell>
                                                {returnRequest.type === 'return' && (
                                                    <TableCell align="right">
                                                        {formatPrice(item.refundAmount)}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                        {returnRequest.type === 'return' && (
                                            <TableRow>
                                                <TableCell colSpan={3} align="right">
                                                    <Typography variant="body2" fontWeight={600}>Total Refund</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {formatPrice(returnRequest.totalRefundAmount)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Reason & Notes */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Customer Information</Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                        {RETURN_REASONS[returnRequest.reason as keyof typeof RETURN_REASONS] || returnRequest.reason}
                                    </Typography>
                                </Grid>
                                {returnRequest.customerNotes && (
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Customer Notes</Typography>
                                        <Typography variant="body2">{returnRequest.customerNotes}</Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    {returnRequest.timeline && returnRequest.timeline.length > 0 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>Timeline</Typography>
                                {returnRequest.timeline.map((event, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.75 }} />
                                        <Box>
                                            <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                                                {event.status.replace(/_/g, ' ')}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(event.date).toLocaleString()}
                                            </Typography>
                                            {event.note && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {event.note}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    {/* Actions */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Actions</Typography>
                            {getActionButtons() || (
                                <Typography variant="body2" color="text.secondary">
                                    No actions available for this status
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Info */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Order Details</Typography>
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Order Number</Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                                        onClick={() => router.push(`/orders/${returnRequest.orderId._id}`)}
                                    >
                                        {returnRequest.orderId.orderNumber}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Order Total</Typography>
                                    <Typography variant="body2">
                                        {formatPrice(returnRequest.orderId.total)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    {returnRequest.customerId && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>Customer</Typography>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Name</Typography>
                                        <Typography variant="body2">
                                            {returnRequest.customerId.firstName} {returnRequest.customerId.lastName}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Email</Typography>
                                        <Typography variant="body2">{returnRequest.customerId.email}</Typography>
                                    </Box>
                                    {returnRequest.customerId.phone && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Phone</Typography>
                                            <Typography variant="body2">{returnRequest.customerId.phone}</Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    {/* Refund/Exchange Details */}
                    {returnRequest.type === 'return' ? (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>Refund Details</Typography>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Method</Typography>
                                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                            {returnRequest.refundMethod?.replace('_', ' ') || 'Not selected'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Amount</Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {formatPrice(returnRequest.totalRefundAmount)}
                                        </Typography>
                                    </Box>
                                    {returnRequest.refund?.processed && (
                                        <>
                                            <Divider />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Processed On</Typography>
                                                <Typography variant="body2">
                                                    {new Date(returnRequest.refund.processedAt!).toLocaleString()}
                                                </Typography>
                                            </Box>
                                            {returnRequest.refund.transactionId && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                                                    <Typography variant="body2">{returnRequest.refund.transactionId}</Typography>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>Exchange Details</Typography>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Status</Typography>
                                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                            {returnRequest.status.replace(/_/g, ' ')}
                                        </Typography>
                                    </Box>
                                    {returnRequest.exchange?.newOrderNumber && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">New Order Number</Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {returnRequest.exchange.newOrderNumber}
                                            </Typography>
                                        </Box>
                                    )}
                                    {returnRequest.exchange?.priceDifference != null && returnRequest.exchange.priceDifference !== 0 && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Price Difference</Typography>
                                            <Typography variant="body2" fontWeight={600} color={returnRequest.exchange.priceDifference > 0 ? 'success.main' : 'error.main'}>
                                                {returnRequest.exchange.priceDifference > 0 ? '+' : ''}{formatPrice(returnRequest.exchange.priceDifference)}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Action Modal */}
            <Dialog
                open={actionModal.open}
                onClose={() => setActionModal({ open: false, action: null })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ textTransform: 'capitalize' }}>
                    {actionModal.action?.replace('_', ' ')}
                </DialogTitle>
                <DialogContent>
                    {getActionModalContent()}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setActionModal({ open: false, action: null })}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color={actionModal.action === 'reject' ? 'error' : 'primary'}
                        onClick={handleConfirmAction}
                        disabled={
                            processing ||
                            (actionModal.action === 'reject' && !actionNotes.trim()) ||
                            (actionModal.action === 'schedule_pickup' && !scheduledDate)
                        }
                    >
                        {processing ? 'Processing...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
