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
    Divider,
    Grid,
    Container,
    Paper,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import PageHeader from '@/components/molecules/PageHeader';
import { POSSettings } from '@/types/pos';
import api from '@/lib/api';

export default function POSSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const storeId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [settings, setSettings] = useState<POSSettings>({
        enabled: false,
        allowQuickCheckout: true,
        requireCustomerDetails: false,
        defaultPaymentMethod: 'cash',
        enableRoundOff: false,
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
    });

    useEffect(() => {
        fetchPOSSettings();
    }, [storeId]);

    const fetchPOSSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/stores/${storeId}`);
            if (response.data.store && response.data.store.posSettings) {
                setSettings(response.data.store.posSettings);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load POS settings');
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
                {/* General Settings */}
                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                General Settings
                            </Typography>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.enabled}
                                        onChange={(e) =>
                                            setSettings({ ...settings, enabled: e.target.checked })
                                        }
                                    />
                                }
                                label="Enable POS System"
                            />

                            <Box sx={{ mt: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.allowQuickCheckout}
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    allowQuickCheckout: e.target.checked,
                                                })
                                            }
                                        />
                                    }
                                    label="Allow Quick Checkout"
                                />
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.requireCustomerDetails}
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    requireCustomerDetails: e.target.checked,
                                                })
                                            }
                                        />
                                    }
                                    label="Require Customer Details"
                                />
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.enableRoundOff}
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    enableRoundOff: e.target.checked,
                                                })
                                            }
                                        />
                                    }
                                    label="Enable Round-off (for easier cash handling)"
                                />
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Round totals to nearest whole number for easy cash transactions
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Default Payment Method</InputLabel>
                                    <Select
                                        value={settings.defaultPaymentMethod}
                                        label="Default Payment Method"
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                defaultPaymentMethod: e.target.value as any,
                                            })
                                        }
                                    >
                                        <MenuItem value="cash">Cash</MenuItem>
                                        <MenuItem value="card">Card</MenuItem>
                                        <MenuItem value="upi">UPI</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Receipt Settings */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Receipt Settings
                            </Typography>

                            <TextField
                                fullWidth
                                label="Header Text"
                                value={settings.receiptSettings.headerText || ''}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        receiptSettings: {
                                            ...settings.receiptSettings,
                                            headerText: e.target.value,
                                        },
                                    })
                                }
                                placeholder="Thank you for shopping with us!"
                                sx={{ mb: 2, mt: 1 }}
                            />

                            <TextField
                                fullWidth
                                label="Footer Text"
                                value={settings.receiptSettings.footerText || ''}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        receiptSettings: {
                                            ...settings.receiptSettings,
                                            footerText: e.target.value,
                                        },
                                    })
                                }
                                placeholder="Visit us again!"
                                sx={{ mb: 2 }}
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.receiptSettings.showLogo}
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                receiptSettings: {
                                                    ...settings.receiptSettings,
                                                    showLogo: e.target.checked,
                                                },
                                            })
                                        }
                                    />
                                }
                                label="Show Logo on Receipt"
                            />

                            <Box sx={{ mt: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Paper Width</InputLabel>
                                    <Select
                                        value={settings.receiptSettings.paperWidth}
                                        label="Paper Width"
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                receiptSettings: {
                                                    ...settings.receiptSettings,
                                                    paperWidth: e.target.value as any,
                                                },
                                            })
                                        }
                                    >
                                        <MenuItem value="58mm">58mm</MenuItem>
                                        <MenuItem value="80mm">80mm (Standard)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Barcode Settings */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Barcode Settings
                            </Typography>

                            <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
                                <InputLabel>Barcode Format</InputLabel>
                                <Select
                                    value={settings.barcodeSettings.format}
                                    label="Barcode Format"
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            barcodeSettings: {
                                                ...settings.barcodeSettings,
                                                format: e.target.value as any,
                                            },
                                        })
                                    }
                                >
                                    <MenuItem value="CODE128">CODE128 (Recommended)</MenuItem>
                                    <MenuItem value="EAN13">EAN-13</MenuItem>
                                    <MenuItem value="QR">QR Code</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                type="number"
                                label="Print Width (mm)"
                                value={settings.barcodeSettings.printWidth}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        barcodeSettings: {
                                            ...settings.barcodeSettings,
                                            printWidth: parseInt(e.target.value) || 40,
                                        },
                                    })
                                }
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                type="number"
                                label="Print Height (mm)"
                                value={settings.barcodeSettings.printHeight}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        barcodeSettings: {
                                            ...settings.barcodeSettings,
                                            printHeight: parseInt(e.target.value) || 30,
                                        },
                                    })
                                }
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
