'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    Tooltip,
    Card,
    CardContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import api from '@/lib/api';
import {
    OrderAccounting,
    MiscellaneousExpense,
    AccountingUpdatePayload,
} from '@/types/accounting';
import { useNotification } from '@/contexts/NotificationContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Order } from '@/types';
import { useConfirm } from '@/contexts/ConfirmContext';

interface OrderAccountingSectionProps {
    orderId: string;
    orderTotal: number;
    orderCurrency: string;
    orderReturns?: any[];
    order: Order;
}

export default function OrderAccountingSection({
    orderId,
    orderTotal,
    orderCurrency,
    orderReturns,
    order,
}: OrderAccountingSectionProps) {
    const [accounting, setAccounting] = useState<OrderAccounting | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetchingGateway, setFetchingGateway] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const { showNotification } = useNotification();
    const { convertAndFormat } = useCurrency();
    const { confirm } = useConfirm();
    // Form state
    const [actualShippingCost, setActualShippingCost] = useState<string>('');
    const [paymentGatewayFee, setPaymentGatewayFee] = useState<string>('');
    const [actualDepositedAmount, setActualDepositedAmount] = useState<string>('');
    const [miscExpenses, setMiscExpenses] = useState<MiscellaneousExpense[]>([]);
    const [cogsOverrides, setCogsOverrides] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        fetchAccounting();
    }, [orderId]);

    const fetchAccounting = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/accounting/${orderId}`);
            if (response.data.success) {
                const data = response.data.data as OrderAccounting;
                setAccounting(data);

                // Initialize form state
                setActualShippingCost(data.expenses.actualShippingCost?.toString() || '');
                setPaymentGatewayFee(data.expenses.paymentGatewayFee?.toString() || '');
                setActualDepositedAmount(data.expenses.actualDepositedAmount?.toString() || '');
                setMiscExpenses(data.expenses.miscellaneous || []);
                setNotes(data.notes || '');

                // Initialize COGS overrides
                const overrides: Record<string, number> = {};
                data.cogs.items.forEach(item => {
                    const key = `${item.productId}-${item.variantId || ''}`;
                    overrides[key] = item.unitCostPrice;
                });
                setCogsOverrides(overrides);
            }
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to load accounting data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const cogsItems = accounting?.cogs.items.map(item => {
                const key = `${item.productId}-${item.variantId || ''}`;
                const newCostPrice = cogsOverrides[key];
                return {
                    productId: item.productId,
                    variantId: item.variantId,
                    unitCostPrice: newCostPrice !== undefined ? newCostPrice : item.unitCostPrice,
                    isOverridden: newCostPrice !== undefined && newCostPrice !== item.unitCostPrice,
                };
            }) || [];

            const payload: AccountingUpdatePayload = {
                expenses: {
                    actualShippingCost: parseFloat(actualShippingCost) || 0,
                    paymentGatewayFee: parseFloat(paymentGatewayFee) || 0,
                    actualDepositedAmount: parseFloat(actualDepositedAmount) || 0,
                    miscellaneous: miscExpenses.filter(e => e.description && e.amount > 0),
                },
                cogs: {
                    items: cogsItems,
                },
                notes,
            };

            const response = await api.put(`/accounting/${orderId}`, payload);
            if (response.data.success) {
                setAccounting(response.data.data);
                setHasChanges(false);
                showNotification('Accounting data saved successfully', 'success');
            }
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to save accounting data', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleFetchGatewayData = async () => {
        try {
            setFetchingGateway(true);
            const response = await api.post(`/accounting/${orderId}/fetch-gateway-data`);
            if (response.data.success) {
                const data = response.data.data as OrderAccounting;
                setAccounting(data);
                setPaymentGatewayFee(data.expenses.paymentGatewayFee?.toString() || '');
                setActualDepositedAmount(data.expenses.actualDepositedAmount?.toString() || '');
                showNotification('Gateway data fetched successfully', 'success');
            }
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to fetch gateway data', 'error');
        } finally {
            setFetchingGateway(false);
        }
    };

    const handleRegenerate = async () => {
        if (!await confirm({ title: 'Are your sure to regenerate accounting data?', message: 'This will recalculate all accounting values from the order data. Any manual overrides will be lost. Continue?', severity: 'error' })) return;
        try {
            setRegenerating(true);
            const response = await api.post(`/accounting/${orderId}/regenerate`);
            if (response.data.success) {
                const data = response.data.data as OrderAccounting;
                setAccounting(data);

                // Re-initialize form state
                setActualShippingCost(data.expenses.actualShippingCost?.toString() || '');
                setPaymentGatewayFee(data.expenses.paymentGatewayFee?.toString() || '');
                setActualDepositedAmount(data.expenses.actualDepositedAmount?.toString() || '');
                setMiscExpenses(data.expenses.miscellaneous || []);
                setNotes(data.notes || '');

                // Re-initialize COGS overrides
                const overrides: Record<string, number> = {};
                data.cogs.items.forEach(item => {
                    const key = `${item.productId}-${item.variantId || ''}`;
                    overrides[key] = item.unitCostPrice;
                });
                setCogsOverrides(overrides);
                setHasChanges(false);

                showNotification('Accounting data regenerated with correct values', 'success');
            }
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to regenerate accounting data', 'error');
        } finally {
            setRegenerating(false);
        }
    };

    const addMiscExpense = () => {
        setMiscExpenses([...miscExpenses, { description: '', amount: 0 }]);
        setHasChanges(true);
    };

    const updateMiscExpense = (index: number, field: 'description' | 'amount', value: string | number) => {
        const updated = [...miscExpenses];
        updated[index] = { ...updated[index], [field]: value };
        setMiscExpenses(updated);
        setHasChanges(true);
    };

    const removeMiscExpense = (index: number) => {
        setMiscExpenses(miscExpenses.filter((_, i) => i !== index));
        setHasChanges(true);
    };

    const updateCogsCostPrice = (productId: string, variantId: string | undefined, value: string) => {
        const key = `${productId}-${variantId || ''}`;
        setCogsOverrides({ ...cogsOverrides, [key]: parseFloat(value) || 0 });
        setHasChanges(true);
    };

    // Calculate returns impact on accounting
    const returnsImpact = useMemo(() => {
        if (!orderReturns || orderReturns.length === 0) {
            return { totalReturns: 0, returnCount: 0, description: 'No returns' };
        }
        const totalReturns = orderReturns.reduce((sum, r) => sum + (r.totalRefundAmount || 0), 0);
        return {
            totalReturns,
            returnCount: orderReturns.length,
            description: `${orderReturns.length} return(s), ${convertAndFormat(totalReturns, orderCurrency)}`
        };
    }, [orderReturns, orderCurrency, convertAndFormat]);

    // Realtime Calculations
    const realtimeCogs = useMemo(() => {
        if (!accounting) return { items: [], totalCogs: 0 };
        const items = accounting.cogs.items.map(item => {
            const key = `${item.productId}-${item.variantId || ''}`;
            const unitCost = cogsOverrides[key] ?? item.unitCostPrice;
            return {
                ...item,
                unitCostPrice: unitCost,
                totalCostPrice: unitCost * item.quantity
            };
        });
        const totalCogs = items.reduce((sum, item) => sum + item.totalCostPrice, 0);
        return { items, totalCogs };
    }, [accounting, cogsOverrides]);

    const realtimeMetrics = useMemo(() => {
        if (!accounting) return null;
        const grossRevenue = accounting.convertedOrderTotal;
        const totalReturns = accounting.returns?.totalReturnedAmount || 0;
        const netRevenue = grossRevenue - totalReturns;

        const totalCogs = realtimeCogs.totalCogs;
        const returnedCogs = accounting.returns?.totalReturnedCogs || 0;
        const adjustedCogs = totalCogs - returnedCogs;

        const shipping = parseFloat(actualShippingCost) || 0;
        const pgFee = parseFloat(paymentGatewayFee) || 0;
        const miscTotal = miscExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalExpenses = shipping + pgFee + miscTotal;

        const tax = accounting.tax || 0;
        // Tax handling: If order is fully cancelled/refunded (netRevenue <= 0), tax is also refunded
        // Only deduct tax from profit calculation if there's remaining revenue
        const taxableNetRevenue = netRevenue <= 0 ? 0 : netRevenue - tax;
        const grossProfit = taxableNetRevenue - adjustedCogs;
        const netProfit = grossProfit - totalExpenses;
        const profitMargin = taxableNetRevenue > 0 ? (netProfit / taxableNetRevenue) * 100 : 0;

        return {
            grossRevenue,
            totalReturns,
            netRevenue,
            tax,
            taxableNetRevenue,
            totalCogs,
            adjustedCogs,
            grossProfit,
            totalExpenses,
            netProfit,
            profitMargin
        };
    }, [accounting, realtimeCogs.totalCogs, actualShippingCost, paymentGatewayFee, miscExpenses]);

    if (loading) {
        return (
            <Paper sx={{ p: 3, mt: 3 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    if (!accounting) {
        return (
            <Paper sx={{ p: 3, mt: 3 }}>
                <Alert severity="warning">Unable to load accounting data for this order.</Alert>
            </Paper>
        );
    }

    const profitColor = (realtimeMetrics?.netProfit ?? 0) >= 0 ? 'success.main' : 'error.main';

    return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                    Order Accounting
                </Typography>
                <Box display="flex" gap={1} alignItems="center">
                    <Tooltip title="Regenerate accounting data with correct currency calculations">
                        <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            startIcon={regenerating ? <CircularProgress size={16} /> : <RefreshIcon />}
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            sx={{
                                p: '0 10px',
                            }}
                        >
                            {regenerating ? 'Regenerating...' : 'Regenerate'}
                        </Button>
                    </Tooltip>
                    <Chip
                        label={accounting.isComplete ? 'Complete' : 'Pending'}
                        color={accounting.isComplete ? 'success' : 'warning'}
                        size="small"
                    />
                    {accounting.autoFetchedAt && (
                        <Chip
                            label={`Auto-fetched: ${new Date(accounting.autoFetchedAt).toLocaleDateString()}`}
                            variant="outlined"
                            size="small"
                        />
                    )}
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Cancelled/Refunded Order Alert */}
                {(order.status === 'cancelled' || order.status === 'refunded' || order.paymentStatus === 'refunded') && (
                    <Grid size={12}>
                        <Alert severity="error">
                            <Typography variant="subtitle2" fontWeight={600}>
                                {order.status === 'cancelled' ? 'Order Cancelled' : 'Order Refunded'}
                            </Typography>
                            <Typography variant="body2">
                                This entire order has been {order.status === 'cancelled' ? 'cancelled' : 'refunded'}.
                                All revenue has been returned to the customer. The profit shown below represents the net loss
                                (COGS + expenses that were not recovered).
                            </Typography>
                        </Alert>
                    </Grid>
                )}

                {/* Returns Alert */}
                {orderReturns && orderReturns.length > 0 && !(order.status === 'cancelled' || order.status === 'refunded' || order.paymentStatus === 'refunded') && (
                    <Grid size={12}>
                        <Alert severity="warning" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600}>Returns Detected</Typography>
                                <Typography variant="body2">{returnsImpact.description}</Typography>
                            </Box>
                            <Typography variant="h6" fontWeight={700} color="warning.main">
                                -{convertAndFormat(returnsImpact.totalReturns, orderCurrency)}
                            </Typography>
                        </Alert>
                    </Grid>
                )}

                {/* Revenue Section */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined" sx={{ height: 1 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Revenue
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                                {convertAndFormat(accounting.convertedOrderTotal)}
                            </Typography>
                            {accounting.orderCurrency !== accounting.baseCurrency && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Original: {convertAndFormat(accounting.orderTotal, accounting.orderCurrency, accounting.exchangeRateUsed)}
                                    <br />
                                    Rate: {accounting.exchangeRateUsed.toFixed(4)}
                                </Typography>
                            )}
                            {realtimeMetrics && realtimeMetrics.totalReturns > 0 && (
                                <Typography variant="caption" display="block" color="error.main" sx={{ mt: 1 }}>
                                    Returns: -{convertAndFormat(realtimeMetrics.totalReturns, orderCurrency)}
                                    <br />
                                    Net Revenue: {convertAndFormat(realtimeMetrics.netRevenue, orderCurrency)}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* COGS Section */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined" sx={{ height: 1 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Cost of Goods Sold
                            </Typography>
                            <Typography variant="h5" fontWeight="bold" color="warning.main">
                                {convertAndFormat(realtimeMetrics?.adjustedCogs ?? 0)}
                            </Typography>
                            {realtimeMetrics && realtimeMetrics.adjustedCogs !== realtimeMetrics.totalCogs && (
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                    Before Returns: {convertAndFormat(realtimeMetrics.totalCogs, orderCurrency)}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Net Profit Section */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined" sx={{ bgcolor: (realtimeMetrics?.netProfit ?? 0) >= 0 ? 'success.50' : 'error.50', height: 1 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Net Profit
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                {(realtimeMetrics?.netProfit ?? 0) >= 0 ? (
                                    <TrendingUpIcon sx={{ color: profitColor }} />
                                ) : (
                                    <TrendingDownIcon sx={{ color: profitColor }} />
                                )}
                                <Typography variant="h5" fontWeight="bold" sx={{ color: profitColor }}>
                                    {convertAndFormat(realtimeMetrics?.netProfit ?? 0)}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                Margin: {realtimeMetrics?.profitMargin.toFixed(2)}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* COGS Items Table */}
                <Grid size={12}>
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                        Cost of Goods (COGS)
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product</TableCell>
                                    <TableCell align="right">Qty</TableCell>
                                    <TableCell align="right">Unit Cost</TableCell>
                                    <TableCell align="right">Total Cost</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {accounting.cogs.items.map((item, index) => {
                                    const key = `${item.productId}-${item.variantId || ''}`;
                                    return (
                                        <TableRow key={index}>
                                            <TableCell>
                                                {item.name}
                                                {item.isOverridden && (
                                                    <Chip label="Override" size="small" sx={{ ml: 1 }} />
                                                )}
                                            </TableCell>
                                            <TableCell align="right">{item.quantity}</TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={cogsOverrides[key] ?? item.unitCostPrice}
                                                    onChange={(e) => updateCogsCostPrice(item.productId, item.variantId, e.target.value)}
                                                    sx={{ width: 100 }}
                                                    inputProps={{ min: 0, step: 0.01 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {convertAndFormat((cogsOverrides[key] ?? item.unitCostPrice) * item.quantity)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                <TableRow>
                                    <TableCell colSpan={3} align="right">
                                        <strong>Total COGS</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>{convertAndFormat(realtimeCogs.totalCogs)}</strong>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                {/* Expenses Section */}
                <Grid size={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1" fontWeight="600">
                            Expenses
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={fetchingGateway ? <CircularProgress size={16} /> : <SyncIcon />}
                            onClick={handleFetchGatewayData}
                            disabled={fetchingGateway}
                        >
                            Fetch from Gateway
                        </Button>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Actual Shipping Cost"
                                type="number"
                                fullWidth
                                value={actualShippingCost}
                                onChange={(e) => { setActualShippingCost(e.target.value); setHasChanges(true); }}
                                inputProps={{ min: 0, step: 0.01 }}
                                helperText={`In ${accounting.baseCurrency}`}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Payment Gateway Fee"
                                type="number"
                                fullWidth
                                value={paymentGatewayFee}
                                onChange={(e) => { setPaymentGatewayFee(e.target.value); setHasChanges(true); }}
                                inputProps={{ min: 0, step: 0.01 }}
                                helperText={`In ${accounting.baseCurrency}`}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Actual Deposited Amount"
                                type="number"
                                fullWidth
                                value={actualDepositedAmount}
                                onChange={(e) => { setActualDepositedAmount(e.target.value); setHasChanges(true); }}
                                inputProps={{ min: 0, step: 0.01 }}
                                helperText={`In ${accounting.baseCurrency}`}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Miscellaneous Expenses */}
                <Grid size={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle2" fontWeight="600">
                            Miscellaneous Expenses
                        </Typography>
                        <Button
                            variant="text"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={addMiscExpense}
                        >
                            Add Expense
                        </Button>
                    </Box>

                    {miscExpenses.length > 0 ? (
                        <Box display="flex" flexDirection="column" gap={1}>
                            {miscExpenses.map((expense, index) => (
                                <Box key={index} display="flex" gap={2} alignItems="center">
                                    <TextField
                                        label="Description"
                                        size="small"
                                        value={expense.description}
                                        onChange={(e) => updateMiscExpense(index, 'description', e.target.value)}
                                        sx={{ flex: 2 }}
                                    />
                                    <TextField
                                        label="Amount"
                                        type="number"
                                        size="small"
                                        value={expense.amount}
                                        onChange={(e) => updateMiscExpense(index, 'amount', parseFloat(e.target.value) || 0)}
                                        sx={{ flex: 1 }}
                                        inputProps={{ min: 0, step: 0.01 }}
                                    />
                                    <IconButton color="error" onClick={() => removeMiscExpense(index)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No miscellaneous expenses added.
                        </Typography>
                    )}
                </Grid>

                {/* Notes */}
                <Grid size={12}>
                    <TextField
                        label="Notes"
                        multiline
                        rows={2}
                        fullWidth
                        value={notes}
                        onChange={(e) => { setNotes(e.target.value); setHasChanges(true); }}
                        placeholder="Add any notes about this order's accounting..."
                    />
                </Grid>

                {/* Profit Summary */}
                <Grid size={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                        Profit Summary
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6, sm: 2 }}>
                            <Typography variant="caption" color="text.secondary">Gross Revenue</Typography>
                            <Typography variant="body1" fontWeight="500">
                                {convertAndFormat(realtimeMetrics?.grossRevenue ?? 0)}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                            <Typography variant="caption" color="text.secondary">Tax</Typography>
                            <Typography variant="body1" fontWeight="500" color="error.light">
                                -{convertAndFormat(realtimeMetrics?.tax ?? 0)}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                            <Typography variant="caption" color="text.secondary">Net Revenue</Typography>
                            <Typography variant="body1" fontWeight="500">
                                {convertAndFormat(realtimeMetrics?.netRevenue ?? 0)}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                            <Typography variant="caption" color="text.secondary">Total COGS</Typography>
                            <Typography variant="body1" fontWeight="500" color="warning.main">
                                -{convertAndFormat(realtimeMetrics?.totalCogs ?? 0)}
                            </Typography>
                            {realtimeMetrics && realtimeMetrics.adjustedCogs !== realtimeMetrics.totalCogs && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                    Adjusted: -{convertAndFormat(realtimeMetrics.adjustedCogs)}
                                </Typography>
                            )}
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                            <Typography variant="caption" color="text.secondary">Gross Profit</Typography>
                            <Typography variant="body1" fontWeight="500">
                                {convertAndFormat(realtimeMetrics?.grossProfit ?? 0)}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                            <Typography variant="caption" color="text.secondary">Total Expenses</Typography>
                            <Typography variant="body1" fontWeight="500" color="error.main">
                                -{convertAndFormat(realtimeMetrics?.totalExpenses ?? 0)}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                            <Typography variant="caption" color="text.secondary">Net Profit</Typography>
                            <Typography variant="body1" fontWeight="bold" sx={{ color: profitColor }}>
                                {convertAndFormat(realtimeMetrics?.netProfit ?? 0)}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                            <Typography variant="caption" color="text.secondary">Profit Margin</Typography>
                            <Typography variant="body1" fontWeight="bold" sx={{ color: profitColor }}>
                                {realtimeMetrics?.profitMargin.toFixed(2)}%
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Save Button */}
                <Grid size={12}>
                    <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                        <Button
                            variant="contained"
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
}
