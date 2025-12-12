'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    MenuItem,
    Grid,
    Typography,
    Card,
    CardContent,
    Alert,
} from '@mui/material';
import { Currency } from '@/types';

// Validation Schema
const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(3, 'Code must be 3 characters').max(3, 'Code must be 3 characters').toUpperCase(),
    symbol: z.string().min(1, 'Symbol is required'),
    exchangeRate: z.number().min(0, 'Exchange rate must be positive'),
    decimalPlaces: z.number().min(0).max(4).int(),
    symbolPosition: z.enum(['before', 'after']),
    thousandsSeparator: z.string(),
    decimalSeparator: z.string(),
    isBaseCurrency: z.boolean(),
    isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface CurrencyFormProps {
    initialData?: Partial<Currency>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
}

const defaultValues: FormData = {
    name: '',
    code: '',
    symbol: '',
    exchangeRate: 1,
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isBaseCurrency: false,
    isActive: true,
};

export default function CurrencyForm({ initialData, onSubmit, isSubmitting }: CurrencyFormProps) {
    const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    // Watch fields for preview
    const watchedValues = watch();

    useEffect(() => {
        if (initialData) {
            reset({ ...defaultValues, ...initialData });
        } else {
            reset(defaultValues);
        }
    }, [initialData, reset]);

    const formatPreview = (amount: number) => {
        try {
            const {
                symbol = '',
                symbolPosition = 'before',
                decimalPlaces = 2,
                thousandsSeparator = ',',
                decimalSeparator = '.',
            } = watchedValues;

            let formatted = amount.toFixed(decimalPlaces);
            const parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
            formatted = parts.join(decimalSeparator);

            return symbolPosition === 'before' ? `${symbol}${formatted}` : `${formatted}${symbol}`;
        } catch (e) {
            return 'Preview Error';
        }
    };

    return (
        <Box component="form" id="currency-form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Preview Card */}
                <Grid size={{ xs: 12 }}>
                    <Card variant="outlined" sx={{ bgcolor: 'action.hover', borderStyle: 'dashed' }}>
                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                                FORMAT PREVIEW
                            </Typography>
                            <Box display="flex" gap={4} alignItems="center" flexWrap="wrap">
                                <Box>
                                    <Typography variant="body2" color="text.secondary">1,234.56</Typography>
                                    <Typography variant="h6" fontWeight={600} color="primary.main">
                                        {formatPreview(1234.56)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">10,000</Typography>
                                    <Typography variant="h6" fontWeight={600} color="primary.main">
                                        {formatPreview(10000)}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Basic Info */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" fontWeight={600} mb={2}>
                        Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Name"
                                        fullWidth
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
                                        placeholder="US Dollar"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="code"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Code (ISO)"
                                        fullWidth
                                        error={!!errors.code}
                                        helperText={errors.code?.message}
                                        placeholder="USD"
                                        slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="symbol"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Symbol"
                                        fullWidth
                                        error={!!errors.symbol}
                                        helperText={errors.symbol?.message}
                                        placeholder="$"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="exchangeRate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Exchange Rate"
                                        type="number"
                                        fullWidth
                                        error={!!errors.exchangeRate}
                                        helperText={errors.exchangeRate?.message || "Rate relative to base currency"}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Formatting */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" fontWeight={600} mb={2}>
                        Formatting
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="symbolPosition"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Symbol Position"
                                        fullWidth
                                    >
                                        <MenuItem value="before">Before Amount ($10)</MenuItem>
                                        <MenuItem value="after">After Amount (10$)</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="decimalPlaces"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Decimal Places"
                                        type="number"
                                        fullWidth
                                        error={!!errors.decimalPlaces}
                                        helperText={errors.decimalPlaces?.message}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="thousandsSeparator"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Thousands Separator"
                                        fullWidth
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="decimalSeparator"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Decimal Separator"
                                        fullWidth
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Status */}
                <Grid size={{ xs: 12 }}>
                    <Box display="flex" gap={3}>
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Active"
                                />
                            )}
                        />
                        <Controller
                            name="isBaseCurrency"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Base Currency"
                                />
                            )}
                        />
                    </Box>
                    {watchedValues.isBaseCurrency && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                            Setting this as Base Currency will unset the previous base currency. Exchange rate will be forced to 1.
                        </Alert>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
