'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Checkbox,
    FormControlLabel,
    Typography,
    Paper,
    Grid,
    Chip,
    Divider,
    Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import StoreAutocomplete from '../molecules/StoreAutocomplete';
import GeoGroupAutocomplete from '../molecules/GeoGroupAutocomplete';
import api from '@/lib/api';

// Validation schema
const schema = z.object({
    storeId: z.string().min(1, 'Store is required'),
    gatewayType: z.string().min(1, 'Gateway type is required'),
    gatewayName: z.string().min(1, 'Gateway name is required'),
    geoGroupId: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean(),
    isTestMode: z.boolean(),
    priority: z.number().min(0),
    // Credentials
    credentials: z.object({
        // Razorpay
        keyId: z.string().optional(),
        keySecret: z.string().optional(),
        // Stripe
        secretKey: z.string().optional(),
        publishableKey: z.string().optional(),
        // PayPal
        clientId: z.string().optional(),
        clientSecret: z.string().optional(),
        mode: z.enum(['sandbox', 'live']).optional(),
        // Webhook
        webhookSecret: z.string().optional(),
    }),
    // Features
    features: z.object({
        supportsRefund: z.boolean(),
        supportsPartialRefund: z.boolean(),
        supportsRecurring: z.boolean(),
        supportedCurrencies: z.array(z.string()),
    }),
});

type FormData = z.infer<typeof schema>;

interface PaymentGatewayFormProps {
    initialData?: any;
    onSubmit: (data: FormData) => void;
    isSubmitting?: boolean;
}

const GATEWAY_TYPES = [
    { value: 'stripe', label: 'Stripe' },
    { value: 'razorpay', label: 'Razorpay' },
    { value: 'paypal', label: 'PayPal' },
];

const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'SGD', 'AED'];

export default function PaymentGatewayForm({ initialData, onSubmit, isSubmitting = false }: PaymentGatewayFormProps) {
    const [currencyInput, setCurrencyInput] = useState('');

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            storeId: '',
            gatewayType: 'stripe',
            gatewayName: '',
            geoGroupId: '',
            description: '',
            isActive: true,
            isTestMode: true,
            priority: 0,
            credentials: {
                keyId: '',
                keySecret: '',
                secretKey: '',
                publishableKey: '',
                clientId: '',
                clientSecret: '',
                mode: 'sandbox',
                webhookSecret: '',
            },
            features: {
                supportsRefund: true,
                supportsPartialRefund: true,
                supportsRecurring: false,
                supportedCurrencies: ['USD'],
            },
        },
    });

    const watchGatewayType = watch('gatewayType');
    const watchStoreId = watch('storeId');
    const watchCurrencies = watch('features.supportedCurrencies') || [];

    // Initialize form with existing data
    useEffect(() => {
        if (initialData) {
            setValue('storeId', typeof initialData.storeId === 'object' ? initialData.storeId._id : initialData.storeId || '');
            setValue('gatewayType', initialData.gatewayType || 'stripe');
            setValue('gatewayName', initialData.gatewayName || '');
            setValue('geoGroupId', typeof initialData.geoGroupId === 'object' ? initialData.geoGroupId._id : initialData.geoGroupId || '');
            setValue('description', initialData.description || '');
            setValue('isActive', initialData.isActive !== undefined ? initialData.isActive : true);
            setValue('isTestMode', initialData.isTestMode !== undefined ? initialData.isTestMode : true);
            setValue('priority', initialData.priority || 0);
            // Note: credentials are not returned from API for security
            if (initialData.features) {
                setValue('features', {
                    supportsRefund: initialData.features.supportsRefund ?? true,
                    supportsPartialRefund: initialData.features.supportsPartialRefund ?? true,
                    supportsRecurring: initialData.features.supportsRecurring ?? false,
                    supportedCurrencies: initialData.features.supportedCurrencies || ['USD'],
                });
            }
        }
    }, [initialData, setValue]);

    const handleFormSubmit = (data: FormData) => {
        // Clean up credentials based on gateway type
        const cleanedCredentials: any = {};

        if (data.gatewayType === 'razorpay') {
            if (data.credentials.keyId) cleanedCredentials.keyId = data.credentials.keyId;
            if (data.credentials.keySecret) cleanedCredentials.keySecret = data.credentials.keySecret;
        } else if (data.gatewayType === 'stripe') {
            if (data.credentials.secretKey) cleanedCredentials.secretKey = data.credentials.secretKey;
            if (data.credentials.publishableKey) cleanedCredentials.publishableKey = data.credentials.publishableKey;
        } else if (data.gatewayType === 'paypal') {
            if (data.credentials.clientId) cleanedCredentials.clientId = data.credentials.clientId;
            if (data.credentials.clientSecret) cleanedCredentials.clientSecret = data.credentials.clientSecret;
            cleanedCredentials.mode = data.credentials.mode || 'sandbox';
        }

        if (data.credentials.webhookSecret) {
            cleanedCredentials.webhookSecret = data.credentials.webhookSecret;
        }

        onSubmit({
            ...data,
            geoGroupId: data.geoGroupId || undefined,
            credentials: cleanedCredentials,
        });
    };

    const handleAddCurrency = (currency: string) => {
        const upper = currency.toUpperCase().trim();
        if (upper && !watchCurrencies.includes(upper)) {
            setValue('features.supportedCurrencies', [...watchCurrencies, upper]);
        }
        setCurrencyInput('');
    };

    const handleRemoveCurrency = (currency: string) => {
        setValue('features.supportedCurrencies', watchCurrencies.filter(c => c !== currency));
    };

    return (
        <Box component="form" id="payment-gateway-form" onSubmit={handleSubmit(handleFormSubmit)}>
            {/* Basic Info */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="gatewayName"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Gateway Name"
                                    fullWidth
                                    required
                                    error={!!errors.gatewayName}
                                    helperText={errors.gatewayName?.message || 'Display name for this configuration'}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="gatewayType"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth required error={!!errors.gatewayType}>
                                    <InputLabel>Gateway Type</InputLabel>
                                    <Select {...field} label="Gateway Type">
                                        {GATEWAY_TYPES.map(type => (
                                            <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="storeId"
                            control={control}
                            render={({ field }) => (
                                <StoreAutocomplete
                                    value={field.value}
                                    onChange={field.onChange}
                                    label="Store"
                                    required
                                    error={!!errors.storeId}
                                    helperText={errors.storeId?.message}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="geoGroupId"
                            control={control}
                            render={({ field }) => (
                                <GeoGroupAutocomplete
                                    value={field.value || null}
                                    onChange={(value) => field.onChange(value || '')}
                                    storeId={watchStoreId}
                                    label="Geo Group (Country Restriction)"
                                    helperText="Leave empty to make available for all countries"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    helperText="Optional description for this gateway configuration"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="priority"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Priority"
                                    type="number"
                                    fullWidth
                                    helperText="Higher priority gateways are selected first"
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="isTestMode"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Test Mode (Sandbox)"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Active"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Credentials */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>API Credentials</Typography>
                {initialData && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        For security, existing credentials are not displayed. Leave fields empty to keep current values.
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Stripe Credentials */}
                    {watchGatewayType === 'stripe' && (
                        <>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="credentials.publishableKey"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Publishable Key"
                                            fullWidth
                                            placeholder="pk_test_..."
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="credentials.secretKey"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Secret Key"
                                            fullWidth
                                            type="password"
                                            placeholder="sk_test_..."
                                        />
                                    )}
                                />
                            </Grid>
                        </>
                    )}

                    {/* Razorpay Credentials */}
                    {watchGatewayType === 'razorpay' && (
                        <>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="credentials.keyId"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Key ID"
                                            fullWidth
                                            placeholder="rzp_test_..."
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="credentials.keySecret"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Key Secret"
                                            fullWidth
                                            type="password"
                                        />
                                    )}
                                />
                            </Grid>
                        </>
                    )}

                    {/* PayPal Credentials */}
                    {watchGatewayType === 'paypal' && (
                        <>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="credentials.clientId"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Client ID"
                                            fullWidth
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="credentials.clientSecret"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Client Secret"
                                            fullWidth
                                            type="password"
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="credentials.mode"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel>PayPal Mode</InputLabel>
                                            <Select {...field} label="PayPal Mode">
                                                <MenuItem value="sandbox">Sandbox (Testing)</MenuItem>
                                                <MenuItem value="live">Live (Production)</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Grid>
                        </>
                    )}

                    {/* Webhook Secret (common) */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="credentials.webhookSecret"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Webhook Secret (Optional)"
                                    fullWidth
                                    type="password"
                                    helperText="For verifying webhook signatures"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Features */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Features & Currencies</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="features.supportsRefund"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Supports Refund"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="features.supportsPartialRefund"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Supports Partial Refund"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="features.supportsRecurring"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Supports Recurring Payments"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Supported Currencies</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {COMMON_CURRENCIES.map(currency => (
                                <Chip
                                    key={currency}
                                    label={currency}
                                    size="small"
                                    variant={watchCurrencies.includes(currency) ? 'filled' : 'outlined'}
                                    color={watchCurrencies.includes(currency) ? 'primary' : 'default'}
                                    onClick={() => {
                                        if (watchCurrencies.includes(currency)) {
                                            handleRemoveCurrency(currency);
                                        } else {
                                            handleAddCurrency(currency);
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {watchCurrencies.filter(c => !COMMON_CURRENCIES.includes(c)).map(currency => (
                                <Chip
                                    key={currency}
                                    label={currency}
                                    size="small"
                                    color="secondary"
                                    onDelete={() => handleRemoveCurrency(currency)}
                                />
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
