'use client';

import { useState } from 'react';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { PageHeader } from '@/components/molecules';

export default function NewCustomerPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        isActive: true,
        emailVerified: false,
    });

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/customers', formData);
            showNotification('Customer created successfully', 'success');
            router.push('/customers');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to create customer', 'error');
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
                <Typography variant="h4" fontWeight="bold">Add Customer</Typography>
            </Box>

            <Paper sx={{ p: 3, maxWidth: 600 }}>
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
                                helperText="Minimum 6 characters"
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
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.emailVerified}
                                        onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
                                    />
                                }
                                label="Email Verified"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Box display="flex" gap={2}>
                                <Button variant="outlined" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="contained" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Customer'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
}
