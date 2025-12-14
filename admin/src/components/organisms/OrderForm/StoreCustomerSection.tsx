'use client';

import { useEffect } from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, Box, Typography, Alert, TextField } from '@mui/material';
import { useOrderForm } from './OrderFormContext';
import { CustomerAutoComplete } from '@/components/molecules';
import { CustomerOption } from '@/components/molecules/CustomerAutoComplete';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import CurrencyAutocomplete from '@/components/molecules/CurrencyAutocomplete';

export default function StoreCustomerSection() {
    const {
        storeId, setStoreId,
        stores, setStores,
        customer, setCustomer,
        guestEmail, setGuestEmail,
        currency, setCurrency,
        setShippingAddress,
        setBillingAddress,
        isEditing,
    } = useOrderForm();

    const { baseCurrency } = useCurrency();

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await api.get('/stores');
                setStores(response.data.stores || response.data.data || []);
            } catch (err) {
                console.error('Failed to fetch stores:', err);
            }
        };
        fetchStores();
    }, [setStores]);

    // Set default currency to base currency when loaded
    useEffect(() => {
        if (baseCurrency && !currency) {
            setCurrency(baseCurrency.code);
        }
    }, [baseCurrency, currency, setCurrency]);

    const handleCustomerChange = (newCustomer: CustomerOption | null) => {
        setCustomer(newCustomer);
        // Clear guest email if customer is selected
        if (newCustomer) {
            setGuestEmail('');
        }

        // Auto-populate addresses from customer data
        if (newCustomer?.addresses && newCustomer.addresses.length > 0) {
            const defaultShipping = newCustomer.addresses.find(a => a.type === 'shipping' && a.isDefault)
                || newCustomer.addresses.find(a => a.type === 'shipping')
                || newCustomer.addresses[0];

            const defaultBilling = newCustomer.addresses.find(a => a.type === 'billing' && a.isDefault)
                || newCustomer.addresses.find(a => a.type === 'billing')
                || defaultShipping;

            if (defaultShipping) {
                setShippingAddress({
                    firstName: defaultShipping.firstName,
                    lastName: defaultShipping.lastName,
                    address1: defaultShipping.address1,
                    address2: defaultShipping.address2 || '',
                    city: defaultShipping.city,
                    state: defaultShipping.state,
                    country: defaultShipping.country,
                    postalCode: defaultShipping.postalCode,
                    phone: defaultShipping.phone,
                });
            }

            if (defaultBilling && defaultBilling !== defaultShipping) {
                setBillingAddress({
                    firstName: defaultBilling.firstName,
                    lastName: defaultBilling.lastName,
                    address1: defaultBilling.address1,
                    address2: defaultBilling.address2 || '',
                    city: defaultBilling.city,
                    state: defaultBilling.state,
                    country: defaultBilling.country,
                    postalCode: defaultBilling.postalCode,
                    phone: defaultBilling.phone,
                });
            }
        }
    };

    const handleCurrencyChange = (value: string | string[] | null) => {
        setCurrency((value as string) || '');
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Store & Customer</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth required disabled={isEditing}>
                        <InputLabel>Store</InputLabel>
                        <Select
                            value={storeId}
                            label="Store"
                            onChange={(e) => setStoreId(e.target.value)}
                        >
                            {stores.map(store => (
                                <MenuItem key={store._id} value={store._id}>{store.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <CurrencyAutocomplete
                        value={currency}
                        onChange={handleCurrencyChange}
                        label="Currency"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <CustomerAutoComplete
                        value={customer}
                        onChange={handleCustomerChange}
                        label="Customer (optional)"
                        placeholder="Search by name, email or phone..."
                        disabled={!!guestEmail && !customer}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Guest Email"
                        type="email"
                        value={guestEmail}
                        onChange={(e) => {
                            setGuestEmail(e.target.value);
                            if (e.target.value) {
                                setCustomer(null);
                            }
                        }}
                        disabled={!!customer}
                        placeholder="For guest checkout"
                        helperText={customer ? "Clear customer to enter guest email" : "Leave empty if customer selected"}
                    />
                </Grid>
                {customer && (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="info" icon={false}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                        {customer.firstName} {customer.lastName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {customer.email} {customer.phone && `| ${customer.phone}`}
                                    </Typography>
                                </Box>
                                {customer.addresses && customer.addresses.length > 0 && (
                                    <Typography variant="caption" sx={{ ml: 'auto' }}>
                                        ✓ {customer.addresses.length} address(es) loaded
                                    </Typography>
                                )}
                            </Box>
                        </Alert>
                    </Grid>
                )}
                {guestEmail && !customer && (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="warning" icon={false}>
                            <Typography variant="body2">
                                Guest Order: <strong>{guestEmail}</strong>
                            </Typography>
                        </Alert>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}

