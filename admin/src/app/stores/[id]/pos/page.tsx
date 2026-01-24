'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Card,
    CardContent,
    FormControlLabel,
    Switch,
    TextField,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Grid,
    FormGroup,
    Checkbox,
    Autocomplete,
    Stack,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { Save as SaveIcon, CloudUpload } from '@mui/icons-material';
import PageHeader from '@/components/molecules/PageHeader';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { POSSettings, PosPaymentSettings } from '@/types/pos';
import { FileItem } from '@/types/file';
import api from '@/lib/api';
import GeneralSettings from '@/components/organisms/pos/GeneralSettings';
import PaymentSettings from '@/components/organisms/pos/PaymentSettings';
import ReceiptSettings from '@/components/organisms/pos/ReceiptSettings';
import BarcodeSettings from '@/components/organisms/pos/BarcodeSettings';

interface GatewayConfig {
    _id: string;
    provider: string;
    alias?: string;
    isTestMode: boolean;
    gatewayName?: string;
    gatewayType?: string;
}

export default function POSSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const storeId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [gatewayConfigs, setGatewayConfigs] = useState<GatewayConfig[]>([]);

    const [settings, setSettings] = useState<POSSettings>({
        enabled: false,
        allowQuickCheckout: true,
        requireCustomerDetails: false,
        defaultPaymentMethod: 'cash',
        receiptSettings: {
            headerText: '',
            footerText: '',
            showLogo: true,
            paperWidth: '80mm',
        },
        barcodeSettings: {
            format: 'CODE128',
            printWidth: 40,
            printHeight: 30,
        },
        paymentSettings: {
            enabledMethods: { cash: true, card: false, qr: false },
            qrSettings: {
                mode: 'custom',
                verification: { mode: 'manual' },
                displaySettings: { showAmount: true, instructions: '' },
                customConfig: { qrCodeImage: '' }
            }
        }
    });

    useEffect(() => {
        fetchData();
    }, [storeId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [storeRes, gatewaysRes] = await Promise.all([
                api.get(`/stores/${storeId}`),
                api.get(`/payment-gateways?storeId=${storeId}`)
            ]);

            if (storeRes.data.store && storeRes.data.store.posSettings) {
                const fetchedPosSettings = storeRes.data.store.posSettings || {};
                const fetchedPaymentSettings = storeRes.data.store.posPaymentSettings;

                const defaultSettings: POSSettings = {
                    enabled: false,
                    allowQuickCheckout: true,
                    requireCustomerDetails: false,
                    defaultPaymentMethod: 'cash',
                    receiptSettings: {
                        headerText: '',
                        footerText: '',
                        showLogo: true,
                        paperWidth: '80mm',
                    },
                    barcodeSettings: {
                        format: 'CODE128',
                        printWidth: 40,
                        printHeight: 30,
                    },
                    paymentSettings: {
                        enabledMethods: { cash: true, card: false, qr: false },
                        qrSettings: {
                            mode: 'custom',
                            verification: { mode: 'manual' },
                            displaySettings: { showAmount: true, instructions: '' },
                            customConfig: { qrCodeImage: '' }
                        }
                    }
                };

                const mergedSettings: POSSettings = {
                    ...defaultSettings,
                    ...fetchedPosSettings,
                    receiptSettings: {
                        ...defaultSettings.receiptSettings,
                        ...(fetchedPosSettings.receiptSettings || {})
                    },
                    barcodeSettings: {
                        ...defaultSettings.barcodeSettings,
                        ...(fetchedPosSettings.barcodeSettings || {})
                    }
                };

                // Merge payment settings (handle sibling structure from backend)
                if (fetchedPaymentSettings) {
                    mergedSettings.paymentSettings = {
                        ...defaultSettings.paymentSettings!,
                        ...fetchedPaymentSettings,
                        enabledMethods: {
                            ...defaultSettings.paymentSettings!.enabledMethods,
                            ...(fetchedPaymentSettings.enabledMethods || {})
                        },
                        qrSettings: {
                            ...defaultSettings.paymentSettings!.qrSettings!,
                            ...(fetchedPaymentSettings.qrSettings || {})
                        }
                    };
                } else if (fetchedPosSettings.paymentSettings) {
                    // Fallback for older structure if necessary
                    mergedSettings.paymentSettings = {
                        ...defaultSettings.paymentSettings!,
                        ...fetchedPosSettings.paymentSettings,
                        enabledMethods: {
                            ...defaultSettings.paymentSettings!.enabledMethods,
                            ...(fetchedPosSettings.paymentSettings.enabledMethods || {})
                        },
                    }
                }

                setSettings(mergedSettings);
            }

            if (gatewaysRes && gatewaysRes?.data?.data && Array.isArray(gatewaysRes.data.data)) {
                setGatewayConfigs(gatewaysRes.data.data);
            } else if (Array.isArray(gatewaysRes.data)) {
                setGatewayConfigs(gatewaysRes.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            await api.put(`/stores/${storeId}`, {
                posSettings: settings,
            });

            const payload = {
                posSettings: {
                    enabled: settings.enabled,
                    allowQuickCheckout: settings.allowQuickCheckout,
                    requireCustomerDetails: settings.requireCustomerDetails,
                    defaultPaymentMethod: settings.defaultPaymentMethod,
                    receiptSettings: settings.receiptSettings,
                    barcodeSettings: settings.barcodeSettings
                },
                posPaymentSettings: settings.paymentSettings
            };

            await api.put(`/stores/${storeId}`, payload);

            setSuccess('POS settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save POS settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="POS Settings"
                subtitle="Configure settings for the Point of Sale system"
                backUrl={`/stores/`}
                action={
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                }
            />

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <GeneralSettings settings={settings} onChange={setSettings} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <PaymentSettings settings={settings} gatewayConfigs={gatewayConfigs} onChange={setSettings} />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <ReceiptSettings settings={settings} onChange={setSettings} />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <BarcodeSettings settings={settings} onChange={setSettings} />
                </Grid>
            </Grid>
        </Box>
    );
}
