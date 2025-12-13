'use client';

import { Box, Typography, Grid, TextField, FormControlLabel, Switch, Paper, Chip } from '@mui/material';
import { useOrderForm } from './OrderFormContext';
import CountryAutocomplete from '@/components/molecules/CountryAutocomplete';
import { Address } from '@/types/order';

export default function AddressSection() {
    const {
        customer,
        shippingAddress, setShippingAddress,
        billingAddress, setBillingAddress,
        sameAsShipping, setSameAsShipping,
    } = useOrderForm();

    const handleShippingChange = (field: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setShippingAddress({ ...shippingAddress, [field]: e.target.value });
    };

    const handleBillingChange = (field: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setBillingAddress({ ...billingAddress, [field]: e.target.value });
    };

    const handleShippingCountryChange = (value: string | string[] | null) => {
        // Value is country code or name, we use the name for address
        setShippingAddress({ ...shippingAddress, country: value as string || '' });
    };

    const handleBillingCountryChange = (value: string | string[] | null) => {
        setBillingAddress({ ...billingAddress, country: value as string || '' });
    };

    const useCustomerAddress = (type: 'shipping' | 'billing') => {
        if (!customer?.addresses) return;
        const address = customer.addresses.find(a => a.type === type && a.isDefault)
            || customer.addresses.find(a => a.type === type)
            || customer.addresses[0];

        if (address) {
            const setter = type === 'shipping' ? setShippingAddress : setBillingAddress;
            setter({
                firstName: address.firstName,
                lastName: address.lastName,
                address1: address.address1,
                address2: address.address2 || '',
                city: address.city,
                state: address.state,
                country: address.country,
                postalCode: address.postalCode,
                phone: address.phone,
            });
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Addresses</Typography>

            {/* Shipping Address */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>Shipping Address</Typography>
                    {customer?.addresses && customer.addresses.length > 0 && (
                        <Chip
                            label="Use Customer Address"
                            size="small"
                            onClick={() => useCustomerAddress('shipping')}
                            clickable
                            color="primary"
                            variant="outlined"
                        />
                    )}
                </Box>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth required size="small"
                            label="First Name"
                            value={shippingAddress.firstName}
                            onChange={handleShippingChange('firstName')}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth required size="small"
                            label="Last Name"
                            value={shippingAddress.lastName}
                            onChange={handleShippingChange('lastName')}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth required size="small"
                            label="Address Line 1"
                            value={shippingAddress.address1}
                            onChange={handleShippingChange('address1')}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth size="small"
                            label="Address Line 2"
                            value={shippingAddress.address2}
                            onChange={handleShippingChange('address2')}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth required size="small"
                            label="City"
                            value={shippingAddress.city}
                            onChange={handleShippingChange('city')}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth required size="small"
                            label="State/Province"
                            value={shippingAddress.state}
                            onChange={handleShippingChange('state')}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth required size="small"
                            label="Postal Code"
                            value={shippingAddress.postalCode}
                            onChange={handleShippingChange('postalCode')}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <CountryAutocomplete
                            value={shippingAddress.country || null}
                            onChange={handleShippingCountryChange}
                            label="Country"
                            required
                            minimal
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth required size="small"
                            label="Phone"
                            value={shippingAddress.phone}
                            onChange={handleShippingChange('phone')}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Billing Address */}
            <Paper variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>Billing Address</Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={sameAsShipping}
                                onChange={(e) => setSameAsShipping(e.target.checked)}
                            />
                        }
                        label="Same as shipping"
                    />
                </Box>

                {!sameAsShipping && (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth required size="small"
                                label="First Name"
                                value={billingAddress.firstName}
                                onChange={handleBillingChange('firstName')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth required size="small"
                                label="Last Name"
                                value={billingAddress.lastName}
                                onChange={handleBillingChange('lastName')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth required size="small"
                                label="Address Line 1"
                                value={billingAddress.address1}
                                onChange={handleBillingChange('address1')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth size="small"
                                label="Address Line 2"
                                value={billingAddress.address2}
                                onChange={handleBillingChange('address2')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth required size="small"
                                label="City"
                                value={billingAddress.city}
                                onChange={handleBillingChange('city')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth required size="small"
                                label="State/Province"
                                value={billingAddress.state}
                                onChange={handleBillingChange('state')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth required size="small"
                                label="Postal Code"
                                value={billingAddress.postalCode}
                                onChange={handleBillingChange('postalCode')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <CountryAutocomplete
                                value={billingAddress.country || null}
                                onChange={handleBillingCountryChange}
                                label="Country"
                                required
                                minimal
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth required size="small"
                                label="Phone"
                                value={billingAddress.phone}
                                onChange={handleBillingChange('phone')}
                            />
                        </Grid>
                    </Grid>
                )}
            </Paper>
        </Box>
    );
}
