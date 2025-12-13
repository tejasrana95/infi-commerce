'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Typography, IconButton, Button, Stepper, Step, StepLabel, Paper, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { OrderFormProvider, useOrderForm, OrderItem } from '@/components/organisms/OrderForm/OrderFormContext';
import StoreCustomerSection from '@/components/organisms/OrderForm/StoreCustomerSection';
import OrderItemsSection from '@/components/organisms/OrderForm/OrderItemsSection';
import AddressSection from '@/components/organisms/OrderForm/AddressSection';
import PaymentSection from '@/components/organisms/OrderForm/PaymentSection';
import { LoadingSpinner } from '@/components/atoms';

const steps = ['Store & Customer', 'Order Items', 'Address', 'Payment & Notes'];

// Helper to check if a key looks like MongoDB ObjectId
const isObjectId = (key: string) => /^[a-f0-9]{24}$/i.test(key);

// Build variant label from attributes, filtering ObjectIds
const buildVariantLabel = (name: string, attributes?: Record<string, string>) => {
    if (!attributes) return name;
    const readableAttrs = Object.entries(attributes)
        .filter(([key]) => !isObjectId(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    return readableAttrs ? `${name} (${readableAttrs})` : name;
};

function OrderEditContent() {
    const router = useRouter();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const orderForm = useOrderForm();

    useEffect(() => {
        if (id) {
            fetchOrder();
        }
    }, [id]);

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/orders/${id}`);
            const order = response.data.data || response.data.order;

            if (!order) {
                setError('Order not found');
                return;
            }

            // Populate form with existing order data
            if (order.storeId) {
                orderForm.setStoreId(order.storeId._id || order.storeId);
            }

            // Set items directly with proper formatting
            if (order.items && Array.isArray(order.items)) {
                const formattedItems: OrderItem[] = order.items.map((item: any) => ({
                    productId: item.productId._id || item.productId,
                    variantId: item.variantId,
                    name: buildVariantLabel(
                        item.productId?.name || item.name,
                        item.attributes
                    ),
                    sku: item.sku,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image || item.productId?.images?.[0],
                }));
                orderForm.setItems(formattedItems);
            }

            // Set addresses
            if (order.shippingAddress) {
                orderForm.setShippingAddress(order.shippingAddress);
            }
            if (order.billingAddress) {
                orderForm.setBillingAddress(order.billingAddress);
            }

            // Set payment and status
            orderForm.setPaymentMethod(order.paymentMethod || 'cod');
            orderForm.setPaymentStatus(order.paymentStatus || 'pending');
            orderForm.setStatus(order.status || 'pending');

            // Set totals
            orderForm.setShippingCost(order.shippingCost || 0);
            orderForm.setTax(order.tax || 0);
            orderForm.setDiscount(order.discount || 0);
            orderForm.setCurrency(order.currency || 'USD');

            // Set notes
            orderForm.setCustomerNote(order.customerNote || '');
            orderForm.setAdminNote(order.adminNote || '');

            // Guest email
            if (order.guestEmail) {
                orderForm.setGuestEmail(order.guestEmail);
            }
            if (order.customerId) {
                orderForm.setCustomer(order.customerId);
            }
        } catch (err: any) {
            console.error('Failed to fetch order:', err);
            setError(err.response?.data?.message || 'Failed to load order');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const handleBack = () => {
        setActiveStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const orderData = orderForm.getOrderData();
            await api.put(`/orders/admin/${id}`, orderData);
            showNotification('Order updated successfully', 'success');
            router.push(`/orders/${id}`);
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update order', 'error');
        } finally {
            setSaving(false);
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return <StoreCustomerSection />;
            case 1:
                return <OrderItemsSection />;
            case 2:
                return <AddressSection />;
            case 3:
                return <PaymentSection />;
            default:
                return null;
        }
    };

    if (loading) return <LoadingSpinner message="Loading order..." />;

    if (error) {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={() => router.push('/orders')}>
                    Back to Orders
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">Edit Order</Typography>
            </Box>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Paper sx={{ p: 3, mb: 3 }}>
                {renderStepContent()}
            </Paper>

            <Box display="flex" justifyContent="space-between">
                <Button disabled={activeStep === 0} onClick={handleBack}>
                    Back
                </Button>
                <Box display="flex" gap={2}>
                    <Button variant="outlined" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={saving || orderForm.items.length === 0}
                        >
                            {saving ? <CircularProgress size={24} /> : 'Update Order'}
                        </Button>
                    ) : (
                        <Button variant="contained" onClick={handleNext}>
                            Next
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

export default function EditOrderPage() {
    const { id } = useParams();

    return (
        <OrderFormProvider isEditing orderId={id as string}>
            <OrderEditContent />
        </OrderFormProvider>
    );
}
