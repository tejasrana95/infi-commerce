'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Grid,
    Avatar,
    Chip,
    Tabs,
    Tab,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Card,
    CardContent,
} from '@mui/material';
import {
    Person as PersonIcon,
    Security as SecurityIcon,
    Badge as BadgeIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { nameBuilder, getInitials, getRole } from '@/utils/nameBuilder';
import TwoFactorSetup from '@/components/organisms/TwoFactorSetup';
import ChangePassword from '@/components/organisms/ChangePassword';
import api from '@/lib/api';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`profile-tabpanel-${index}`}
            aria-labelledby={`profile-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.put('auth/admin/me', profileData);
            setSuccess('Profile updated successfully');
            await refreshUser();
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const role = getRole(user);

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4, px: 2 }}>
            <Box display="flex" alignItems="center" gap={3} mb={5}>
                <Avatar
                    sx={{
                        width: 100,
                        height: 100,
                        bgcolor: 'primary.main',
                        fontSize: '2.5rem',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    }}
                >
                    {getInitials(nameBuilder(user))}
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight={800} color="text.primary">
                        {nameBuilder(user)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 18 }} /> {user?.email}
                    </Typography>
                    <Box mt={1}>
                        <Chip
                            label={role.label}
                            color="primary"
                            icon={<AdminIcon />}
                            sx={{ fontWeight: 600, borderRadius: '8px' }}
                        />
                    </Box>
                </Box>
            </Box>

            <Paper sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        sx={{
                            px: 2,
                            '& .MuiTab-root': { py: 2, fontWeight: 600, minWidth: 120 }
                        }}
                    >
                        <Tab icon={<PersonIcon sx={{ mb: '0 !important', mr: 1 }} />} iconPosition="start" label="Account" />
                        <Tab icon={<SecurityIcon sx={{ mb: '0 !important', mr: 1 }} />} iconPosition="start" label="Security" />
                        <Tab icon={<BadgeIcon sx={{ mb: '0 !important', mr: 1 }} />} iconPosition="start" label="Access" />
                    </Tabs>
                </Box>

                <Box sx={{ p: { xs: 2, md: 4 } }}>
                    {/* Account Details Tab */}
                    <CustomTabPanel value={tabValue} index={0}>
                        <form onSubmit={handleUpdateProfile}>
                            <Typography variant="h6" fontWeight={700} mb={3}>Personal Information</Typography>
                            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        name="firstName"
                                        value={profileData.firstName}
                                        onChange={handleProfileChange}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleProfileChange}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        disabled
                                        fullWidth
                                        label="Email Address"
                                        value={user?.email || ''}
                                        helperText="Email address cannot be changed."
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        name="phone"
                                        value={profileData.phone}
                                        onChange={handleProfileChange}
                                        placeholder="+1 234 567 8900"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        sx={{ px: 4, py: 1.2, fontWeight: 700, borderRadius: '8px' }}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CustomTabPanel>

                    {/* Security Tab */}
                    <CustomTabPanel value={tabValue} index={1}>
                        <Grid container spacing={5}>
                            <Grid size={{ xs: 12, lg: 6 }}>
                                <ChangePassword />
                            </Grid>
                            <Grid size={{ xs: 12, lg: 6 }}>
                                <Box>
                                    <Typography variant="h6" fontWeight={700} mb={3}>Two-Factor Authentication</Typography>
                                    <Typography variant="body2" color="text.secondary" mb={3}>
                                        Add an extra layer of security to your account by requiring a physical device to log in.
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                    <TwoFactorSetup />
                                </Box>
                            </Grid>
                        </Grid>
                    </CustomTabPanel>

                    {/* Access Tab */}
                    <CustomTabPanel value={tabValue} index={2}>
                        <Typography variant="h6" fontWeight={700} mb={3}>Role & Permissions</Typography>
                        <Card variant="outlined" sx={{ borderRadius: '12px', mb: 4, bgcolor: 'grey.50' }}>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                    Current Role: {role.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Your account is assigned the <strong>{user?.role}</strong> role. This role determines your level of access and what actions you can perform within the system.
                                </Typography>
                            </CardContent>
                        </Card>

                        <Typography variant="subtitle2" fontWeight={700} mb={1}>Permissions Breakdown</Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {(user?.permissions && user.permissions.length > 0) ? (user.permissions as string[]).map((p, i) => (
                                <Chip key={i} label={p} size="small" variant="outlined" />
                            )) : (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                    Full administrative access is granted to your role.
                                </Typography>
                            )}
                        </Box>
                    </CustomTabPanel>
                </Box>
            </Paper>
        </Box>
    );
}

