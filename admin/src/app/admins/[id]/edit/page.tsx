'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Box,
    Paper,
    TextField,
    Button,
    Grid,
    FormControlLabel,
    Switch,
    IconButton,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { LoadingSpinner } from '@/components/atoms';

interface StoreOption {
    _id: string;
    name: string;
}

export default function EditAdminPage() {
    const router = useRouter();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stores, setStores] = useState<StoreOption[]>([]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'admin' as 'admin' | 'store_admin' | 'super_admin',
        storeId: '',
        isActive: true,
    });

    useEffect(() => {
        fetchStores();
        if (id) fetchAdmin();
    }, [id]);

    const fetchStores = async () => {
        try {
            const response = await api.get('/stores');
            setStores(response.data.stores || response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch stores');
        }
    };

    const fetchAdmin = async () => {
        try {
            const response = await api.get(`/admins/${id}`);
            const admin = response.data.data;
            setFormData({
                email: admin.email || '',
                password: '',
                firstName: admin.firstName || '',
                lastName: admin.lastName || '',
                phone: admin.phone || '',
                role: admin.role || 'admin',
                storeId: admin.storeId?._id || admin.storeId || '',
                isActive: admin.isActive ?? true,
            });
        } catch (err: any) {
            showNotification('Failed to load admin user', 'error');
            router.push('/admins');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updateData: any = { ...formData };
            if (!updateData.password) delete updateData.password;
            if (!updateData.storeId) delete updateData.storeId;

            await api.put(`/admins/${id}`, updateData);
            showNotification('Admin user updated successfully', 'success');
            router.push('/admins');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update admin', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading admin user..." />;

    const isSuperAdmin = formData.role === 'super_admin';

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">Edit Admin User</Typography>
            </Box>

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
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
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                required
                                type="email"
                                label="Email"
                                value={formData.email}
                                onChange={handleChange('email')}
                                disabled={isSuperAdmin}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                type="password"
                                label="New Password"
                                value={formData.password}
                                onChange={handleChange('password')}
                                helperText="Leave blank to keep current password"
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
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth disabled={isSuperAdmin}>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={formData.role}
                                    label="Role"
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                >
                                    {isSuperAdmin && <MenuItem value="super_admin">Super Admin</MenuItem>}
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="store_admin">Store Admin</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth disabled={formData.role !== 'store_admin'}>
                                <InputLabel>Store</InputLabel>
                                <Select
                                    value={formData.storeId}
                                    label="Store"
                                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {stores.map(store => (
                                        <MenuItem key={store._id} value={store._id}>{store.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        disabled={isSuperAdmin}
                                    />
                                }
                                label="Active"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Box display="flex" gap={2}>
                                <Button variant="outlined" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="contained" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
}
