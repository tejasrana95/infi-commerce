'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface StoreOption {
    _id: string;
    name: string;
}

export default function NewAdminPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState<StoreOption[]>([]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'admin' as 'admin' | 'store_admin',
        storeId: '',
        isActive: true,
    });

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const response = await api.get('/stores');
            setStores(response.data.stores || response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch stores');
        }
    };

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData = { ...formData };
            if (!submitData.storeId) delete (submitData as any).storeId;

            await api.post('/admins', submitData);
            showNotification('Admin user created successfully', 'success');
            router.push('/admins');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to create admin', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">Add Admin User</Typography>
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
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                required
                                type="password"
                                label="Password"
                                value={formData.password}
                                onChange={handleChange('password')}
                                helperText="Minimum 8 characters"
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
                            <FormControl fullWidth required>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={formData.role}
                                    label="Role"
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'store_admin' })}
                                >
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
                                <Button type="submit" variant="contained" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Admin'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
}
