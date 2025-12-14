'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Grid,
    FormControlLabel,
    Switch,
    Typography,
    Card,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Tabs,
    Tab,
    IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CountryAutocomplete from '../molecules/CountryAutocomplete';

interface Address {
    _id?: string;
    type: 'billing' | 'shipping';
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
    isDefault: boolean;
}

const emptyAddress: Address = {
    type: 'shipping',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    phone: '',
    isDefault: false,
};

export interface CustomerFormData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    isActive: boolean;
    emailVerified: boolean;
    addresses: Address[];
}

interface CustomerFormProps {
    initialData?: Partial<CustomerFormData>;
    onSubmit: (data: CustomerFormData) => void;
    isSubmitting?: boolean;
    isNew?: boolean;
}

export default function CustomerForm({
    initialData,
    onSubmit,
    isSubmitting = false,
    isNew = false,
}: CustomerFormProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [formData, setFormData] = useState<Omit<CustomerFormData, 'addresses'>>({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        isActive: true,
        emailVerified: false,
    });
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [addressDialogOpen, setAddressDialogOpen] = useState(false);
    const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
    const [addressForm, setAddressForm] = useState<Address>(emptyAddress);

    // Initialize form with existing data
    useEffect(() => {
        if (initialData) {
            setFormData({
                email: initialData.email || '',
                password: '',
                firstName: initialData.firstName || '',
                lastName: initialData.lastName || '',
                phone: initialData.phone || '',
                isActive: initialData.isActive ?? true,
                emailVerified: initialData.emailVerified ?? false,
            });
            setAddresses(initialData.addresses || []);
        }
    }, [initialData]);

    const handleChange = (field: keyof typeof formData) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSwitchChange = (field: 'isActive' | 'emailVerified') => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData({ ...formData, [field]: e.target.checked });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ ...formData, addresses });
    };

    // Address management
    const openAddressDialog = (index: number | null = null) => {
        if (index !== null) {
            setAddressForm({ ...addresses[index] });
            setEditingAddressIndex(index);
        } else {
            setAddressForm({ ...emptyAddress });
            setEditingAddressIndex(null);
        }
        setAddressDialogOpen(true);
    };

    const handleAddressChange = (field: keyof Address) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setAddressForm({ ...addressForm, [field]: e.target.value });
    };

    const handleCountryChange = (value: string | string[] | null) => {
        setAddressForm({ ...addressForm, country: (value as string) || '' });
    };

    const saveAddress = () => {
        const newAddresses = [...addresses];
        if (editingAddressIndex !== null) {
            newAddresses[editingAddressIndex] = addressForm;
        } else {
            newAddresses.push(addressForm);
        }

        // Handle default address logic
        if (addressForm.isDefault) {
            newAddresses.forEach((addr, i) => {
                if (
                    addr.type === addressForm.type &&
                    i !== (editingAddressIndex ?? newAddresses.length - 1)
                ) {
                    addr.isDefault = false;
                }
            });
        }

        setAddresses(newAddresses);
        setAddressDialogOpen(false);
    };

    const deleteAddress = (index: number) => {
        if (confirm('Are you sure you want to delete this address?')) {
            setAddresses(addresses.filter((_, i) => i !== index));
        }
    };

    return (
        <Box component="form" id="customer-form" onSubmit={handleFormSubmit}>
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab icon={<PersonIcon />} iconPosition="start" label="Personal Information" />
                    <Tab
                        icon={<LocationOnIcon />}
                        iconPosition="start"
                        label={`Addresses (${addresses.length})`}
                    />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {/* Tab 0: Personal Information */}
                    {activeTab === 0 && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    label="First Name"
                                    value={formData.firstName}
                                    onChange={handleChange('firstName')}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Last Name"
                                    value={formData.lastName}
                                    onChange={handleChange('lastName')}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    type="email"
                                    label="Email"
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={handleChange('phone')}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    type="password"
                                    label={isNew ? 'Password' : 'New Password'}
                                    value={formData.password}
                                    onChange={handleChange('password')}
                                    required={isNew}
                                    helperText={
                                        isNew
                                            ? 'Minimum 6 characters'
                                            : 'Leave blank to keep current password'
                                    }
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isActive}
                                            onChange={handleSwitchChange('isActive')}
                                        />
                                    }
                                    label="Active"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.emailVerified}
                                            onChange={handleSwitchChange('emailVerified')}
                                        />
                                    }
                                    label="Email Verified"
                                />
                            </Grid>
                        </Grid>
                    )}

                    {/* Tab 1: Addresses */}
                    {activeTab === 1 && (
                        <Box>
                            <Box display="flex" justifyContent="flex-end" mb={2}>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => openAddressDialog()}
                                    size="small"
                                >
                                    Add Address
                                </Button>
                            </Box>

                            {addresses.length === 0 ? (
                                <Typography color="text.secondary" textAlign="center" py={6}>
                                    No addresses added yet. Click &quot;Add Address&quot; to create one.
                                </Typography>
                            ) : (
                                <Grid container spacing={2}>
                                    {addresses.map((address, index) => (
                                        <Grid size={{ xs: 12, md: 6 }} key={index}>
                                            <Card variant="outlined">
                                                <CardContent sx={{ pb: 1 }}>
                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                        <Chip
                                                            label={address.type}
                                                            size="small"
                                                            color={address.type === 'billing' ? 'primary' : 'secondary'}
                                                            variant="outlined"
                                                        />
                                                        {address.isDefault && (
                                                            <Chip label="Default" size="small" color="success" />
                                                        )}
                                                    </Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {address.firstName} {address.lastName}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {address.address1}
                                                    </Typography>
                                                    {address.address2 && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {address.address2}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="body2" color="text.secondary">
                                                        {address.city}, {address.state} {address.postalCode}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {address.country}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                                        📞 {address.phone}
                                                    </Typography>
                                                </CardContent>
                                                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                                    <IconButton size="small" onClick={() => openAddressDialog(index)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => deleteAddress(index)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </CardActions>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Address Dialog */}
            <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingAddressIndex !== null ? 'Edit Address' : 'Add Address'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={addressForm.type}
                                    label="Type"
                                    onChange={(e) =>
                                        setAddressForm({ ...addressForm, type: e.target.value as 'billing' | 'shipping' })
                                    }
                                >
                                    <MenuItem value="shipping">Shipping</MenuItem>
                                    <MenuItem value="billing">Billing</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={addressForm.isDefault}
                                        onChange={(e) =>
                                            setAddressForm({ ...addressForm, isDefault: e.target.checked })
                                        }
                                    />
                                }
                                label="Default Address"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                required
                                size="small"
                                label="First Name"
                                value={addressForm.firstName}
                                onChange={handleAddressChange('firstName')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                required
                                size="small"
                                label="Last Name"
                                value={addressForm.lastName}
                                onChange={handleAddressChange('lastName')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                required
                                size="small"
                                label="Address Line 1"
                                value={addressForm.address1}
                                onChange={handleAddressChange('address1')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Address Line 2"
                                value={addressForm.address2}
                                onChange={handleAddressChange('address2')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                required
                                size="small"
                                label="City"
                                value={addressForm.city}
                                onChange={handleAddressChange('city')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                required
                                size="small"
                                label="State/Province"
                                value={addressForm.state}
                                onChange={handleAddressChange('state')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                required
                                size="small"
                                label="Postal Code"
                                value={addressForm.postalCode}
                                onChange={handleAddressChange('postalCode')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <CountryAutocomplete
                                value={addressForm.country}
                                onChange={handleCountryChange}
                                label="Country"
                                required
                                minimal
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                required
                                size="small"
                                label="Phone"
                                value={addressForm.phone}
                                onChange={handleAddressChange('phone')}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
                    <Button onClick={saveAddress} variant="contained">
                        {editingAddressIndex !== null ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
