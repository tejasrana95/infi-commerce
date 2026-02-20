'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Box, Button, Paper, Typography, Tabs, Tab, Card, CardContent,
    TextField, FormControl, InputLabel, Select, MenuItem,
    Divider, InputAdornment, IconButton, CircularProgress, Alert,
    FormControlLabel, Checkbox, FormGroup,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
    Visibility, VisibilityOff, EmailOutlined, Send, SmsOutlined, WhatsApp,
    Telegram, NotificationsActive, SmartToyOutlined
} from '@mui/icons-material';
import api from '@/lib/api';
import StoreForm, { StoreFormData } from '@/components/organisms/StoreForm';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { Store } from '@/types';
import PWASettings from '@/components/organisms/PWASettings/PWASettings';
import ReturnSettingsPanel from '@/components/organisms/ReturnSettingsPanel';
import CookieConsentSettingsComponent, { CookieConsentSettings } from '@/components/organisms/CookieConsentSettings';
import GoogleMerchantSettingsComponent, { GoogleMerchantSettingsData } from '@/components/organisms/GoogleMerchantSettings/GoogleMerchantSettings';

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

type SmsProvider = 'twilio' | 'msg91' | 'd7networks';

interface SmsSettings {
    enabled: boolean;
    provider: SmsProvider;
    twilio?: { accountSid: string; authToken: string; fromNumber: string };
    msg91?: { apiKey: string; senderId: string; templateId?: string };
    d7networks?: { token: string; originator: string };
}

type WhatsappProvider = 'meta' | 'twilio' | 'd7networks';

interface WhatsappSettings {
    enabled: boolean;
    provider: WhatsappProvider;
    meta?: { phoneNumberId: string; accessToken: string; businessAccountId?: string };
    twilio?: { accountSid: string; authToken: string; fromWhatsAppNumber: string };
    d7networks?: { token: string; originator: string };
}

interface TelegramSettings {
    enabled: boolean;
    botToken: string;
    chatId: string;
    notifications: {
        newOrder: boolean;
        orderStatus: boolean;
        returnRequest: boolean;
        orderCancel: boolean;
        newCustomer: boolean;
    };
}

interface AdminNotificationSettings {
    emails: string;
    notifications: {
        emailEnabled: boolean;
        newOrder: boolean;
        orderStatus: boolean;
        returnRequest: boolean;
        orderCancel: boolean;
        newCustomer: boolean;
    };
}

interface AISettings {
    enabled: boolean;
    openaiKey: string;
    model?: string;
}

interface PWASettings {
    enabled: boolean;
    appName?: string;
    appShortName?: string;
    themeColor?: string;
    backgroundColor?: string;
    icons?: {
        icon192?: string;
        icon512?: string;
        appleTouchIcon?: string;
    };
    installPromptStyle?: 'toast' | 'banner' | 'modal';
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

    // SMS settings state
    const [smsSettings, setSmsSettings] = useState<SmsSettings>({
        enabled: false,
        provider: 'twilio',
        twilio: { accountSid: '', authToken: '', fromNumber: '' },
    });
    const [savingSms, setSavingSms] = useState(false);

    // WhatsApp settings state
    const [whatsappSettings, setWhatsappSettings] = useState<WhatsappSettings>({
        enabled: false,
        provider: 'meta',
        meta: { phoneNumberId: '', accessToken: '', businessAccountId: '' },
    });
    const [savingWhatsapp, setSavingWhatsapp] = useState(false);

    // Telegram settings state
    const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
        enabled: false,
        botToken: '',
        chatId: '',
        notifications: {
            newOrder: true,
            orderStatus: true,
            returnRequest: true,
            orderCancel: true,
            newCustomer: true,
        },
    });
    const [savingTelegram, setSavingTelegram] = useState(false);

    // Admin Notification settings state
    const [adminNotificationSettings, setAdminNotificationSettings] = useState<AdminNotificationSettings>({
        emails: '',
        notifications: {
            emailEnabled: true,
            newOrder: true,
            orderStatus: true,
            returnRequest: true,
            orderCancel: true,
            newCustomer: true,
        },
    });
    const [savingAdminNotif, setSavingAdminNotif] = useState(false);

    // AI Assistant settings state
    const [aiSettings, setAiSettings] = useState<AISettings>({
        enabled: false,
        openaiKey: '',
        model: 'gpt-4o-mini',
    });
    const [savingAI, setSavingAI] = useState(false);

    // PWA settings state
    const [pwaSettings, setPwaSettings] = useState<PWASettings>({
        enabled: false,
        appName: '',
        appShortName: '',
        themeColor: '#000000',
        backgroundColor: '#ffffff',
        icons: {
            icon192: '',
            icon512: '',
            appleTouchIcon: '',
        },
        installPromptStyle: 'toast',
    });
    const [savingPWA, setSavingPWA] = useState(false);

    // Cookie Consent settings state
    const [cookieConsentSettings, setCookieConsentSettings] = useState<CookieConsentSettings>({
        enabled: false,
        title: '',
        description: '',
        ctaLink: '',
        ctaText: 'Accept',
        icon: '',
        position: 'bottom-center',
        width: 'half',
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
    });
    const [savingCookie, setSavingCookie] = useState(false);

    // Google Merchant settings state
    const [googleMerchantSettings, setGoogleMerchantSettings] = useState<GoogleMerchantSettingsData>({
        enabled: false,
        merchantId: '',
        serviceAccountKey: '',
        targetCountries: ['US'],
        contentLanguage: 'en',
        autoSync: false,
        syncFrequency: 'manual',
        feedSettings: {
            includeOutOfStock: false,
            includeInactive: false,
            defaultShippingLabel: '',
            defaultTaxCategory: '',
            customLabels: [],
        },
    });
    const [savingGMC, setSavingGMC] = useState(false);

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

            // Fetch SMS settings
            const smsRes = await api.get(`/stores/${id}/sms-settings`);
            if (smsRes.data.smsSettings) {
                setSmsSettings(smsRes.data.smsSettings);
            }

            // Fetch WhatsApp settings
            const whatsappRes = await api.get(`/stores/${id}/whatsapp-settings`);
            if (whatsappRes.data.whatsappSettings) {
                setWhatsappSettings(whatsappRes.data.whatsappSettings);
            }

            // Sync with store settings for new fields
            const currentStore = response.data.store || response.data.data;
            if (currentStore?.settings?.telegramSettings) {
                setTelegramSettings(currentStore.settings.telegramSettings);
            }
            if (currentStore?.settings?.adminNotificationSettings) {
                setAdminNotificationSettings(currentStore.settings.adminNotificationSettings);
            }
            if (currentStore?.settings?.aiSettings) {
                setAiSettings({
                    ...currentStore.settings.aiSettings,
                    model: currentStore.settings.aiSettings.model || 'gpt-4o-mini'
                });
            }
            if (currentStore?.pwaSettings) {
                setPwaSettings({
                    enabled: currentStore.pwaSettings.enabled || false,
                    appName: currentStore.pwaSettings.appName || currentStore.name,
                    appShortName: currentStore.pwaSettings.appShortName || currentStore.name.slice(0, 12),
                    themeColor: currentStore.pwaSettings.themeColor || '#000000',
                    backgroundColor: currentStore.pwaSettings.backgroundColor || '#ffffff',
                    icons: currentStore.pwaSettings.icons || {},
                    installPromptStyle: currentStore.pwaSettings.installPromptStyle || 'toast',
                });
            }
            if (currentStore?.cookieConsentSettings) {
                setCookieConsentSettings(currentStore.cookieConsentSettings);
            }
            if (currentStore?.googleMerchantSettings) {
                setGoogleMerchantSettings({
                    enabled: currentStore.googleMerchantSettings.enabled || false,
                    merchantId: currentStore.googleMerchantSettings.merchantId || '',
                    serviceAccountKey: currentStore.googleMerchantSettings.serviceAccountKey || '',
                    targetCountries: currentStore.googleMerchantSettings.targetCountries || ['US'],
                    contentLanguage: currentStore.googleMerchantSettings.contentLanguage || 'en',
                    autoSync: currentStore.googleMerchantSettings.autoSync || false,
                    syncFrequency: currentStore.googleMerchantSettings.syncFrequency || 'manual',
                    feedSettings: {
                        includeOutOfStock: currentStore.googleMerchantSettings.feedSettings?.includeOutOfStock || false,
                        includeInactive: currentStore.googleMerchantSettings.feedSettings?.includeInactive || false,
                        defaultShippingLabel: currentStore.googleMerchantSettings.feedSettings?.defaultShippingLabel || '',
                        defaultTaxCategory: currentStore.googleMerchantSettings.feedSettings?.defaultTaxCategory || '',
                        customLabels: currentStore.googleMerchantSettings.feedSettings?.customLabels || [],
                    },
                });
            }
        } catch {
            showNotification('Failed to load store', 'error');
            router.push('/stores');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: StoreFormData) => {
        setIsSubmitting(true);
        try {
            await api.put(`/stores/${id}`, data);
            showNotification('Store updated successfully', 'success');
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

    const handleSmsProviderChange = (provider: SmsProvider) => {
        setSmsSettings({
            ...smsSettings,
            provider,
            twilio: provider === 'twilio' ? smsSettings.twilio || { accountSid: '', authToken: '', fromNumber: '' } : undefined,
            msg91: provider === 'msg91' ? smsSettings.msg91 || { apiKey: '', senderId: '' } : undefined,
            d7networks: provider === 'd7networks' ? smsSettings.d7networks || { token: '', originator: '' } : undefined,
        });
    };

    const handleSaveSms = async () => {
        setSavingSms(true);
        try {
            await api.put(`/stores/${id}/sms-settings`, smsSettings);
            showNotification('SMS settings saved successfully', 'success');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(error.response?.data?.message || 'Failed to save SMS settings', 'error');
        } finally {
            setSavingSms(false);
        }
    };

    const handleWhatsappProviderChange = (provider: WhatsappProvider) => {
        setWhatsappSettings({
            ...whatsappSettings,
            provider,
            meta: provider === 'meta' ? whatsappSettings.meta || { phoneNumberId: '', accessToken: '' } : undefined,
            twilio: provider === 'twilio' ? whatsappSettings.twilio || { accountSid: '', authToken: '', fromWhatsAppNumber: '' } : undefined,
            d7networks: provider === 'd7networks' ? whatsappSettings.d7networks || { token: '', originator: '' } : undefined,
        });
    };

    const handleSaveWhatsapp = async () => {
        setSavingWhatsapp(true);
        try {
            await api.put(`/stores/${id}/whatsapp-settings`, whatsappSettings);
            showNotification('WhatsApp settings saved successfully', 'success');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(error.response?.data?.message || 'Failed to save WhatsApp settings', 'error');
        } finally {
            setSavingWhatsapp(false);
        }
    };

    const handleSaveTelegram = async () => {
        setSavingTelegram(true);
        try {
            await api.put(`/stores/${id}`, { settings: { telegramSettings } });
            showNotification('Telegram settings saved successfully', 'success');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(error.response?.data?.message || 'Failed to save Telegram settings', 'error');
        } finally {
            setSavingTelegram(false);
        }
    };

    const handleSaveAdminNotif = async () => {
        setSavingAdminNotif(true);
        try {
            await api.put(`/stores/${id}`, { settings: { adminNotificationSettings } });
            showNotification('Admin notification settings saved successfully', 'success');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(error.response?.data?.message || 'Failed to save Admin notification settings', 'error');
        } finally {
            setSavingAdminNotif(false);
        }
    };

    const handleSaveAI = async () => {
        setSavingAI(true);
        try {
            await api.put(`/stores/${id}`, { settings: { aiSettings } });
            showNotification('AI Assistant settings saved successfully', 'success');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(error.response?.data?.message || 'Failed to save AI Assistant settings', 'error');
        } finally {
            setSavingAI(false);
        }
    };

    const handleSavePWA = async (settings: PWASettings) => {
        setSavingPWA(true);
        try {
            await api.put(`/stores/${id}`, { pwaSettings: settings });
            setPwaSettings(settings);
            showNotification('PWA settings saved successfully', 'success');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(error.response?.data?.message || 'Failed to save PWA settings', 'error');
        } finally {
            setSavingPWA(false);
        }
    };

    const handleSaveCookie = async (settings: CookieConsentSettings) => {
        setSavingCookie(true);
        try {
            await api.patch(`/stores/${id}`, { cookieConsentSettings: settings });
            setCookieConsentSettings(settings);
            showNotification('Cookie consent settings saved successfully', 'success');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(error.response?.data?.message || 'Failed to save Cookie consent settings', 'error');
            throw error;
        } finally {
            setSavingCookie(false);
        }
    };

    const handleSaveGMC = async (settings: GoogleMerchantSettingsData) => {
        setSavingGMC(true);
        try {
            await api.patch(`/stores/${id}`, { googleMerchantSettings: settings });
            setGoogleMerchantSettings(settings);
            showNotification('Google Merchant settings saved successfully', 'success');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(error.response?.data?.message || 'Failed to save Google Merchant settings', 'error');
        } finally {
            setSavingGMC(false);
        }
    };

    return (
        <Box sx={{ position: 'relative' }}>
            {loading && (
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: 1,
                }}>
                    <LoadingSpinner />
                </Box>
            )}
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
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                    >
                        <Tab label="General" />
                        <Tab label="Email Settings" />
                        <Tab label="SMS Settings" />
                        <Tab label="WhatsApp Settings" />
                        <Tab label="Telegram Settings" />
                        <Tab label="Admin Notifications" />
                        <Tab label="AI Assistant" />
                        <Tab label="PWA Settings" />
                        <Tab label="Return Settings" />
                        <Tab label="Cookie Consent" />
                        <Tab label="Google Merchant" />
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

                {/* SMS Settings Tab */}
                <TabPanel value={activeTab} index={2}>
                    <Box sx={{ p: 3, pt: 0 }}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Typography variant="h6">SMS Configuration</Typography>
                                    <Button
                                        variant={smsSettings.enabled ? "contained" : "outlined"}
                                        color={smsSettings.enabled ? "success" : "inherit"}
                                        onClick={() => setSmsSettings({ ...smsSettings, enabled: !smsSettings.enabled })}
                                    >
                                        {smsSettings.enabled ? "Enabled" : "Disabled"}
                                    </Button>
                                </Box>

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>SMS Provider</InputLabel>
                                            <Select
                                                value={smsSettings.provider}
                                                label="SMS Provider"
                                                onChange={(e) => handleSmsProviderChange(e.target.value as SmsProvider)}
                                                disabled={!smsSettings.enabled}
                                            >
                                                <MenuItem value="twilio">Twilio</MenuItem>
                                                <MenuItem value="msg91">MSG91</MenuItem>
                                                <MenuItem value="d7networks">D7Networks</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                {smsSettings.provider === 'd7networks' && (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={600} mb={2}>D7Networks Settings</Typography>
                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="API Token"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={smsSettings.d7networks?.token || ''}
                                                    onChange={(e) => setSmsSettings({
                                                        ...smsSettings,
                                                        d7networks: { ...smsSettings.d7networks!, token: e.target.value }
                                                    })}
                                                    disabled={!smsSettings.enabled}
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
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Originator (Sender ID)"
                                                    value={smsSettings.d7networks?.originator || ''}
                                                    onChange={(e) => setSmsSettings({
                                                        ...smsSettings,
                                                        d7networks: { ...smsSettings.d7networks!, originator: e.target.value }
                                                    })}
                                                    disabled={!smsSettings.enabled}
                                                    placeholder="MyBrand"
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                )}

                                {smsSettings.provider === 'twilio' && (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={600} mb={2}>Twilio Settings</Typography>
                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Account SID"
                                                    value={smsSettings.twilio?.accountSid || ''}
                                                    onChange={(e) => setSmsSettings({
                                                        ...smsSettings,
                                                        twilio: { ...smsSettings.twilio!, accountSid: e.target.value }
                                                    })}
                                                    disabled={!smsSettings.enabled}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Auth Token"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={smsSettings.twilio?.authToken || ''}
                                                    onChange={(e) => setSmsSettings({
                                                        ...smsSettings,
                                                        twilio: { ...smsSettings.twilio!, authToken: e.target.value }
                                                    })}
                                                    disabled={!smsSettings.enabled}
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
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="From Number"
                                                    value={smsSettings.twilio?.fromNumber || ''}
                                                    onChange={(e) => setSmsSettings({
                                                        ...smsSettings,
                                                        twilio: { ...smsSettings.twilio!, fromNumber: e.target.value }
                                                    })}
                                                    disabled={!smsSettings.enabled}
                                                    placeholder="+1234567890"
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                )}

                                {smsSettings.provider === 'msg91' && (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={600} mb={2}>MSG91 Settings</Typography>
                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Auth Key"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={smsSettings.msg91?.apiKey || ''}
                                                    onChange={(e) => setSmsSettings({
                                                        ...smsSettings,
                                                        msg91: { ...smsSettings.msg91!, apiKey: e.target.value }
                                                    })}
                                                    disabled={!smsSettings.enabled}
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
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Sender ID"
                                                    value={smsSettings.msg91?.senderId || ''}
                                                    onChange={(e) => setSmsSettings({
                                                        ...smsSettings,
                                                        msg91: { ...smsSettings.msg91!, senderId: e.target.value }
                                                    })}
                                                    disabled={!smsSettings.enabled}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Template ID (Default)"
                                                    value={smsSettings.msg91?.templateId || ''}
                                                    onChange={(e) => setSmsSettings({
                                                        ...smsSettings,
                                                        msg91: { ...smsSettings.msg91!, templateId: e.target.value }
                                                    })}
                                                    disabled={!smsSettings.enabled}
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                )}

                                <Box sx={{ mt: 4 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveSms}
                                        disabled={savingSms}
                                        startIcon={savingSms ? <CircularProgress size={20} /> : <SmsOutlined />}
                                    >
                                        {savingSms ? 'Saving...' : 'Save SMS Settings'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </TabPanel>

                {/* WhatsApp Settings Tab */}
                <TabPanel value={activeTab} index={3}>
                    {/* ... existing whatsapp content ... */}
                    <Box sx={{ p: 3, pt: 0 }}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Typography variant="h6">WhatsApp Configuration</Typography>
                                    <Button
                                        variant={whatsappSettings.enabled ? "contained" : "outlined"}
                                        color={whatsappSettings.enabled ? "success" : "inherit"}
                                        onClick={() => setWhatsappSettings({ ...whatsappSettings, enabled: !whatsappSettings.enabled })}
                                    >
                                        {whatsappSettings.enabled ? "Enabled" : "Disabled"}
                                    </Button>
                                </Box>

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>WhatsApp Provider</InputLabel>
                                            <Select
                                                value={whatsappSettings.provider}
                                                label="WhatsApp Provider"
                                                onChange={(e) => handleWhatsappProviderChange(e.target.value as WhatsappProvider)}
                                                disabled={!whatsappSettings.enabled}
                                            >
                                                <MenuItem value="meta">Meta (Direct API)</MenuItem>
                                                <MenuItem value="twilio">Twilio WhatsApp</MenuItem>
                                                <MenuItem value="d7networks">D7Networks WhatsApp</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                {whatsappSettings.provider === 'd7networks' && (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={600} mb={2}>D7Networks WhatsApp Settings</Typography>
                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="API Token"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={whatsappSettings.d7networks?.token || ''}
                                                    onChange={(e) => setWhatsappSettings({
                                                        ...whatsappSettings,
                                                        d7networks: { ...whatsappSettings.d7networks!, token: e.target.value }
                                                    })}
                                                    disabled={!whatsappSettings.enabled}
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
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Originator (Registered Number)"
                                                    value={whatsappSettings.d7networks?.originator || ''}
                                                    onChange={(e) => setWhatsappSettings({
                                                        ...whatsappSettings,
                                                        d7networks: { ...whatsappSettings.d7networks!, originator: e.target.value }
                                                    })}
                                                    disabled={!whatsappSettings.enabled}
                                                    placeholder="1234567890"
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                )}

                                {whatsappSettings.provider === 'meta' && (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={600} mb={2}>Meta WhatsApp Business API Settings</Typography>
                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Phone Number ID"
                                                    value={whatsappSettings.meta?.phoneNumberId || ''}
                                                    onChange={(e) => setWhatsappSettings({
                                                        ...whatsappSettings,
                                                        meta: { ...whatsappSettings.meta!, phoneNumberId: e.target.value }
                                                    })}
                                                    disabled={!whatsappSettings.enabled}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="WhatsApp Business Account ID"
                                                    value={whatsappSettings.meta?.businessAccountId || ''}
                                                    onChange={(e) => setWhatsappSettings({
                                                        ...whatsappSettings,
                                                        meta: { ...whatsappSettings.meta!, businessAccountId: e.target.value }
                                                    })}
                                                    disabled={!whatsappSettings.enabled}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Access Token (Permanent Recommended)"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={whatsappSettings.meta?.accessToken || ''}
                                                    onChange={(e) => setWhatsappSettings({
                                                        ...whatsappSettings,
                                                        meta: { ...whatsappSettings.meta!, accessToken: e.target.value }
                                                    })}
                                                    disabled={!whatsappSettings.enabled}
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

                                {whatsappSettings.provider === 'twilio' && (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={600} mb={2}>Twilio WhatsApp Settings</Typography>
                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Account SID"
                                                    value={whatsappSettings.twilio?.accountSid || ''}
                                                    onChange={(e) => setWhatsappSettings({
                                                        ...whatsappSettings,
                                                        twilio: { ...whatsappSettings.twilio!, accountSid: e.target.value }
                                                    })}
                                                    disabled={!whatsappSettings.enabled}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Auth Token"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={whatsappSettings.twilio?.authToken || ''}
                                                    onChange={(e) => setWhatsappSettings({
                                                        ...whatsappSettings,
                                                        twilio: { ...whatsappSettings.twilio!, authToken: e.target.value }
                                                    })}
                                                    disabled={!whatsappSettings.enabled}
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
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="From WhatsApp Number"
                                                    value={whatsappSettings.twilio?.fromWhatsAppNumber || ''}
                                                    onChange={(e) => setWhatsappSettings({
                                                        ...whatsappSettings,
                                                        twilio: { ...whatsappSettings.twilio!, fromWhatsAppNumber: e.target.value }
                                                    })}
                                                    disabled={!whatsappSettings.enabled}
                                                    placeholder="whatsapp:+1234567890"
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                )}

                                <Box sx={{ mt: 4 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveWhatsapp}
                                        disabled={savingWhatsapp}
                                        startIcon={savingWhatsapp ? <CircularProgress size={20} /> : <WhatsApp />}
                                    >
                                        {savingWhatsapp ? 'Saving...' : 'Save WhatsApp Settings'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </TabPanel>

                {/* Telegram Settings Tab */}
                <TabPanel value={activeTab} index={4}>
                    <Box sx={{ p: 3, pt: 0 }}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Typography variant="h6">Telegram Integration</Typography>
                                    <Button
                                        variant={telegramSettings.enabled ? "contained" : "outlined"}
                                        color={telegramSettings.enabled ? "success" : "inherit"}
                                        onClick={() => setTelegramSettings({ ...telegramSettings, enabled: !telegramSettings.enabled })}
                                    >
                                        {telegramSettings.enabled ? "Enabled" : "Disabled"}
                                    </Button>
                                </Box>

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Bot Token"
                                            value={telegramSettings.botToken}
                                            onChange={(e) => setTelegramSettings({ ...telegramSettings, botToken: e.target.value })}
                                            disabled={!telegramSettings.enabled}
                                            type={showPassword ? 'text' : 'password'}
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
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Chat ID"
                                            value={telegramSettings.chatId}
                                            onChange={(e) => setTelegramSettings({ ...telegramSettings, chatId: e.target.value })}
                                            disabled={!telegramSettings.enabled}
                                            placeholder="e.g. 123456789"
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                <Typography variant="h6" sx={{ mb: 2 }}>Notification Types</Typography>
                                <FormGroup>
                                    <Grid container spacing={1}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={telegramSettings.notifications.newOrder} onChange={(e) => setTelegramSettings({ ...telegramSettings, notifications: { ...telegramSettings.notifications, newOrder: e.target.checked } })} />}
                                                label="New Order Notification"
                                                disabled={!telegramSettings.enabled}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={telegramSettings.notifications.orderStatus} onChange={(e) => setTelegramSettings({ ...telegramSettings, notifications: { ...telegramSettings.notifications, orderStatus: e.target.checked } })} />}
                                                label="Order Status Update"
                                                disabled={!telegramSettings.enabled}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={telegramSettings.notifications.returnRequest} onChange={(e) => setTelegramSettings({ ...telegramSettings, notifications: { ...telegramSettings.notifications, returnRequest: e.target.checked } })} />}
                                                label="Return Request"
                                                disabled={!telegramSettings.enabled}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={telegramSettings.notifications.orderCancel} onChange={(e) => setTelegramSettings({ ...telegramSettings, notifications: { ...telegramSettings.notifications, orderCancel: e.target.checked } })} />}
                                                label="Order Cancel"
                                                disabled={!telegramSettings.enabled}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={telegramSettings.notifications.newCustomer} onChange={(e) => setTelegramSettings({ ...telegramSettings, notifications: { ...telegramSettings.notifications, newCustomer: e.target.checked } })} />}
                                                label="New Customer Signup"
                                                disabled={!telegramSettings.enabled}
                                            />
                                        </Grid>
                                    </Grid>
                                </FormGroup>

                                <Box sx={{ mt: 4 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveTelegram}
                                        disabled={savingTelegram}
                                        startIcon={savingTelegram ? <CircularProgress size={20} /> : <Telegram />}
                                    >
                                        {savingTelegram ? 'Saving...' : 'Save Telegram Settings'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </TabPanel>

                {/* Admin Notification Settings Tab */}
                <TabPanel value={activeTab} index={5}>
                    <Box sx={{ p: 3, pt: 0 }}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 3 }}>Admin Email Notifications</Typography>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label="Admin Email Addresses"
                                            value={adminNotificationSettings.emails}
                                            onChange={(e) => setAdminNotificationSettings({ ...adminNotificationSettings, emails: e.target.value })}
                                            placeholder="comma-separated emails, e.g. admin1@example.com, admin2@example.com"
                                            helperText="Multiple emails should be separated by commas"
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                <Typography variant="h6" sx={{ mb: 2 }}>Notification Types</Typography>
                                <FormGroup>
                                    <FormControlLabel
                                        control={<Checkbox checked={adminNotificationSettings.notifications.emailEnabled} onChange={(e) => setAdminNotificationSettings({ ...adminNotificationSettings, notifications: { ...adminNotificationSettings.notifications, emailEnabled: e.target.checked } })} />}
                                        label="Enable Email Notifications"
                                    />
                                    <Grid container spacing={1} sx={{ mt: 1, pl: 2 }}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={adminNotificationSettings.notifications.newOrder} onChange={(e) => setAdminNotificationSettings({ ...adminNotificationSettings, notifications: { ...adminNotificationSettings.notifications, newOrder: e.target.checked } })} />}
                                                label="New Order Notification"
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={adminNotificationSettings.notifications.orderStatus} onChange={(e) => setAdminNotificationSettings({ ...adminNotificationSettings, notifications: { ...adminNotificationSettings.notifications, orderStatus: e.target.checked } })} />}
                                                label="Order Status Update"
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={adminNotificationSettings.notifications.returnRequest} onChange={(e) => setAdminNotificationSettings({ ...adminNotificationSettings, notifications: { ...adminNotificationSettings.notifications, returnRequest: e.target.checked } })} />}
                                                label="Return Request"
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={adminNotificationSettings.notifications.orderCancel} onChange={(e) => setAdminNotificationSettings({ ...adminNotificationSettings, notifications: { ...adminNotificationSettings.notifications, orderCancel: e.target.checked } })} />}
                                                label="Order Cancel"
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={adminNotificationSettings.notifications.newCustomer} onChange={(e) => setAdminNotificationSettings({ ...adminNotificationSettings, notifications: { ...adminNotificationSettings.notifications, newCustomer: e.target.checked } })} />}
                                                label="New Customer Signup"
                                            />
                                        </Grid>
                                    </Grid>
                                </FormGroup>

                                <Box sx={{ mt: 4 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveAdminNotif}
                                        disabled={savingAdminNotif}
                                        startIcon={savingAdminNotif ? <CircularProgress size={20} /> : <NotificationsActive />}
                                    >
                                        {savingAdminNotif ? 'Saving...' : 'Save Admin Notification Settings'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </TabPanel>

                {/* AI Assistant Settings Tab */}
                <TabPanel value={activeTab} index={6}>
                    <Box sx={{ p: 3, pt: 0 }}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Box>
                                        <Typography variant="h6">AI Shopping Assistant</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Enable an AI-powered chat assistant to help customers with product discovery.
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant={aiSettings.enabled ? "contained" : "outlined"}
                                        color={aiSettings.enabled ? "success" : "inherit"}
                                        onClick={() => setAiSettings({ ...aiSettings, enabled: !aiSettings.enabled })}
                                    >
                                        {aiSettings.enabled ? "Enabled" : "Disabled"}
                                    </Button>
                                </Box>

                                <Alert severity="info" sx={{ mb: 3 }}>
                                    The AI assistant uses OpenAI&apos;s GPT models to provide intelligent responses based on your product catalog.
                                    {aiSettings.enabled && !aiSettings.openaiKey && (
                                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: 'error.main' }}>
                                            Note: Assistant will be disabled on the storefront until a valid API key is provided.
                                        </Typography>
                                    )}
                                </Alert>

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="OpenAI API Key"
                                            value={aiSettings.openaiKey}
                                            onChange={(e) => setAiSettings({ ...aiSettings, openaiKey: e.target.value })}
                                            disabled={!aiSettings.enabled}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="sk-..."
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            helperText={aiSettings.openaiKey === '••••••••••••••••••••' ? 'Key is saved. Enter a new key to update.' : 'Enter your OpenAI API secret key'}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            fullWidth
                                            select
                                            label="AI Model"
                                            value={aiSettings.model || 'gpt-4o-mini'}
                                            onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                                            disabled={!aiSettings.enabled}
                                        >
                                            <MenuItem value="gpt-5.2">GPT-5.2 (Best for Coding & Agents)</MenuItem>
                                            <MenuItem value="gpt-5.2-pro">GPT-5.2 Pro (Smart & Precise)</MenuItem>
                                            <MenuItem value="gpt-5-mini">GPT-5 Mini (Fast & Cost-efficient)</MenuItem>
                                            <MenuItem value="gpt-5-nano">GPT-5 Nano (Fastest)</MenuItem>
                                            <MenuItem value="gpt-5">GPT-5 (Previous Reasoning Model)</MenuItem>
                                            <MenuItem value="o1">o1 (High-tier Reasoning)</MenuItem>
                                            <MenuItem value="o1-mini">o1-mini (Fast Reasoning)</MenuItem>
                                            <MenuItem value="o3-mini">o3-mini (Advanced Small Reasoning)</MenuItem>
                                            <MenuItem value="gpt-4o">GPT-4o (Modern Multimodal)</MenuItem>
                                            <MenuItem value="gpt-4o-mini">GPT-4o Mini</MenuItem>
                                        </TextField>
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 4 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveAI}
                                        disabled={savingAI}
                                        startIcon={savingAI ? <CircularProgress size={20} /> : <SmartToyOutlined />}
                                    >
                                        {savingAI ? 'Saving...' : 'Save AI Assistant Settings'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </TabPanel>

                {/* PWA Settings Tab */}
                <TabPanel value={activeTab} index={7}>
                    <Box sx={{ p: 3, pt: 0 }}>
                        <PWASettings
                            storeId={id}
                            initialSettings={pwaSettings}
                            onSave={handleSavePWA}
                            saving={savingPWA}
                        />
                    </Box>
                </TabPanel>

                {/* Return Settings Tab */}
                <TabPanel value={activeTab} index={8}>
                    <ReturnSettingsPanel storeId={id} />
                </TabPanel>

                {/* Cookie Consent Settings Tab */}
                <TabPanel value={activeTab} index={9}>
                    <Box sx={{ p: 3, pt: 0 }}>
                        <CookieConsentSettingsComponent
                            storeId={id}
                            initialSettings={cookieConsentSettings}
                            onSave={handleSaveCookie}
                            saving={savingCookie}
                        />
                    </Box>
                </TabPanel>

                {/* Google Merchant Settings Tab */}
                <TabPanel value={activeTab} index={10}>
                    <Box sx={{ p: 3, pt: 0 }}>
                        <GoogleMerchantSettingsComponent
                            settings={googleMerchantSettings}
                            onChange={setGoogleMerchantSettings}
                            onSave={handleSaveGMC}
                            saving={savingGMC}
                        />
                    </Box>
                </TabPanel>
            </Paper>
        </Box>
    );
}
