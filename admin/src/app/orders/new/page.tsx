'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Stepper, Step, StepLabel, Button, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
    OrderFormProvider,
    useOrderForm,
    StoreCustomerSection,
    OrderItemsSection,
    AddressSection,
    PaymentSection,
} from '@/components/organisms/OrderForm';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

const steps = ['Store & Customer', 'Products', 'Addresses', 'Payment & Review'];

function OrderFormContent() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [activeStep, setActiveStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const { getOrderData, storeId, customer, items, shippingAddress } = useOrderForm();

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 0:
                return !!storeId && !!customer;
            case 1:
                return items.length > 0;
            case 2:
                return !!(shippingAddress.firstName && shippingAddress.address1 && shippingAddress.city);
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (!validateStep(activeStep)) {
            showNotification('Please complete all required fields', 'error');
            return;
        }
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        if (!validateStep(2)) {
            showNotification('Please complete the shipping address', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const orderData = getOrderData();
            await api.post('/orders/admin/create', orderData);
            showNotification('Order created successfully!', 'success');
            router.push('/orders');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to create order', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStepContent = (step: number) => {
        switch (step) {
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

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">Create Order</Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {renderStepContent(activeStep)}

                <Box display="flex" justifyContent="space-between" mt={4} pt={3} borderTop={1} borderColor="divider">
                    <Button disabled={activeStep === 0} onClick={handleBack}>
                        Back
                    </Button>
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? 'Creating...' : 'Create Order'}
                        </Button>
                    ) : (
                        <Button variant="contained" onClick={handleNext}>
                            Next
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

export default function NewOrderPage() {
    return (
        <OrderFormProvider>
            <OrderFormContent />
        </OrderFormProvider>
    );
}
