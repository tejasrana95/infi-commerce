'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Paper, Divider, Alert, CircularProgress, Button, Chip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useOrderForm } from './OrderFormContext';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@/types/order';
import api from '@/lib/api';

interface ShippingBreakdown {
    itemProductIds: string[];
    ruleName: string;
    ruleId: string;
    ruleType: 'category' | 'geo' | 'universal';
    weight: number;
    value: number;
    cost: number;
    rateType: string;
    rate: number;
}

interface ShippingCalculationResult {
    success: boolean;
    shippingCost: number;
    currency: string;
    breakdown: ShippingBreakdown[];
    itemsWithoutShipping: { productId: string; productName: string }[];
    orderSummary: {
        subtotal: number;
        totalWeight: number;
        itemCount: number;
        shippingCost: number;
        total: number;
    };
    calculationMethod: string;
    priorityExplanation: string;
}

export default function PaymentSection() {
    const {
        storeId,
        paymentMethod, setPaymentMethod,
        paymentStatus, setPaymentStatus,
        status, setStatus,
        adminNote, setAdminNote,
        customerNote, setCustomerNote,
        shippingCost, setShippingCost,
        tax, setTax,
        discount, setDiscount,
        customer,
        guestEmail,
        items,
        shippingAddress,
        subtotal,
        total,
        currency,
    } = useOrderForm();

    const [calculatingShipping, setCalculatingShipping] = useState(false);
    const [shippingResult, setShippingResult] = useState<ShippingCalculationResult | null>(null);
    const [shippingError, setShippingError] = useState<string | null>(null);

    // Calculate shipping when items or country changes
    const calculateShipping = async () => {
        if (!storeId || items.length === 0 || !shippingAddress.country) {
            setShippingError(null);
            setShippingResult(null);
            return;
        }

        setCalculatingShipping(true);
        setShippingError(null);

        try {
            const response = await api.post('/shipping/calculate-smart', {
                storeId,
                country: shippingAddress.country,
                currency,
                items: items.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                })),
            });

            const result = response.data as ShippingCalculationResult;
            setShippingResult(result);

            // Auto-apply the calculated shipping cost
            if (result.success && result.shippingCost !== undefined) {
                setShippingCost(result.shippingCost);
            }
        } catch (err: any) {
            console.error('Shipping calculation error:', err);
            setShippingError(err.response?.data?.message || 'Failed to calculate shipping');
            setShippingResult(null);
        } finally {
            setCalculatingShipping(false);
        }
    };

    // Auto-calculate when relevant data changes
    useEffect(() => {
        if (storeId && items.length > 0 && shippingAddress.country) {
            calculateShipping();
        }
    }, [storeId, shippingAddress.country]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    const getRuleTypeColor = (ruleType: string) => {
        switch (ruleType) {
            case 'category': return 'primary';
            case 'geo': return 'secondary';
            case 'universal': return 'default';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Shipping & Pricing</Typography>

            {/* Shipping Calculation Section */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>Shipping Calculation</Typography>
                    <Button
                        size="small"
                        startIcon={calculatingShipping ? <CircularProgress size={16} /> : <RefreshIcon />}
                        onClick={calculateShipping}
                        disabled={calculatingShipping || !shippingAddress.country || items.length === 0}
                    >
                        {calculatingShipping ? 'Calculating...' : 'Recalculate'}
                    </Button>
                </Box>

                {!shippingAddress.country && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Please set the shipping country in the Address step to calculate shipping.
                    </Alert>
                )}

                {items.length === 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Please add items to the order to calculate shipping.
                    </Alert>
                )}

                {shippingError && (
                    <Alert severity="error" sx={{ mb: 2 }}>{shippingError}</Alert>
                )}

                {shippingResult && shippingResult.success && (
                    <Box>
                        {/* Breakdown */}
                        {shippingResult.breakdown.length > 0 && (
                            <Box mb={2}>
                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                    Shipping Breakdown:
                                </Typography>
                                {shippingResult.breakdown.map((item, idx) => (
                                    <Box
                                        key={idx}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        py={0.5}
                                        borderBottom={1}
                                        borderColor="divider"
                                    >
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Chip
                                                label={item.ruleType}
                                                size="small"
                                                color={getRuleTypeColor(item.ruleType) as any}
                                                sx={{ height: 20, fontSize: 10 }}
                                            />
                                            <Typography variant="body2">{item.ruleName}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ({item.weight.toFixed(2)} kg)
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight={500}>
                                            {formatCurrency(item.cost)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Items without shipping */}
                        {shippingResult.itemsWithoutShipping.length > 0 && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    No shipping rule found for: {shippingResult.itemsWithoutShipping.map(i => i.productName).join(', ')}
                                </Typography>
                            </Alert>
                        )}
                    </Box>
                )}

                {/* Manual Override */}
                <Grid container spacing={2} mt={1}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Shipping Cost"
                            type="number"
                            value={shippingCost}
                            onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                            helperText={shippingResult ? 'Auto-calculated (editable)' : 'Manual entry'}
                            size="small"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Tax"
                            type="number"
                            value={tax}
                            onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                            size="small"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Discount"
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                            size="small"
                        />
                    </Grid>
                </Grid>

                {/* Pricing Summary */}
                <Box mt={2} pt={2} borderTop={1} borderColor="divider">
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography color="text.secondary">Subtotal:</Typography>
                        <Typography>{formatCurrency(subtotal)}</Typography>
                    </Box>
                    {shippingCost > 0 && (
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography color="text.secondary">Shipping:</Typography>
                            <Typography>{formatCurrency(shippingCost)}</Typography>
                        </Box>
                    )}
                    {tax > 0 && (
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography color="text.secondary">Tax:</Typography>
                            <Typography>{formatCurrency(tax)}</Typography>
                        </Box>
                    )}
                    {discount > 0 && (
                        <Box display="flex" justifyContent="space-between" mb={1} color="success.main">
                            <Typography>Discount:</Typography>
                            <Typography>-{formatCurrency(discount)}</Typography>
                        </Box>
                    )}
                    <Box display="flex" justifyContent="space-between" pt={1} borderTop={1} borderColor="divider">
                        <Typography variant="h6">Total:</Typography>
                        <Typography variant="h6" color="primary">{formatCurrency(total)}</Typography>
                    </Box>
                </Box>
            </Paper>

            <Typography variant="h6" gutterBottom>Payment & Status</Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                            value={paymentMethod}
                            label="Payment Method"
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        >
                            <MenuItem value="cod">Cash on Delivery</MenuItem>
                            <MenuItem value="razorpay">Razorpay</MenuItem>
                            <MenuItem value="stripe">Stripe</MenuItem>
                            <MenuItem value="paypal">PayPal</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                        <InputLabel>Payment Status</InputLabel>
                        <Select
                            value={paymentStatus}
                            label="Payment Status"
                            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                        >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="paid">Paid</MenuItem>
                            <MenuItem value="failed">Failed</MenuItem>
                            <MenuItem value="refunded">Refunded</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                        <InputLabel>Order Status</InputLabel>
                        <Select
                            value={status}
                            label="Order Status"
                            onChange={(e) => setStatus(e.target.value as OrderStatus)}
                        >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="processing">Processing</MenuItem>
                            <MenuItem value="shipped">Shipped</MenuItem>
                            <MenuItem value="delivered">Delivered</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Customer Note"
                        value={customerNote}
                        onChange={(e) => setCustomerNote(e.target.value)}
                        placeholder="Notes visible to customer..."
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Admin Note"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Internal notes (not visible to customer)..."
                    />
                </Grid>
            </Grid>

            {/* Order Summary */}
            <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Order Summary</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="body2" color="text.secondary">Customer</Typography>
                        <Typography variant="body2" fontWeight={500}>
                            {customer ? `${customer.firstName} ${customer.lastName}` : (guestEmail ? 'Guest' : 'Not selected')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {customer?.email || guestEmail}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="body2" color="text.secondary">Shipping To</Typography>
                        <Typography variant="body2">
                            {shippingAddress.city ? `${shippingAddress.city}, ${shippingAddress.country}` : 'Not set'}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="body2" color="text.secondary">Items</Typography>
                        <Typography variant="body2">
                            {items.length} product(s)
                            {shippingResult && ` • ${shippingResult.orderSummary.totalWeight.toFixed(2)} kg`}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
