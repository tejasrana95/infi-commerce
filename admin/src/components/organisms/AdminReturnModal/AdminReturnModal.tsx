'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    CircularProgress,
    Alert,
} from '@mui/material';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { useCurrency } from '@/contexts/CurrencyContext';

import { Order, OrderItem } from '@/types/order';

interface AdminReturnModalProps {
    open: boolean;
    onClose: () => void;
    order?: Order | null | undefined;
    onSuccess?: () => void;
}

const getProductId = (item: OrderItem): string => {
    if (typeof item.productId === 'string') {
        return item.productId;
    }
    return item?.productId?._id || null;
};

const RETURN_REASONS = [
    { value: 'defective', label: 'Defective/Damaged Product' },
    { value: 'wrong_item', label: 'Wrong Item Received' },
    { value: 'not_as_described', label: 'Not As Described' },
    { value: 'size_fit', label: 'Size/Fit Issue' },
    { value: 'quality', label: 'Quality Not As Expected' },
    { value: 'changed_mind', label: 'Changed Mind' },
    { value: 'other', label: 'Other' },
];

const REFUND_METHODS = [
    { value: 'original', label: 'Refund to Original Payment Method' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
];

export default function AdminReturnModal({ open, onClose, order, onSuccess }: AdminReturnModalProps) {
    const { showNotification } = useNotification();
    const { formatPrice } = useCurrency();

    const [type, setType] = useState<'return' | 'exchange'>('return');
    const [reason, setReason] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [refundMethod, setRefundMethod] = useState('original');
    const [selectedItems, setSelectedItems] = useState<Map<string, { quantity: number; checked: boolean }>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize selected items when order changes
    useEffect(() => {
        if (order?.items) {
            const initialSelection = new Map<string, { quantity: number; checked: boolean }>();
            order.items.forEach((item) => {
                const pId = getProductId(item);
                const key = item.variantId ? `${pId}-${item.variantId}` : pId;
                initialSelection.set(key, { quantity: item.quantity, checked: true });
            });
            setSelectedItems(initialSelection);
        }
    }, [order]);

    // Helper to extract error messages from unknown errors
    const getErrorMessage = (err: unknown) => {
        if (!err) return 'Unknown error';
        if (typeof err === 'string') return err;
        if (typeof err === 'object' && err !== null && 'response' in err) {
            return (err as any).response?.data?.message || JSON.stringify(err);
        }
        return JSON.stringify(err);
    };

    const handleItemToggle = (itemKey: string) => {
        setSelectedItems((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(itemKey);
            if (current) {
                newMap.set(itemKey, { ...current, checked: !current.checked });
            }
            return newMap;
        });
    };

    const handleQuantityChange = (itemKey: string, quantity: number) => {
        setSelectedItems((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(itemKey);
            if (current) {
                newMap.set(itemKey, { ...current, quantity: Math.max(1, quantity) });
            }
            return newMap;
        });
    };

    const calculateRefundBreakdown = () => {
        if (!order) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };

        let subtotal = 0;
        let tax = 0;
        let shipping = 0;

        order.items.forEach((item) => {
            const pId = getProductId(item);
            const key = item.variantId ? `${pId}-${item.variantId}` : pId;
            const selection = selectedItems.get(key);
            if (selection?.checked) {
                // Use discounted price if available, otherwise regular price
                const price = item.discountedPrice || item.price || 0;
                subtotal += (price * selection.quantity);
                tax += (item.taxAmount || 0) * selection.quantity;

                // Calculate proportional shipping refund per item
                // shippingCost is stored at item level for the full quantity
                const itemShippingCost = item.shippingCost || 0;
                shipping += itemShippingCost * selection.quantity;
            }
        });

        return {
            subtotal,
            tax,
            shipping,
            total: subtotal + tax + shipping
        };
    };

    const getSelectedItemsCount = () => {
        let count = 0;
        selectedItems.forEach((selection) => {
            if (selection.checked) count++;
        });
        return count;
    };

    const handleSubmit = async () => {
        if (!order) return;
        if (!reason) {
            setError('Please select a return reason');
            return;
        }
        if (getSelectedItemsCount() === 0) {
            setError('Please select at least one item to return');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Build items array for the request
            const items: Array<{
                productId: string;
                variantId?: string;
                quantity: number;
                name: string;
                sku: string;
                refundAmount: number;
            }> = [];

            order.items.forEach((item) => {
                const pId = getProductId(item);
                const key = item.variantId ? `${pId}-${item.variantId}` : pId;
                const selection = selectedItems.get(key);
                if (selection?.checked) {
                    const price = item.discountedPrice || item.price || 0;
                    const itemSubtotal = price * selection.quantity;
                    const itemTax = (item.taxAmount || 0) * selection.quantity;
                    const itemShippingCost = item.shippingCost || 0;
                    const unitShipping = itemShippingCost / (item.quantity || 1);
                    const itemShipping = unitShipping * selection.quantity;
                    const total = itemSubtotal + itemTax + itemShipping;

                    items.push({
                        productId: pId,
                        variantId: item.variantId,
                        quantity: selection.quantity,
                        name: item.name,
                        sku: item.sku,
                        refundAmount: total,
                    });
                }
            });

            const refundBreakdown = calculateRefundBreakdown();

            await api.post('/returns/admin/create', {
                orderId: order._id,
                storeId: typeof order.storeId === 'object' ? order.storeId._id : order.storeId,
                customerId: typeof order.customerId === 'object' ? order.customerId?._id : order.customerId,
                type,
                reason,
                items,
                refundMethod,
                adminNotes,
                subtotalRefundAmount: refundBreakdown.subtotal,
                taxRefundAmount: refundBreakdown.tax,
                shippingRefundAmount: refundBreakdown.shipping,
                totalRefundAmount: refundBreakdown.total,
            });

            showNotification('Return request created successfully', 'success');
            onSuccess?.();
            onClose();
            resetForm();
        } catch (err: unknown) {
            const message = getErrorMessage(err);
            setError(message || 'Failed to create return request');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setType('return');
        setReason('');
        setAdminNotes('');
        setRefundMethod('original');
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!order) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Create Return/Exchange Request</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Order #{order.orderNumber}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Type Selection */}
                <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={type}
                            label="Type"
                            onChange={(e) => setType(e.target.value as 'return' | 'exchange')}
                        >
                            <MenuItem value="return">Return (Refund)</MenuItem>
                            <MenuItem value="exchange">Exchange</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Reason Selection */}
                <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth required>
                        <InputLabel>Reason</InputLabel>
                        <Select
                            value={reason}
                            label="Reason"
                            onChange={(e) => setReason(e.target.value)}
                        >
                            {RETURN_REASONS.map((r) => (
                                <MenuItem key={r.value} value={r.value}>
                                    {r.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Items Selection */}
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Items to Return</Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" />
                                <TableCell>Product</TableCell>
                                <TableCell>SKU</TableCell>
                                <TableCell align="center">Quantity</TableCell>
                                <TableCell align="right">Refund</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {order.items.map((item) => {
                                const pId = getProductId(item);
                                const key = item.variantId ? `${pId}-${item.variantId}` : pId;
                                const selection = selectedItems.get(key);
                                const isChecked = selection?.checked || false;
                                const qty = selection?.quantity || item.quantity;

                                return (
                                    <TableRow key={key}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={isChecked}
                                                onChange={() => handleItemToggle(key)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {item.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{item.sku}</TableCell>
                                        <TableCell align="center">
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={qty}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 1;
                                                    if (value > item.quantity) {
                                                        return;
                                                    }
                                                    handleQuantityChange(key, value)
                                                }}
                                                disabled={!isChecked}
                                                inputProps={{ min: 1, max: item.quantity }}
                                                sx={{ width: 70 }}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                                / {item.quantity}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            {isChecked ? (() => {
                                                const price = item.discountedPrice || item.price || 0;
                                                const itemSubtotal = price * qty;
                                                const itemTax = (item.taxAmount || 0) * qty;
                                                const itemShippingCost = item.shippingCost || 0;
                                                const unitShipping = itemShippingCost / (item.quantity || 1);
                                                const itemShipping = unitShipping * qty;
                                                return formatPrice(itemSubtotal + itemTax + itemShipping);
                                            })() : '-'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Refund Method (for returns only) */}
                {type === 'return' && (
                    <Box sx={{ mb: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Refund Method</InputLabel>
                            <Select
                                value={refundMethod}
                                label="Refund Method"
                                onChange={(e) => setRefundMethod(e.target.value)}
                            >
                                {REFUND_METHODS.map((m) => (
                                    <MenuItem key={m.value} value={m.value}>
                                        {m.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}

                {/* Admin Notes */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Admin Notes (optional)"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Internal notes about this return request..."
                    />
                </Box>

                {/* Summary */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">
                            {getSelectedItemsCount()} item(s) selected
                        </Typography>
                        <Box textAlign="right">
                            <Box display="flex" gap={3} justifyContent="flex-end" mb={0.5}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Subtotal</Typography>
                                    <Typography variant="body2">{formatPrice(calculateRefundBreakdown().subtotal)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Tax</Typography>
                                    <Typography variant="body2">{formatPrice(calculateRefundBreakdown().tax)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Shipping</Typography>
                                    <Typography variant="body2">{formatPrice(calculateRefundBreakdown().shipping)}</Typography>
                                </Box>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                Total Refund
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color="primary.main">
                                {formatPrice(calculateRefundBreakdown().total)}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || getSelectedItemsCount() === 0}
                >
                    {loading ? <CircularProgress size={20} /> : 'Create Return Request'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
