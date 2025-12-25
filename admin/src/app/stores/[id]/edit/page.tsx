'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Box, Button, Paper, Typography, Tabs, Tab, Card, CardContent,
    TextField, FormControl, InputLabel, Select, MenuItem,
    Divider, InputAdornment, IconButton, CircularProgress, Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Visibility, VisibilityOff, EmailOutlined, Send } from '@mui/icons-material';
import api from '@/lib/api';
import StoreForm from '@/components/organisms/StoreForm';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { Store } from '@/types';

type EmailProvider = 'smtp' | 'ses' | 'sendgrid' | 'mailjet';

interface EmailSettings {
    provider: EmailProvider;
    fromEmail: string;
    fromName: string;
    replyTo?: string;
    rateLimit: number;
    smtp?: { host: string; port: number; secure: boolean; user: string; password: string };
    ses?: { region: string; accessKeyId: string; secretAccessKey: string };
    sendgrid?: { apiKey: string };
    mailjet?: { apiKey: string; secretKey: string };
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function EditStorePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const { showNotification } = useNotification();

    // Email settings state
    const [emailSettings, setEmailSettings] = useState<EmailSettings>({
        provider: 'smtp',
        fromEmail: '',
        fromName: '',
        replyTo: '',
        rateLimit: 30,
        smtp: { host: '', port: 587, secure: false, user: '', password: '' },
    });
    const [savingEmail, setSavingEmail] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [testEmail, setTestEmail] = useState('');

    useEffect(() => {
        fetchStore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchStore = async () => {
        try {
            const response = await api.get(`/stores/${id}`);
            setStore(response.data.store || response.data.data);

            // Fetch email settings
            const emailRes = await api.get(`/stores/${id}/email-settings`);
            if (emailRes.data.emailSettings) {
                setEmailSettings(emailRes.data.emailSettings);
            }
        } catch (err) {
            showNotification('Failed to load store', 'error');
            router.push('/stores');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: Record<string, unknown>) => {
        setIsSubmitting(true);
        try {
            await api.put(`/stores/${id}`, data);
            showNotification('Store updated successfully', 'success');
            router.push('/stores');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(error.response?.data?.message || 'Failed to update store', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProviderChange = (provider: EmailProvider) => {
        const newSettings: EmailSettings = {
            ...emailSettings,
            provider,
            smtp: undefined,
            ses: undefined,
            sendgrid: undefined,
            mailjet: undefined,
        };

        switch (provider) {
            case 'smtp':
                newSettings.smtp = { host: '', port: 587, secure: false, user: '', password: '' };
                break;
            case 'ses':
                newSettings.ses = { region: 'us-east-1', accessKeyId: '', secretAccessKey: '' };
                break;
            case 'sendgrid':
                newSettings.sendgrid = { apiKey: '' };
                break;
            case 'mailjet':
                newSettings.mailjet = { apiKey: '', secretKey: '' };
                break;
        }

        setEmailSettings(newSettings);
    };

    const handleSaveEmail = async () => {
        setSavingEmail(true);
        try {
            await api.put(`/stores/${id}/email-settings`, emailSettings);
            showNotification('Email settings saved successfully', 'success');
        } catch (err: unknown) {
            const error = err as { message?: string };
            showNotification(error.message || 'Failed to save email settings', 'error');
        } finally {
            setSavingEmail(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            showNotification('Please enter a test email address', 'error');
            return;
        }
        setTestingEmail(true);
        try {
            const res = await api.post(`/stores/${id}/email-settings/test`, { testEmail });
            showNotification(res.data.message, 'success');
        } catch (err: unknown) {
            const error = err as { message?: string };
            showNotification(error.message || 'Test failed', 'error');
        } finally {
            setTestingEmail(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading store..." />;

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.back()}
                    variant="outlined"
                >
                    Back
                </Button>
                <Box>
                    <Typography variant="h4" fontWeight={600}>
                        Edit Store
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {store?.name}
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                        <Tab label="General" />
                        <Tab label="Email Settings" />
                    </Tabs>
                </Box>

                {/* General Tab */}
                <TabPanel value={activeTab} index={0}>
                    <Box sx={{ p: 3, pt: 0 }}>
                        <StoreForm
                            initialData={store || undefined}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                        />
                        <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                            <Button
                                variant="outlined"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="store-form"
                                variant="contained"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Store'}
                            </Button>
                        </Box>
                    </Box>
                </TabPanel>

                {/* Email Settings Tab */}
                <TabPanel value={activeTab} index={1}>
                    <Box sx={{ p: 3, pt: 0 }}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 3 }}>Email Provider</Typography>

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Provider</InputLabel>
                                            <Select
                                                value={emailSettings.provider}
                                                label="Provider"
                                                onChange={(e) => handleProviderChange(e.target.value as EmailProvider)}
                                            >
                                                <MenuItem value="smtp">SMTP</MenuItem>
                                                <MenuItem value="ses">AWS SES</MenuItem>
                                                <MenuItem value="sendgrid">SendGrid</MenuItem>
                                                <MenuItem value="mailjet">Mailjet</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Rate Limit (per minute)"
                                            type="number"
                                            value={emailSettings.rateLimit}
                                            onChange={(e) => setEmailSettings({ ...emailSettings, rateLimit: Number(e.target.value) })}
                                            inputProps={{ min: 1, max: 100 }}
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                <Typography variant="h6" sx={{ mb: 3 }}>Sender Information</Typography>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            fullWidth
                                            label="From Email"
                                            value={emailSettings.fromEmail}
                                            onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                                            required
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            fullWidth
                                            label="From Name"
                                            value={emailSettings.fromName}
                                            onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            fullWidth
                                            label="Reply-To Email"
                                            value={emailSettings.replyTo || ''}
                                            onChange={(e) => setEmailSettings({ ...emailSettings, replyTo: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                {/* SMTP Config */}
                                {emailSettings.provider === 'smtp' && (
                                    <>
                                        <Typography variant="h6" sx={{ mb: 3 }}>SMTP Configuration</Typography>
                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="SMTP Host"
                                                    value={emailSettings.smtp?.host || ''}
                                                    onChange={(e) => setEmailSettings({
                                                        ...emailSettings,
                                                        smtp: { ...emailSettings.smtp!, host: e.target.value }
                                                    })}
                                                    placeholder="smtp.gmail.com"
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 3 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Port"
                                                    type="number"
                                                    value={emailSettings.smtp?.port || 587}
                                                    onChange={(e) => setEmailSettings({
                                                        ...emailSettings,
                                                        smtp: { ...emailSettings.smtp!, port: Number(e.target.value) }
                                                    })}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 3 }}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Secure (TLS)</InputLabel>
                                                    <Select
                                                        value={emailSettings.smtp?.secure ? 'true' : 'false'}
                                                        label="Secure (TLS)"
                                                        onChange={(e) => setEmailSettings({
                                                            ...emailSettings,
                                                            smtp: { ...emailSettings.smtp!, secure: e.target.value === 'true' }
                                                        })}
                                                    >
                                                        <MenuItem value="false">No (STARTTLS)</MenuItem>
                                                        <MenuItem value="true">Yes (TLS)</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Username"
                                                    value={emailSettings.smtp?.user || ''}
                                                    onChange={(e) => setEmailSettings({
                                                        ...emailSettings,
                                                        smtp: { ...emailSettings.smtp!, user: e.target.value }
                                                    })}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={emailSettings.smtp?.password || ''}
                                                    onChange={(e) => setEmailSettings({
                                                        ...emailSettings,
                                                        smtp: { ...emailSettings.smtp!, password: e.target.value }
                                                    })}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                )}

                                {/* SES Config */}
                                {emailSettings.provider === 'ses' && (
                                    <>
                                        <Typography variant="h6" sx={{ mb: 3 }}>AWS SES Configuration</Typography>
                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Region"
                                                    value={emailSettings.ses?.region || ''}
                                                    onChange={(e) => setEmailSettings({
                                                        ...emailSettings,
                                                        ses: { ...emailSettings.ses!, region: e.target.value }
                                                    })}
                                                    placeholder="us-east-1"
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Access Key ID"
                                                    value={emailSettings.ses?.accessKeyId || ''}
                                                    onChange={(e) => setEmailSettings({
                                                        ...emailSettings,
                                                        ses: { ...emailSettings.ses!, accessKeyId: e.target.value }
                                                    })}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Secret Access Key"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={emailSettings.ses?.secretAccessKey || ''}
                                                    onChange={(e) => setEmailSettings({
                                                        ...emailSettings,
                                                        ses: { ...emailSettings.ses!, secretAccessKey: e.target.value }
                                                    })}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                )}

                                {/* SendGrid Config */}
                                {emailSettings.provider === 'sendgrid' && (
                                    <>
                                        <Typography variant="h6" sx={{ mb: 3 }}>SendGrid Configuration</Typography>
                                        <TextField
                                            fullWidth
                                            label="API Key"
                                            type={showPassword ? 'text' : 'password'}
                                            value={emailSettings.sendgrid?.apiKey || ''}
                                            onChange={(e) => setEmailSettings({
                                                ...emailSettings,
                                                sendgrid: { apiKey: e.target.value }
                                            })}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </>
                                )}

                                {/* Mailjet Config */}
                                {emailSettings.provider === 'mailjet' && (
                                    <>
                                        <Typography variant="h6" sx={{ mb: 3 }}>Mailjet Configuration</Typography>
                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="API Key"
                                                    value={emailSettings.mailjet?.apiKey || ''}
                                                    onChange={(e) => setEmailSettings({
                                                        ...emailSettings,
                                                        mailjet: { ...emailSettings.mailjet!, apiKey: e.target.value }
                                                    })}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Secret Key"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={emailSettings.mailjet?.secretKey || ''}
                                                    onChange={(e) => setEmailSettings({
                                                        ...emailSettings,
                                                        mailjet: { ...emailSettings.mailjet!, secretKey: e.target.value }
                                                    })}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                )}

                                <Box sx={{ mt: 4 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveEmail}
                                        disabled={savingEmail}
                                        startIcon={savingEmail ? <CircularProgress size={20} /> : <EmailOutlined />}
                                    >
                                        {savingEmail ? 'Saving...' : 'Save Email Settings'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Test Email */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 3 }}>Test Email</Typography>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    Save your email settings first before sending a test email.
                                </Alert>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid size={{ xs: 12, md: 8 }}>
                                        <TextField
                                            fullWidth
                                            label="Test Email Address"
                                            value={testEmail}
                                            onChange={(e) => setTestEmail(e.target.value)}
                                            placeholder="test@example.com"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={handleTestEmail}
                                            disabled={testingEmail || !testEmail}
                                            startIcon={testingEmail ? <CircularProgress size={20} /> : <Send />}
                                            sx={{ height: '56px' }}
                                        >
                                            {testingEmail ? 'Sending...' : 'Send Test Email'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Box>
                </TabPanel>
            </Paper>
        </Box>
    );
}
