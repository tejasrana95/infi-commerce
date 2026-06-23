'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    Paper,
    Typography,
    Card,
    CardContent,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    InputAdornment,
    IconButton,
    Grid,
} from '@mui/material';
import {
    ContentCopy as CopyIcon,
    Pinterest,
} from '@mui/icons-material';
import api from '@/lib/api';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import PageHeader from '@/components/molecules/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

interface PinterestSettings {
    enabled: boolean;
    currency: string;
}

export default function PinterestSettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();

    const [storeId, setStoreId] = useState<string | null>(null);
    const [storeCurrency, setStoreCurrency] = useState<string>('USD');
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [loadingCurrencies, setLoadingCurrencies] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(false);
    
    const [pinterestSettings, setPinterestSettings] = useState<PinterestSettings>({
        enabled: false,
        currency: 'USD',
    });

    const [savingPinterest, setSavingPinterest] = useState(false);

    // Super admin protection
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'super_admin')) {
            router.push(user ? '/dashboard' : '/login');
        }
    }, [authLoading, user, router]);

    // Load active currencies
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                setLoadingCurrencies(true);
                const currencyRes = await api.get('/currencies?limit=100');
                const currencyList = currencyRes.data.currencies || currencyRes.data.data || currencyRes.data;
                if (Array.isArray(currencyList)) {
                    setCurrencies(currencyList.filter(c => c.isActive !== false));
                }
            } catch (err) {
                console.error('Failed to load currencies list:', err);
                showNotification('Failed to load active currencies list', 'error');
            } finally {
                setLoadingCurrencies(false);
            }
        };

        if (user?.role === 'super_admin') {
            fetchCurrencies();
        }
    }, [user, showNotification]);

    // Load store-specific Pinterest settings
    useEffect(() => {
        if (!storeId) {
            setPinterestSettings({
                enabled: false,
                currency: 'USD',
            });
            return;
        }

        const fetchStoreSettings = async () => {
            try {
                setLoadingSettings(true);
                const response = await api.get(`/stores/${storeId}`);
                const store = response.data.store || response.data.data;
                setStoreCurrency(store?.currency || 'USD');

                if (store?.settings?.pinterestSettings) {
                    setPinterestSettings({
                        enabled: store.settings.pinterestSettings.enabled || false,
                        currency: store.settings.pinterestSettings.currency || store.currency || 'USD',
                    });
                } else {
                    setPinterestSettings({
                        enabled: false,
                        currency: store?.currency || 'USD',
                    });
                }
            } catch (err) {
                console.error('Failed to load store settings:', err);
                showNotification('Failed to load settings for selected store', 'error');
            } finally {
                setLoadingSettings(false);
            }
        };

        fetchStoreSettings();
    }, [storeId, showNotification]);

    const handleSavePinterest = async () => {
        if (!storeId) return;
        setSavingPinterest(true);
        try {
            await api.put(`/stores/${storeId}`, { settings: { pinterestSettings } });
            showNotification('Pinterest feed settings saved successfully', 'success');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(error.response?.data?.message || 'Failed to save settings', 'error');
        } finally {
            setSavingPinterest(false);
        }
    };

    // Calculate feed URL based on API base URL
    const getFeedUrl = () => {
        if (!storeId) return '';
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        return `${apiBase}/feeds/pinterest/${storeId}`;
    };

    const handleCopyUrl = () => {
        const url = getFeedUrl();
        if (!url) return;
        navigator.clipboard.writeText(url);
        showNotification('Feed URL copied to clipboard!', 'success');
    };

    if (authLoading || !user || user.role !== 'super_admin') {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Pinterest Product Feed"
                subtitle="Expose an RSS/Google Product Feed for Pinterest catalog ingestion."
                backUrl="/settings"
            />

            <Grid container spacing={3}>
                {/* Store Selector */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3, mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} mb={2}>
                            Select Store
                        </Typography>
                        <StoreAutocomplete
                            value={storeId}
                            onChange={(value) => setStoreId(typeof value === 'string' ? value : null)}
                            label="Store"
                            required
                            helperText="Choose the store you want to configure the Pinterest product feed for."
                        />
                    </Paper>
                </Grid>

                {/* Configuration Panel */}
                {storeId && (
                    <Grid size={{ xs: 12 }}>
                        {loadingSettings ? (
                            <Box display="flex" justifyContent="center" py={5}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                        <Box>
                                            <Typography variant="h6">Pinterest Product Feed Status</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Enable or disable the public XML feed for this store.
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant={pinterestSettings.enabled ? "contained" : "outlined"}
                                            color={pinterestSettings.enabled ? "success" : "inherit"}
                                            onClick={() => setPinterestSettings({ ...pinterestSettings, enabled: !pinterestSettings.enabled })}
                                        >
                                            {pinterestSettings.enabled ? "Enabled" : "Disabled"}
                                        </Button>
                                    </Box>

                                    <Alert severity="info" sx={{ mb: 3 }}>
                                        Using a Catalog Feed URL allows Pinterest to automatically read and sync your store's products, prices, images, and inventory daily without needing direct API keys or app authorization reviews.
                                    </Alert>

                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControl fullWidth disabled={loadingCurrencies}>
                                                <InputLabel>Target Currency</InputLabel>
                                                <Select
                                                    value={pinterestSettings.currency || storeCurrency || 'USD'}
                                                    label="Target Currency"
                                                    onChange={(e) => setPinterestSettings({ ...pinterestSettings, currency: e.target.value })}
                                                >
                                                    {currencies.length > 0 ? (
                                                        currencies.map((curr) => (
                                                            <MenuItem key={curr._id} value={curr.code}>
                                                                {curr.code} - {curr.name} ({curr.symbol})
                                                            </MenuItem>
                                                        ))
                                                    ) : (
                                                        <MenuItem value={storeCurrency || 'USD'}>
                                                            {storeCurrency || 'USD'}
                                                        </MenuItem>
                                                    )}
                                                </Select>
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                    Select the currency for Pinterest catalog ingestion. Prices in the XML feed will be automatically converted to this currency.
                                                </Typography>
                                            </FormControl>
                                        </Grid>

                                        {pinterestSettings.enabled && (
                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                                                    Your Pinterest Feed URL (Data Source)
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    inputProps={{ readOnly: true }}
                                                    value={getFeedUrl()}
                                                    variant="outlined"
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={handleCopyUrl} edge="end">
                                                                    <CopyIcon />
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                    helperText="Copy this URL and paste it under 'Catalogs -> Add Data Source' in your Pinterest Business Hub."
                                                />
                                            </Grid>
                                        )}
                                    </Grid>

                                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleSavePinterest}
                                            disabled={savingPinterest}
                                            startIcon={savingPinterest ? <CircularProgress size={20} /> : <Pinterest />}
                                        >
                                            {savingPinterest ? 'Saving...' : 'Save Settings'}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}
