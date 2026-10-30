'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    CircularProgress,
    Button,
    IconButton,
    Tooltip,
    Divider,
    Alert,
    LinearProgress,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    FormControlLabel,
    Switch,
    alpha,
    useTheme,
    Paper,
    Stack,
    Badge,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import PaymentIcon from '@mui/icons-material/Payment';
import EmailIcon from '@mui/icons-material/Email';
import ChatIcon from '@mui/icons-material/Chat';
import SmsIcon from '@mui/icons-material/Sms';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import SecurityIcon from '@mui/icons-material/Security';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import CookieIcon from '@mui/icons-material/Cookie';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import KeyIcon from '@mui/icons-material/Key';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import PageHeader from '@/components/molecules/PageHeader';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import api from '@/lib/api';

interface ConfigStatusResponse {
    store: {
        _id: string;
        name: string;
        slug: string;
        domains: string[];
        currency: string;
        timezone: string;
        isActive: boolean;
        logo?: string;
        createdAt: string;
    };
    overview: {
        configuredCount: number;
        totalChecks: number;
        healthScore: number;
        activeGatewaysCount: number;
        totalGatewaysCount: number;
        shippingRulesCount: number;
        activeShippingRulesCount: number;
        apiKeysCount: number;
        activeApiKeysCount: number;
    };
    ai: {
        storeAi: {
            enabled: boolean;
            model: string;
            hasKey: boolean;
            tokenLast3: string | null;
        };
        adminAi: {
            enabled: boolean;
            model: string;
            hasKey: boolean;
            tokenLast3: string | null;
        };
    };
    telegram: {
        enabled: boolean;
        hasBotToken: boolean;
        botTokenLast3: string | null;
        hasChatId: boolean;
        chatIdLast3: string | null;
        notifications: {
            newOrder: boolean;
            orderStatus: boolean;
            returnRequest: boolean;
            orderCancel: boolean;
            newCustomer: boolean;
        };
    };
    paymentGateways: {
        total: number;
        active: number;
        testMode: number;
        live: number;
        list: Array<{
            _id: string;
            gatewayType: string;
            gatewayName: string;
            displayName: string;
            isActive: boolean;
            isTestMode: boolean;
            priority: number;
            features: {
                supportsRefund?: boolean;
                supportsPartialRefund?: boolean;
                supportedCurrencies?: string[];
            };
            currencies: string[];
            credentials: Record<string, any>;
            hasCredentials: boolean;
        }>;
    };
    email: {
        configured: boolean;
        provider: string;
        fromEmail: string;
        fromName: string;
        replyTo: string;
        rateLimit: number;
        smtp: {
            host: string;
            port: number;
            secure: boolean;
            user: string;
            hasPassword: boolean;
            passwordLast3: string | null;
        };
    };
    whatsapp: {
        enabled: boolean;
        provider: string;
        meta?: {
            phoneNumberId: string | null;
            hasAccessToken: boolean;
            accessTokenLast3: string | null;
            businessAccountId: string | null;
        };
        twilio?: {
            accountSid: string | null;
            hasAuthToken: boolean;
            authTokenLast3: string | null;
            fromWhatsAppNumber: string;
        };
        d7networks?: {
            hasToken: boolean;
            tokenLast3: string | null;
            originator: string;
        };
    };
    sms: {
        enabled: boolean;
        provider: string;
        twilio?: {
            accountSid: string | null;
            hasAuthToken: boolean;
            authTokenLast3: string | null;
            fromNumber: string;
        };
    };
    adminNotifications: {
        emailEnabled: boolean;
        emails: string;
        notifications: {
            emailEnabled?: boolean;
            newOrder?: boolean;
            orderStatus?: boolean;
            returnRequest?: boolean;
            orderCancel?: boolean;
            newCustomer?: boolean;
        };
    };
    socialLogin: {
        google: {
            enabled: boolean;
            clientIdLast3: string | null;
            hasSecret: boolean;
            clientSecretLast3: string | null;
        };
        facebook: {
            enabled: boolean;
            clientIdLast3: string | null;
            hasSecret: boolean;
            clientSecretLast3: string | null;
        };
    };
    googleAnalytics: {
        enabled: boolean;
        trackingIdLast3: string | null;
    };
    googleMerchant: {
        enabled: boolean;
        merchantIdLast3: string | null;
        hasServiceAccountKey: boolean;
        serviceAccountKeyLast3: string | null;
        autoSync: boolean;
        syncFrequency: string;
        targetCountries: string[];
        lastSyncedAt: string | null;
    };
    pwa: {
        enabled: boolean;
        appName: string;
        appShortName: string;
        themeColor: string;
        installPromptStyle: string;
    };
    cookieConsent: {
        enabled: boolean;
        title: string;
        position: string;
        ctaText: string;
    };
    general: {
        maintenanceMode: boolean;
        allowCustomerLogin: boolean;
        allowCustomerSignup: boolean;
        allowGuestCheckout: boolean;
        requireEmailVerification: boolean;
        shippingEnabled: boolean;
    };
}

/**
 * Token pill component that renders sanitized secret highlighting the last 3 characters.
 */
function SanitizedTokenDisplay({
    token,
    label,
    emptyText = 'Not configured',
}: {
    token: string | null | undefined;
    label?: string;
    emptyText?: string;
}) {
    const { showNotification } = useNotification();
    const [copied, setCopied] = useState(false);

    if (!token) {
        return (
            <Chip
                label={emptyText}
                size="small"
                variant="outlined"
                sx={{
                    color: 'text.secondary',
                    borderColor: 'divider',
                    fontStyle: 'italic',
                    fontSize: '0.75rem',
                }}
            />
        );
    }

    // Token format is usually "••••••••••••xyz"
    const isMasked = token.includes('•••');
    const maskPart = isMasked ? token.replace(/(.{3})$/, '') : '';
    const visiblePart = isMasked ? token.slice(-3) : token;

    const handleCopy = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(token);
            setCopied(true);
            showNotification('Sanitized token preview copied to clipboard', 'info');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                borderRadius: 1.5,
                px: 1,
                py: 0.25,
                gap: 0.75,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
            }}
        >
            {label && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {label}:
                </Typography>
            )}
            <Box component="span" sx={{ letterSpacing: 1, color: 'text.secondary' }}>
                {maskPart}
            </Box>
            <Box
                component="span"
                sx={{
                    color: 'primary.main',
                    fontWeight: 700,
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                    px: 0.5,
                    py: 0.1,
                    borderRadius: 0.5,
                }}
            >
                {visiblePart}
            </Box>
            <Tooltip title={copied ? 'Copied!' : 'Copy sanitized token'}>
                <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25, ml: 0.25 }}>
                    <ContentCopyIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
}

/**
 * Status Chip indicator (Enabled / Disabled / Configured)
 */
function StatusChip({
    active,
    activeText = 'Active',
    inactiveText = 'Disabled',
    size = 'small',
}: {
    active: boolean;
    activeText?: string;
    inactiveText?: string;
    size?: 'small' | 'medium';
}) {
    return (
        <Chip
            size={size}
            icon={
                active ? (
                    <CheckCircleIcon sx={{ fontSize: '14px !important' }} />
                ) : (
                    <CancelIcon sx={{ fontSize: '14px !important' }} />
                )
            }
            label={active ? activeText : inactiveText}
            color={active ? 'success' : 'default'}
            variant={active ? 'filled' : 'outlined'}
            sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
            }}
        />
    );
}

/**
 * Metric Card for top executive overview
 */
function MetricOverviewCard({
    title,
    value,
    subtitle,
    icon,
    color,
    badge,
}: {
    title: string;
    value: React.ReactNode;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
}) {
    return (
        <Card
            sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: (theme) =>
                    `0 2px 8px ${alpha(color, 0.08)}`,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    borderColor: alpha(color, 0.5),
                    boxShadow: `0 4px 16px ${alpha(color, 0.15)}`,
                },
                transition: 'all 0.2s ease',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 4,
                    height: '100%',
                    backgroundColor: color,
                }}
            />
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase">
                    {title}
                </Typography>
                <Box
                    sx={{
                        p: 0.8,
                        borderRadius: 1.5,
                        backgroundColor: alpha(color, 0.12),
                        color: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {icon}
                </Box>
            </Box>
            <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5 }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                    {subtitle}
                </Typography>
            </Box>
            {badge && (
                <Box mt={1}>
                    <Chip
                        label={badge}
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            backgroundColor: alpha(color, 0.1),
                            color: color,
                        }}
                    />
                </Box>
            )}
        </Card>
    );
}

export default function StoreConfigStatusPage() {
    const router = useRouter();
    const theme = useTheme();
    const { user, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();

    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [data, setData] = useState<ConfigStatusResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showOnlyConfigured, setShowOnlyConfigured] = useState<boolean>(false);

    // Auth gate: admin, store_admin, super_admin
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Fetch config status
    const fetchConfigStatus = useCallback(
        async (storeId?: string, isManualRefresh = false) => {
            if (isManualRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const url = storeId
                    ? `/settings/config-status?storeId=${encodeURIComponent(storeId)}`
                    : '/settings/config-status';

                const response = await api.get(url);
                if (response.data?.success && response.data?.data) {
                    setData(response.data.data);
                    if (!selectedStoreId && response.data.data.store?._id) {
                        setSelectedStoreId(response.data.data.store._id);
                    }
                }
            } catch (err: any) {
                console.error('Failed to load store configuration status:', err);
                showNotification(
                    err.response?.data?.message || err.message || 'Failed to load configuration status',
                    'error'
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [selectedStoreId, showNotification]
    );

    // Initial load
    useEffect(() => {
        fetchConfigStatus();
    }, [fetchConfigStatus]);

    // When store selection changes
    const handleStoreChange = (newStoreId: string | string[] | null) => {
        if (typeof newStoreId === 'string' && newStoreId && newStoreId !== selectedStoreId) {
            setSelectedStoreId(newStoreId);
            fetchConfigStatus(newStoreId, false);
        }
    };

    const handleRefresh = () => {
        fetchConfigStatus(selectedStoreId, true);
    };

    // Category Tabs list
    const categories = [
        { label: 'All Services', icon: <FactCheckIcon sx={{ fontSize: 18 }} /> },
        { label: 'AI & Automation', icon: <SmartToyIcon sx={{ fontSize: 18 }} /> },
        { label: 'Telegram Alerts', icon: <SendIcon sx={{ fontSize: 18 }} /> },
        { label: 'Payment Gateways', icon: <PaymentIcon sx={{ fontSize: 18 }} /> },
        { label: 'Communications', icon: <EmailIcon sx={{ fontSize: 18 }} /> },
        { label: 'Third-Party & Marketing', icon: <AnalyticsIcon sx={{ fontSize: 18 }} /> },
        { label: 'Storefront & Rules', icon: <StorefrontIcon sx={{ fontSize: 18 }} /> },
    ];

    // Filter helper for search query and showOnlyConfigured toggle
    const matchesSearch = (text: string) => {
        if (!searchQuery.trim()) return true;
        return text.toLowerCase().includes(searchQuery.toLowerCase().trim());
    };

    if (loading && !data) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="60vh">
                <CircularProgress size={44} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                    Auditing store configuration status...
                </Typography>
            </Box>
        );
    }

    if (!data) {
        return (
            <Box p={3}>
                <Alert severity="warning">
                    No store data available. Please verify that at least one store is configured.
                </Alert>
            </Box>
        );
    }

    const {
        store,
        overview,
        ai,
        telegram,
        paymentGateways,
        email,
        whatsapp,
        sms,
        adminNotifications,
        socialLogin,
        googleAnalytics,
        googleMerchant,
        pwa,
        cookieConsent,
        general,
    } = data;

    // Determine health score color
    const getHealthColor = (score: number) => {
        if (score >= 80) return theme.palette.success.main;
        if (score >= 50) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    const healthColor = getHealthColor(overview.healthScore);

    return (
        <Box>
            {/* Top Page Header */}
            <PageHeader
                title="Configuration Status"
                subtitle="Live read-only audit of AI setup, Telegram alerts, payment gateways, and sanitized secrets for each store."
                backUrl="/settings"
                action={
                    <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                        {/* Store Autocomplete Selector */}
                        <Box sx={{ minWidth: 260 }}>
                            <StoreAutocomplete
                                value={selectedStoreId}
                                onChange={handleStoreChange}
                                label="Active Store"
                                minimal
                            />
                        </Box>

                        {/* Edit Store Link */}
                        <Button
                            component={Link}
                            href={`/stores/${store._id}/edit`}
                            variant="outlined"
                            size="medium"
                            startIcon={<OpenInNewIcon />}
                            sx={{ height: 40 }}
                        >
                            Edit Store
                        </Button>

                        {/* Refresh Button */}
                        <Tooltip title="Refresh Status">
                            <IconButton
                                onClick={handleRefresh}
                                disabled={refreshing}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    height: 40,
                                    width: 40,
                                    borderRadius: 1.5,
                                }}
                            >
                                <RefreshIcon
                                    sx={{
                                        animation: refreshing ? 'spin 1s linear infinite' : 'none',
                                        '@keyframes spin': {
                                            '0%': { transform: 'rotate(0deg)' },
                                            '100%': { transform: 'rotate(360deg)' },
                                        },
                                    }}
                                />
                            </IconButton>
                        </Tooltip>
                    </Box>
                }
            />

            {/* Store Banner & Quick Stats */}
            <Card
                sx={{
                    mb: 3,
                    p: 2.5,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: (theme) =>
                        `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
                            theme.palette.primary.main,
                            0.03
                        )} 100%)`,
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap" mb={1}>
                            <Typography variant="h5" fontWeight={800} color="text.primary">
                                {store.name}
                            </Typography>
                            <StatusChip
                                active={store.isActive}
                                activeText="Store Active"
                                inactiveText="Store Inactive"
                            />
                            {general.maintenanceMode && (
                                <Chip
                                    label="Maintenance Mode ON"
                                    color="warning"
                                    size="small"
                                    icon={<WarningAmberIcon />}
                                    sx={{ fontWeight: 700 }}
                                />
                            )}
                        </Box>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Domains:
                            </Typography>
                            {store.domains && store.domains.length > 0 ? (
                                store.domains.map((dom) => (
                                    <Chip
                                        key={dom}
                                        label={dom}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                                    />
                                ))
                            ) : (
                                <Chip label="No domains linked" size="small" variant="outlined" />
                            )}
                            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 16 }} />
                            <Typography variant="caption" color="text.secondary">
                                Currency: <strong>{store.currency || 'USD'}</strong>
                            </Typography>
                            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 16 }} />
                            <Typography variant="caption" color="text.secondary">
                                Timezone: <strong>{store.timezone || 'UTC'}</strong>
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: alpha(healthColor, 0.08),
                                border: '1px solid',
                                borderColor: alpha(healthColor, 0.25),
                            }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: healthColor }}>
                                    Integration Health Score
                                </Typography>
                                <Typography variant="h6" fontWeight={800} sx={{ color: healthColor }}>
                                    {overview.healthScore}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={overview.healthScore}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: alpha(healthColor, 0.2),
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: healthColor,
                                        borderRadius: 4,
                                    },
                                }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {overview.configuredCount} of {overview.totalChecks} core services configured
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Card>

            {/* Executive Metric Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricOverviewCard
                        title="Payment Gateways"
                        value={`${overview.activeGatewaysCount} / ${overview.totalGatewaysCount}`}
                        subtitle={
                            overview.activeGatewaysCount > 0
                                ? `${paymentGateways.live} Live, ${paymentGateways.testMode} Test`
                                : 'No active gateways'
                        }
                        icon={<PaymentIcon />}
                        color={theme.palette.success.main}
                        badge={paymentGateways.active > 0 ? 'Accepting Payments' : 'Attention Needed'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricOverviewCard
                        title="AI Assistant"
                        value={ai.storeAi.enabled ? 'Enabled' : 'Disabled'}
                        subtitle={
                            ai.storeAi.enabled
                                ? `Model: ${ai.storeAi.model}`
                                : 'Not active for store customers'
                        }
                        icon={<SmartToyIcon />}
                        color={theme.palette.primary.main}
                        badge={ai.storeAi.hasKey ? 'OpenAI API Key Set' : 'Missing Key'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricOverviewCard
                        title="Telegram Notifications"
                        value={telegram.enabled ? 'Enabled' : 'Disabled'}
                        subtitle={
                            telegram.enabled
                                ? 'Bot & Chat linked'
                                : 'Instant admin alerts turned off'
                        }
                        icon={<SendIcon />}
                        color="#0284c7"
                        badge={telegram.hasBotToken ? 'Bot Token Set' : 'No Token'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricOverviewCard
                        title="Shipping & API Keys"
                        value={`${overview.activeShippingRulesCount} Rules`}
                        subtitle={`${overview.activeApiKeysCount} active API keys for this store`}
                        icon={<LocalShippingIcon />}
                        color="#8b5cf6"
                        badge={overview.shippingRulesCount > 0 ? 'Shipping Configured' : 'No Shipping'}
                    />
                </Grid>
            </Grid>

            {/* Filter and Tab Bar */}
            <Paper
                elevation={0}
                sx={{
                    mb: 3,
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', md: 'center' },
                    gap: 2,
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(_, val) => setActiveTab(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 40,
                        '& .MuiTab-root': {
                            minHeight: 40,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            py: 0.5,
                        },
                    }}
                >
                    {categories.map((cat, idx) => (
                        <Tab key={cat.label} label={cat.label} icon={cat.icon} iconPosition="start" />
                    ))}
                </Tabs>

                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <TextField
                        size="small"
                        placeholder="Search configs or tokens..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: { xs: '100%', sm: 220 } }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={showOnlyConfigured}
                                onChange={(e) => setShowOnlyConfigured(e.target.checked)}
                            />
                        }
                        label={
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                Active only
                            </Typography>
                        }
                    />
                </Box>
            </Paper>

            {/* Content Sections */}
            <Stack spacing={3}>
                {/* 1. AI Configuration Section */}
                {(activeTab === 0 || activeTab === 1) &&
                    (!showOnlyConfigured || ai.storeAi.enabled || ai.adminAi.enabled) &&
                    (matchesSearch('ai') ||
                        matchesSearch('openai') ||
                        matchesSearch('gpt') ||
                        matchesSearch('assistant')) && (
                        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03),
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1.2}>
                                    <SmartToyIcon color="primary" />
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            AI Assistant Setup
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            OpenAI configurations for store customer assistant and global admin tools
                                        </Typography>
                                    </Box>
                                </Box>
                                <StatusChip active={ai.storeAi.enabled} />
                            </Box>
                            <CardContent sx={{ p: 2.5 }}>
                                <Grid container spacing={2.5}>
                                    {/* Store AI */}
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Paper
                                            variant="outlined"
                                            sx={{ p: 2, borderRadius: 2, height: '100%' }}
                                        >
                                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    Store Customer AI
                                                </Typography>
                                                <StatusChip active={ai.storeAi.enabled} />
                                            </Box>
                                            <Stack spacing={1.5}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Model:
                                                    </Typography>
                                                    <Chip
                                                        label={ai.storeAi.model}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 600, fontFamily: 'monospace' }}
                                                    />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" color="text.secondary">
                                                        API Key (OpenAI):
                                                    </Typography>
                                                    <SanitizedTokenDisplay
                                                        token={ai.storeAi.tokenLast3}
                                                        emptyText="No API Key Set"
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                                    * Sanitized token displays last 3 characters for verification.
                                                </Typography>
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    {/* Admin AI */}
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Paper
                                            variant="outlined"
                                            sx={{ p: 2, borderRadius: 2, height: '100%' }}
                                        >
                                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    Global Admin AI Assistant
                                                </Typography>
                                                <StatusChip active={ai.adminAi.enabled} />
                                            </Box>
                                            <Stack spacing={1.5}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Model:
                                                    </Typography>
                                                    <Chip
                                                        label={ai.adminAi.model}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 600, fontFamily: 'monospace' }}
                                                    />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" color="text.secondary">
                                                        API Key (Admin):
                                                    </Typography>
                                                    <SanitizedTokenDisplay
                                                        token={ai.adminAi.tokenLast3}
                                                        emptyText="No API Key Set"
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                                    * Global admin AI used for catalog generation and admin queries.
                                                </Typography>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                {/* 2. Telegram Notifications Section */}
                {(activeTab === 0 || activeTab === 2) &&
                    (!showOnlyConfigured || telegram.enabled) &&
                    (matchesSearch('telegram') ||
                        matchesSearch('bot') ||
                        matchesSearch('chat') ||
                        matchesSearch('alert')) && (
                        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: (theme) => alpha('#0284c7', 0.04),
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1.2}>
                                    <SendIcon sx={{ color: '#0284c7' }} />
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            Telegram Bot & Alerts
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Instant notifications for new orders, returns, and customer signups
                                        </Typography>
                                    </Box>
                                </Box>
                                <StatusChip active={telegram.enabled} />
                            </Box>
                            <CardContent sx={{ p: 2.5 }}>
                                <Grid container spacing={2.5}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                                                Credentials & Target
                                            </Typography>
                                            <Stack spacing={1.5}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Bot Token:
                                                    </Typography>
                                                    <SanitizedTokenDisplay
                                                        token={telegram.botTokenLast3}
                                                        emptyText="No Bot Token"
                                                    />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Chat ID:
                                                    </Typography>
                                                    <SanitizedTokenDisplay
                                                        token={telegram.chatIdLast3}
                                                        emptyText="No Chat ID"
                                                    />
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                                                Active Alert Subscriptions
                                            </Typography>
                                            <Box display="flex" gap={1} flexWrap="wrap">
                                                <Chip
                                                    label="New Order"
                                                    size="small"
                                                    color={telegram.notifications.newOrder ? 'success' : 'default'}
                                                    variant={telegram.notifications.newOrder ? 'filled' : 'outlined'}
                                                />
                                                <Chip
                                                    label="Order Status"
                                                    size="small"
                                                    color={telegram.notifications.orderStatus ? 'success' : 'default'}
                                                    variant={telegram.notifications.orderStatus ? 'filled' : 'outlined'}
                                                />
                                                <Chip
                                                    label="Return Request"
                                                    size="small"
                                                    color={telegram.notifications.returnRequest ? 'success' : 'default'}
                                                    variant={telegram.notifications.returnRequest ? 'filled' : 'outlined'}
                                                />
                                                <Chip
                                                    label="Order Cancel"
                                                    size="small"
                                                    color={telegram.notifications.orderCancel ? 'success' : 'default'}
                                                    variant={telegram.notifications.orderCancel ? 'filled' : 'outlined'}
                                                />
                                                <Chip
                                                    label="New Customer"
                                                    size="small"
                                                    color={telegram.notifications.newCustomer ? 'success' : 'default'}
                                                    variant={telegram.notifications.newCustomer ? 'filled' : 'outlined'}
                                                />
                                            </Box>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                {/* 3. Payment Gateways Section */}
                {(activeTab === 0 || activeTab === 3) &&
                    (matchesSearch('payment') ||
                        matchesSearch('gateway') ||
                        matchesSearch('razorpay') ||
                        matchesSearch('stripe') ||
                        matchesSearch('paypal') ||
                        matchesSearch('cod')) && (
                        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: (theme) => alpha(theme.palette.success.main, 0.04),
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1.2}>
                                    <PaymentIcon color="success" />
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            Payment Gateways Setup ({paymentGateways.active} Active / {paymentGateways.total} Total)
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Configured payment processors, test/live status, and sanitized keys
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" gap={1}>
                                    <Chip
                                        label={`${paymentGateways.live} Live`}
                                        size="small"
                                        color={paymentGateways.live > 0 ? 'success' : 'default'}
                                    />
                                    <Chip
                                        label={`${paymentGateways.testMode} Test`}
                                        size="small"
                                        color={paymentGateways.testMode > 0 ? 'warning' : 'default'}
                                    />
                                </Box>
                            </Box>
                            <CardContent sx={{ p: 2.5 }}>
                                {paymentGateways.list.length === 0 ? (
                                    <Box textAlign="center" py={4}>
                                        <PaymentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                                        <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
                                            No payment gateways configured for this store
                                        </Typography>
                                        <Button
                                            component={Link}
                                            href="/payment-gateways"
                                            variant="contained"
                                            size="small"
                                            sx={{ mt: 2 }}
                                        >
                                            Configure Payment Gateways
                                        </Button>
                                    </Box>
                                ) : (
                                    <Grid container spacing={2.5}>
                                        {paymentGateways.list
                                            .filter((g) => (!showOnlyConfigured ? true : g.isActive))
                                            .filter(
                                                (g) =>
                                                    matchesSearch(g.gatewayName) ||
                                                    matchesSearch(g.gatewayType) ||
                                                    matchesSearch(g.displayName)
                                            )
                                            .map((gateway) => (
                                                <Grid size={{ xs: 12, md: 6 }} key={gateway._id}>
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: 2,
                                                            height: '100%',
                                                            borderLeft: '4px solid',
                                                            borderLeftColor: gateway.isActive
                                                                ? gateway.isTestMode
                                                                    ? 'warning.main'
                                                                    : 'success.main'
                                                                : 'text.disabled',
                                                        }}
                                                    >
                                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                                            <Box>
                                                                <Typography variant="subtitle1" fontWeight={700}>
                                                                    {gateway.displayName || gateway.gatewayName}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                                                                    Type: {gateway.gatewayType} | Priority: {gateway.priority}
                                                                </Typography>
                                                            </Box>
                                                            <Box display="flex" gap={0.5}>
                                                                <StatusChip active={gateway.isActive} />
                                                                {gateway.isActive && (
                                                                    <Chip
                                                                        label={gateway.isTestMode ? 'Test Mode' : 'Live Mode'}
                                                                        size="small"
                                                                        color={gateway.isTestMode ? 'warning' : 'success'}
                                                                        variant="outlined"
                                                                        sx={{ fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Box>

                                                        {/* Currencies */}
                                                        {gateway.currencies && gateway.currencies.length > 0 && (
                                                            <Box display="flex" gap={0.5} flexWrap="wrap" mb={1.5}>
                                                                <Typography variant="caption" color="text.secondary" fontWeight={600} mr={0.5}>
                                                                    Currencies:
                                                                </Typography>
                                                                {gateway.currencies.map((curr) => (
                                                                    <Chip
                                                                        key={curr}
                                                                        label={curr}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ height: 20, fontSize: '0.65rem' }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        )}

                                                        <Divider sx={{ my: 1 }} />

                                                        {/* Credentials */}
                                                        <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">
                                                            Sanitized Credentials:
                                                        </Typography>
                                                        <Stack spacing={1}>
                                                            {typeof gateway.credentials === 'string' ? (
                                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        API Key / Token:
                                                                    </Typography>
                                                                    <SanitizedTokenDisplay token={gateway.credentials} />
                                                                </Box>
                                                            ) : typeof gateway.credentials === 'object' &&
                                                              gateway.credentials !== null &&
                                                              Object.keys(gateway.credentials).length > 0 ? (
                                                                Object.entries(gateway.credentials)
                                                                    .filter(([k]) => isNaN(Number(k)))
                                                                    .map(([k, v]) => {
                                                                        const labelMap: Record<string, string> = {
                                                                            keyId: 'Key ID',
                                                                            keySecret: 'Key Secret',
                                                                            publishableKey: 'Publishable Key',
                                                                            secretKey: 'Secret Key',
                                                                            webhookSecret: 'Webhook Secret',
                                                                            clientId: 'Client ID',
                                                                            clientSecret: 'Client Secret',
                                                                            apiKey: 'API Key',
                                                                            mode: 'Mode',
                                                                        };
                                                                        const displayKey = labelMap[k] || k;
                                                                        return (
                                                                            <Box
                                                                                key={k}
                                                                                display="flex"
                                                                                justifyContent="space-between"
                                                                                alignItems="center"
                                                                            >
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    {displayKey}:
                                                                                </Typography>
                                                                                {typeof v === 'string' ? (
                                                                                    <SanitizedTokenDisplay token={v} />
                                                                                ) : (
                                                                                    <Typography variant="caption" fontFamily="monospace">
                                                                                        {String(v)}
                                                                                    </Typography>
                                                                                )}
                                                                            </Box>
                                                                        );
                                                                    })
                                                            ) : (
                                                                <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                                                    No specific credentials required (e.g. COD)
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                    </Grid>
                                )}
                            </CardContent>
                        </Card>
                    )}

                {/* 4. Communications Section (Email, WhatsApp, SMS, Admin Alerts) */}
                {(activeTab === 0 || activeTab === 4) &&
                    (matchesSearch('email') ||
                        matchesSearch('smtp') ||
                        matchesSearch('whatsapp') ||
                        matchesSearch('sms') ||
                        matchesSearch('twilio')) && (
                        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: (theme) => alpha('#f59e0b', 0.04),
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1.2}>
                                    <EmailIcon sx={{ color: '#f59e0b' }} />
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            Communication Channels (Email, WhatsApp, SMS)
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Outbound messaging, SMTP credentials, and admin alert distribution
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" gap={1}>
                                    <StatusChip
                                        active={email.configured}
                                        activeText="Email Ready"
                                        inactiveText="No SMTP"
                                    />
                                    <StatusChip
                                        active={whatsapp.enabled}
                                        activeText="WhatsApp On"
                                        inactiveText="WhatsApp Off"
                                    />
                                    <StatusChip
                                        active={sms.enabled}
                                        activeText="SMS On"
                                        inactiveText="SMS Off"
                                    />
                                </Box>
                            </Box>
                            <CardContent sx={{ p: 2.5 }}>
                                <Grid container spacing={2.5}>
                                    {/* Email / SMTP */}
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    Email (SMTP)
                                                </Typography>
                                                <StatusChip active={email.configured} />
                                            </Box>
                                            <Stack spacing={1.2}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Provider:
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={600}>
                                                        {email.provider.toUpperCase()}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        From Email / Name:
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={600}>
                                                        {email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail || 'Not set'}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        SMTP Host & Port:
                                                    </Typography>
                                                    <Typography variant="caption" fontFamily="monospace">
                                                        {email.smtp.host ? `${email.smtp.host}:${email.smtp.port}` : 'Not set'}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="caption" color="text.secondary">
                                                        SMTP Password:
                                                    </Typography>
                                                    <SanitizedTokenDisplay
                                                        token={email.smtp.passwordLast3}
                                                        emptyText="No Password"
                                                    />
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    {/* WhatsApp */}
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    WhatsApp Messaging
                                                </Typography>
                                                <StatusChip active={whatsapp.enabled} />
                                            </Box>
                                            <Stack spacing={1.2}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Provider:
                                                    </Typography>
                                                    <Chip
                                                        label={whatsapp.provider.toUpperCase()}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 600, height: 20 }}
                                                    />
                                                </Box>
                                                {whatsapp.provider === 'meta' && whatsapp.meta && (
                                                    <>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="caption" color="text.secondary">
                                                                Phone Number ID:
                                                            </Typography>
                                                            <SanitizedTokenDisplay token={whatsapp.meta.phoneNumberId} />
                                                        </Box>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="caption" color="text.secondary">
                                                                Access Token:
                                                            </Typography>
                                                            <SanitizedTokenDisplay token={whatsapp.meta.accessTokenLast3} />
                                                        </Box>
                                                    </>
                                                )}
                                                {whatsapp.provider === 'twilio' && whatsapp.twilio && (
                                                    <>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="caption" color="text.secondary">
                                                                Twilio Account SID:
                                                            </Typography>
                                                            <SanitizedTokenDisplay token={whatsapp.twilio.accountSid} />
                                                        </Box>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="caption" color="text.secondary">
                                                                Twilio Auth Token:
                                                            </Typography>
                                                            <SanitizedTokenDisplay token={whatsapp.twilio.authTokenLast3} />
                                                        </Box>
                                                    </>
                                                )}
                                                {whatsapp.provider === 'd7networks' && whatsapp.d7networks && (
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="caption" color="text.secondary">
                                                            D7 Token:
                                                        </Typography>
                                                        <SanitizedTokenDisplay token={whatsapp.d7networks.tokenLast3} />
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    {/* SMS */}
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    SMS (Twilio)
                                                </Typography>
                                                <StatusChip active={sms.enabled} />
                                            </Box>
                                            <Stack spacing={1.2}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Twilio SID:
                                                    </Typography>
                                                    <SanitizedTokenDisplay token={sms.twilio?.accountSid} />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Twilio Auth Token:
                                                    </Typography>
                                                    <SanitizedTokenDisplay token={sms.twilio?.authTokenLast3} />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        From Phone Number:
                                                    </Typography>
                                                    <Typography variant="caption" fontFamily="monospace">
                                                        {sms.twilio?.fromNumber || 'Not configured'}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    {/* Admin Email Notifications */}
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    Admin Email Alert Recipients
                                                </Typography>
                                                <StatusChip active={adminNotifications.emailEnabled} />
                                            </Box>
                                            <Stack spacing={1.2}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Recipients:
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={600} sx={{ maxWidth: '65%', wordBreak: 'break-all' }}>
                                                        {adminNotifications.emails || 'No recipient emails specified'}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                                                    <Chip
                                                        label="New Order"
                                                        size="small"
                                                        color={adminNotifications.notifications.newOrder ? 'success' : 'default'}
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        label="Return"
                                                        size="small"
                                                        color={adminNotifications.notifications.returnRequest ? 'success' : 'default'}
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        label="Cancel"
                                                        size="small"
                                                        color={adminNotifications.notifications.orderCancel ? 'success' : 'default'}
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        label="Customer"
                                                        size="small"
                                                        color={adminNotifications.notifications.newCustomer ? 'success' : 'default'}
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                {/* 5. Third-Party & Marketing (Social Login, Google Analytics, Google Merchant) */}
                {(activeTab === 0 || activeTab === 5) &&
                    (matchesSearch('google') ||
                        matchesSearch('facebook') ||
                        matchesSearch('analytics') ||
                        matchesSearch('merchant') ||
                        matchesSearch('social')) && (
                        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: (theme) => alpha('#ec4899', 0.04),
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1.2}>
                                    <AnalyticsIcon sx={{ color: '#ec4899' }} />
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            Third-Party & Marketing Integrations
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Social logins, Google Merchant catalog feeds, and Google Analytics
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" gap={1}>
                                    <StatusChip
                                        active={googleAnalytics.enabled}
                                        activeText="GA Active"
                                        inactiveText="No GA"
                                    />
                                    <StatusChip
                                        active={googleMerchant.enabled}
                                        activeText="Merchant Active"
                                        inactiveText="Merchant Off"
                                    />
                                </Box>
                            </Box>
                            <CardContent sx={{ p: 2.5 }}>
                                <Grid container spacing={2.5}>
                                    {/* Google Analytics */}
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    Google Analytics
                                                </Typography>
                                                <StatusChip active={googleAnalytics.enabled} />
                                            </Box>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="caption" color="text.secondary">
                                                    Measurement ID:
                                                </Typography>
                                                <SanitizedTokenDisplay
                                                    token={googleAnalytics.trackingIdLast3}
                                                    emptyText="Not set"
                                                />
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Google Merchant Center */}
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    Google Merchant
                                                </Typography>
                                                <StatusChip active={googleMerchant.enabled} />
                                            </Box>
                                            <Stack spacing={1.2}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Merchant ID:
                                                    </Typography>
                                                    <SanitizedTokenDisplay token={googleMerchant.merchantIdLast3} />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Service Account:
                                                    </Typography>
                                                    <SanitizedTokenDisplay token={googleMerchant.serviceAccountKeyLast3} />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Auto-Sync:
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={600}>
                                                        {googleMerchant.autoSync ? `Yes (${googleMerchant.syncFrequency})` : 'Manual'}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    {/* Social Logins */}
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                            <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                                                Social Authentication
                                            </Typography>
                                            <Stack spacing={1.5}>
                                                <Box>
                                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                        <Typography variant="caption" fontWeight={700}>
                                                            Google Login:
                                                        </Typography>
                                                        <StatusChip active={socialLogin.google.enabled} />
                                                    </Box>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="caption" color="text.secondary">
                                                            Client Secret:
                                                        </Typography>
                                                        <SanitizedTokenDisplay token={socialLogin.google.clientSecretLast3} />
                                                    </Box>
                                                </Box>
                                                <Divider />
                                                <Box>
                                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                        <Typography variant="caption" fontWeight={700}>
                                                            Facebook Login:
                                                        </Typography>
                                                        <StatusChip active={socialLogin.facebook.enabled} />
                                                    </Box>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="caption" color="text.secondary">
                                                            App Secret:
                                                        </Typography>
                                                        <SanitizedTokenDisplay token={socialLogin.facebook.clientSecretLast3} />
                                                    </Box>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                {/* 6. Storefront & System Rules */}
                {(activeTab === 0 || activeTab === 6) &&
                    (matchesSearch('pwa') ||
                        matchesSearch('cookie') ||
                        matchesSearch('shipping') ||
                        matchesSearch('key') ||
                        matchesSearch('rules')) && (
                        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: (theme) => alpha('#8b5cf6', 0.04),
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1.2}>
                                    <StorefrontIcon sx={{ color: '#8b5cf6' }} />
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            Storefront, PWA & Security Rules
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Mobile PWA installation, cookie consent, shipping status, and API keys
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" gap={1}>
                                    <StatusChip active={pwa.enabled} activeText="PWA Active" inactiveText="PWA Off" />
                                    <StatusChip active={cookieConsent.enabled} activeText="Cookies On" inactiveText="Cookies Off" />
                                </Box>
                            </Box>
                            <CardContent sx={{ p: 2.5 }}>
                                <Grid container spacing={2.5}>
                                    {/* PWA Settings */}
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    Progressive Web App (PWA)
                                                </Typography>
                                                <StatusChip active={pwa.enabled} />
                                            </Box>
                                            <Stack spacing={1.2}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        App Name:
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={600}>
                                                        {pwa.appName || 'Not configured'}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Theme Color:
                                                    </Typography>
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        {pwa.themeColor && (
                                                            <Box
                                                                sx={{
                                                                    width: 12,
                                                                    height: 12,
                                                                    borderRadius: '50%',
                                                                    backgroundColor: pwa.themeColor,
                                                                    border: '1px solid #ccc',
                                                                }}
                                                            />
                                                        )}
                                                        <Typography variant="caption" fontFamily="monospace">
                                                            {pwa.themeColor || 'Default'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    {/* Shipping & API Keys */}
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                            <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                                                Shipping & API Access
                                            </Typography>
                                            <Stack spacing={1.2}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Shipping Rules:
                                                    </Typography>
                                                    <Chip
                                                        label={`${overview.activeShippingRulesCount} Active / ${overview.shippingRulesCount} Total`}
                                                        size="small"
                                                        color={overview.activeShippingRulesCount > 0 ? 'success' : 'default'}
                                                        sx={{ height: 20 }}
                                                    />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        API Keys (Store Scoped):
                                                    </Typography>
                                                    <Chip
                                                        label={`${overview.activeApiKeysCount} Active / ${overview.apiKeysCount} Total`}
                                                        size="small"
                                                        color={overview.activeApiKeysCount > 0 ? 'primary' : 'default'}
                                                        sx={{ height: 20 }}
                                                    />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Shipping Calculation:
                                                    </Typography>
                                                    <StatusChip
                                                        active={general.shippingEnabled}
                                                        activeText="Enabled"
                                                        inactiveText="Disabled"
                                                    />
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    {/* General Store Flags */}
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                            <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                                                Checkout & Customer Auth
                                            </Typography>
                                            <Stack spacing={1}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Customer Login:
                                                    </Typography>
                                                    <StatusChip active={general.allowCustomerLogin} />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Guest Checkout:
                                                    </Typography>
                                                    <StatusChip active={general.allowGuestCheckout} />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Email Verification:
                                                    </Typography>
                                                    <StatusChip active={general.requireEmailVerification} />
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
            </Stack>
        </Box>
    );
}
