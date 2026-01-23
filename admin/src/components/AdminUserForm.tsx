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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Alert,
} from '@mui/material';
import api from '@/lib/api';

interface StoreOption {
    _id: string;
    name: string;
}

interface AdminFormData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: 'admin' | 'store_admin' | 'super_admin' | 'pos_user';
    storeId: string;
    isActive: boolean;
    posPermissions?: {
        canOverridePrice: boolean;
        canApplyDiscount: boolean;
    };
}

interface AdminUserFormProps {
    mode: 'create' | 'edit';
    initialData?: Partial<AdminFormData>;
    adminId?: string;
    onSubmit: (data: AdminFormData) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    isSuperAdmin?: boolean;
}

export default function AdminUserForm({
    mode,
    initialData,
    onSubmit,
    onCancel,
    loading = false,
    isSuperAdmin = false,
}: AdminUserFormProps) {
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [formData, setFormData] = useState<AdminFormData>({
        email: initialData?.email || '',
        password: initialData?.password || '',
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        phone: initialData?.phone || '',
        role: initialData?.role || 'admin',
        storeId: initialData?.storeId || '',
        isActive: initialData?.isActive ?? true,
        posPermissions: initialData?.posPermissions || {
            canOverridePrice: false,
            canApplyDiscount: false,
        },
    });

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                posPermissions: initialData.posPermissions || prev.posPermissions,
            }));
        }
    }, [initialData]);

    const fetchStores = async () => {
        try {
            const response = await api.get('/stores');
            setStores(response.data.stores || response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch stores');
        }
    };

    const handleChange = (field: keyof AdminFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const requiresStore = formData.role === 'store_admin' || formData.role === 'pos_user';
    const showPOSPermissions = formData.role === 'pos_user';

    return (
        <Paper sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Basic Info */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom>
                            Basic Information
                        </Typography>
                    </Grid>

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

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            required
                            type="email"
                            label="Email"
                            value={formData.email}
                            onChange={handleChange('email')}
                            disabled={isSuperAdmin && mode === 'edit'}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            required={mode === 'create'}
                            type="password"
                            label={mode === 'edit' ? 'New Password' : 'Password'}
                            value={formData.password}
                            onChange={handleChange('password')}
                            helperText={
                                mode === 'edit'
                                    ? 'Leave blank to keep current password'
                                    : 'Minimum 8 characters'
                            }
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Phone"
                            value={formData.phone}
                            onChange={handleChange('phone')}
                        />
                    </Grid>

                    {/* Role & Store */}
                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Role & Access
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={formData.role}
                                label="Role"
                                onChange={(e) =>
                                    setFormData({ ...formData, role: e.target.value as any })
                                }
                            >
                                {isSuperAdmin && (
                                    <MenuItem value="super_admin">Super Admin</MenuItem>
                                )}
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="store_admin">Store Admin</MenuItem>
                                <MenuItem value="pos_user">POS User</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth disabled={!requiresStore} required={requiresStore}>
                            <InputLabel>Store</InputLabel>
                            <Select
                                value={formData.storeId}
                                label="Store"
                                onChange={(e) =>
                                    setFormData({ ...formData, storeId: e.target.value })
                                }
                            >
                                <MenuItem value="">None</MenuItem>
                                {stores.map((store) => (
                                    <MenuItem key={store._id} value={store._id}>
                                        {store.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {requiresStore && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                {formData.role === 'pos_user'
                                    ? 'POS users must be assigned to a store'
                                    : 'Store admins must be assigned to a store'}
                            </Typography>
                        )}
                    </Grid>

                    {/* POS Permissions */}
                    {showPOSPermissions && (
                        <>
                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    POS Permissions
                                </Typography>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Configure what actions this POS user can perform in the Point of
                                    Checkout system
                                </Alert>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.posPermissions?.canOverridePrice || false}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    posPermissions: {
                                                        ...formData.posPermissions!,
                                                        canOverridePrice: e.target.checked,
                                                    },
                                                })
                                            }
                                        />
                                    }
                                    label="Allow Price Override"
                                />
                                <Typography variant="caption" color="text.secondary" display="block">
                                    User can override product prices during checkout (requires
                                    password confirmation)
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.posPermissions?.canApplyDiscount || false}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    posPermissions: {
                                                        ...formData.posPermissions!,
                                                        canApplyDiscount: e.target.checked,
                                                    },
                                                })
                                            }
                                        />
                                    }
                                    label="Allow Apply Discount"
                                />
                                <Typography variant="caption" color="text.secondary" display="block">
                                    User can apply custom discounts (requires password confirmation)
                                </Typography>
                            </Grid>
                        </>
                    )}

                    {/* Status */}
                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 2 }} />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isActive: e.target.checked })
                                    }
                                    disabled={isSuperAdmin && mode === 'edit'}
                                />
                            }
                            label="Active"
                        />
                    </Grid>

                    {/* Actions */}
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" gap={2}>
                            <Button variant="outlined" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained" disabled={loading}>
                                {loading
                                    ? mode === 'create'
                                        ? 'Creating...'
                                        : 'Saving...'
                                    : mode === 'create'
                                        ? 'Create Admin'
                                        : 'Save Changes'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
}
