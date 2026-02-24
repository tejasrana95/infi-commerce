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
    channels: z.array(z.string()).optional(),
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

export default function PaymentGatewayForm({ initialData, onSubmit, isSubmitting = false }: PaymentGatewayFormProps) {
    const [currencyInput, setCurrencyInput] = useState('');
    const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, dirtyFields },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            storeId: '',
            gatewayType: 'stripe',
            gatewayName: '',
            geoGroupId: '',
            description: '',
            channels: [],
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
                supportedCurrencies: [],
            },
        },
    });

    const watchGatewayType = watch('gatewayType');
    const watchStoreId = watch('storeId');
    const watchCurrencies = watch('features.supportedCurrencies') || [];

    // Fetch available currencies and base currency from API
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const currenciesRes = await api.get('/currencies?isActive=true');
                if (currenciesRes.data?.currencies) {
                    const codes = currenciesRes.data.currencies.map((c: any) => c.code);
                    setAvailableCurrencies(codes);

                    // Set base currency default only on CREATE page.
                    // Edit page initially passes null while loading, so avoid setting a wrong default there.
                    if (initialData === undefined) {
                        try {
                            const baseRes = await api.get('/currencies/base');
                            if (baseRes.data?.currency?.code && codes.includes(baseRes.data.currency.code)) {
                                setValue('features.supportedCurrencies', [baseRes.data.currency.code]);
                            }
                        } catch (error) {
                            console.error('Failed to fetch base currency:', error);
                            if (codes.length > 0) {
                                setValue('features.supportedCurrencies', [codes[0]]);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch currencies:', error);
            }
        };
        fetchCurrencies();
    }, [initialData, setValue]);

    // Initialize form with existing data
    useEffect(() => {
        if (initialData) {
            const getEntityId = (value: any): string => {
                if (!value) return '';
                if (typeof value === 'object') return value?._id || '';
                return value;
            };
            const loadedCurrencies = Array.isArray(initialData?.features?.supportedCurrencies)
                ? initialData.features.supportedCurrencies
                : (Array.isArray(initialData?.supportedCurrencies) ? initialData.supportedCurrencies : []);

            setValue('storeId', getEntityId(initialData.storeId));
            setValue('gatewayType', initialData.gatewayType || 'stripe');
            setValue('gatewayName', initialData.gatewayName || '');
            setValue('geoGroupId', getEntityId(initialData.geoGroupId));
            setValue('description', initialData.description || '');
            setValue('channels', initialData.channels || []);
            setValue('isActive', initialData.isActive !== undefined ? initialData.isActive : true);
            setValue('isTestMode', initialData.isTestMode !== undefined ? initialData.isTestMode : true);
            setValue('priority', initialData.priority || 0);
            // Note: credentials are not returned from API for security
            if (initialData.features) {
                setValue('features', {
                    supportsRefund: initialData.features.supportsRefund ?? true,
                    supportsPartialRefund: initialData.features.supportsPartialRefund ?? true,
                    supportsRecurring: initialData.features.supportsRecurring ?? false,
                    supportedCurrencies: loadedCurrencies,
                });
            } else {
                setValue('features.supportedCurrencies', loadedCurrencies);
            }
        }
    }, [initialData, setValue]);

    const handleFormSubmit = (data: FormData) => {
        // Clean up credentials based on gateway type
        const cleanedCredentials: any = {};
        const isEditMode = Boolean(initialData);
        const dirtyCredentialFields: Record<string, boolean> = (dirtyFields as any)?.credentials || {};
        const shouldIncludeCredential = (fieldName: string): boolean => {
            if (!isEditMode) return true;
            return Boolean(dirtyCredentialFields?.[fieldName]);
        };

        if (data.gatewayType === 'razorpay') {
            if (data.credentials.keyId && shouldIncludeCredential('keyId')) cleanedCredentials.keyId = data.credentials.keyId;
            if (data.credentials.keySecret && shouldIncludeCredential('keySecret')) cleanedCredentials.keySecret = data.credentials.keySecret;
        } else if (data.gatewayType === 'stripe') {
            if (data.credentials.secretKey && shouldIncludeCredential('secretKey')) cleanedCredentials.secretKey = data.credentials.secretKey;
            if (data.credentials.publishableKey && shouldIncludeCredential('publishableKey')) cleanedCredentials.publishableKey = data.credentials.publishableKey;
        } else if (data.gatewayType === 'paypal') {
            if (data.credentials.clientId && shouldIncludeCredential('clientId')) cleanedCredentials.clientId = data.credentials.clientId;
            if (data.credentials.clientSecret && shouldIncludeCredential('clientSecret')) cleanedCredentials.clientSecret = data.credentials.clientSecret;
            if (shouldIncludeCredential('mode')) cleanedCredentials.mode = data.credentials.mode || 'sandbox';
        }

        if (data.credentials.webhookSecret && shouldIncludeCredential('webhookSecret')) {
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
        <Box component="form" id="payment-gateway-form" autoComplete="off" onSubmit={handleSubmit(handleFormSubmit)}>
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

                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="channels"
                            control={control}
                            render={({ field }) => {
                                const availableChannels = (process.env.NEXT_PUBLIC_AVAILABLE_CHANNELS || 'WEB,POS,MOB').split(',').map(c => c.trim());
                                return (
                                    <FormControl fullWidth>
                                        <InputLabel>Channels</InputLabel>
                                        <Select
                                            {...field}
                                            multiple
                                            label="Channels"
                                            value={field.value || []}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {(selected as string[]).map((value) => (
                                                        <Chip key={value} label={value} size="small" />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {availableChannels.map((channel) => (
                                                <MenuItem key={channel} value={channel}>
                                                    {channel}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                );
                            }}
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
                                            autoComplete="new-password"
                                            inputProps={{ autoComplete: 'new-password' }}
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
                                            autoComplete="new-password"
                                            inputProps={{ autoComplete: 'new-password' }}
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
                                            autoComplete="new-password"
                                            inputProps={{ autoComplete: 'new-password' }}
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
                                            autoComplete="new-password"
                                            inputProps={{ autoComplete: 'new-password' }}
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
                                            autoComplete="new-password"
                                            inputProps={{ autoComplete: 'new-password' }}
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
                                            autoComplete="new-password"
                                            inputProps={{ autoComplete: 'new-password' }}
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
                                    autoComplete="new-password"
                                    inputProps={{ autoComplete: 'new-password' }}
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
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Supported Currencies (Active in Store)</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {availableCurrencies.map(currency => (
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
                        {availableCurrencies.length === 0 && (
                            <Typography variant="body2" color="text.secondary">No active currencies found in store settings.</Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {watchCurrencies.filter(c => !availableCurrencies.includes(c)).map(currency => (
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
