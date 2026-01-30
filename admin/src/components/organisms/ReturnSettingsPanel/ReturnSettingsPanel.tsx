'use client';

import { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Card, CardContent,
    TextField, FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, Checkbox, FormGroup, CircularProgress,
    Alert, Divider, Switch,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

interface ReturnSettingsProps {
    storeId: string;
}

interface ReturnSettings {
    enabled: boolean;
    defaultReturnWindow: number;
    defaultExchangeWindow: number;
    allowPartialReturns: boolean;
    requireReturnReason: boolean;
    autoApproveReturns: boolean;
    pickupEnabled: boolean;
    dropOffEnabled: boolean;
    refundMethods: ('original' | 'bank_transfer')[];
    restockingFeePercentage?: number;
}

const defaultSettings: ReturnSettings = {
    enabled: true,
    defaultReturnWindow: 7,
    defaultExchangeWindow: 7,
    allowPartialReturns: true,
    requireReturnReason: true,
    autoApproveReturns: false,
    pickupEnabled: true,
    dropOffEnabled: true,
    refundMethods: ['original', 'bank_transfer'],
    restockingFeePercentage: 0,
};

export default function ReturnSettingsPanel({ storeId }: ReturnSettingsProps) {
    const [settings, setSettings] = useState<ReturnSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeId]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/stores/${storeId}`);
            const store = response.data.store || response.data.data;
            if (store?.settings?.returnSettings) {
                setSettings({
                    ...defaultSettings,
                    ...store.settings.returnSettings,
                });
            }
        } catch (_err) {
            showNotification('Failed to load return settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/stores/${storeId}`, {
                settings: { returnSettings: settings },
            });
            showNotification('Return settings saved successfully', 'success');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showNotification(
                error.response?.data?.message || 'Failed to save return settings',
                'error'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleRefundMethodToggle = (method: 'original' | 'bank_transfer') => {
        const methods = [...settings.refundMethods];
        const index = methods.indexOf(method);
        if (index > -1) {
            methods.splice(index, 1);
        } else {
            methods.push(method);
        }
        setSettings({ ...settings, refundMethods: methods });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, pt: 0 }}>
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h6">Return & Exchange Settings</Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.enabled}
                                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                                    color="primary"
                                />
                            }
                            label={settings.enabled ? 'Enabled' : 'Disabled'}
                        />
                    </Box>

                    {!settings.enabled && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            Returns and exchanges are currently disabled for this store. Customers will not be able to request returns.
                        </Alert>
                    )}

                    <Divider sx={{ my: 3 }} />

                    {/* Return Windows */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Return Windows</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Set the default number of days customers have to return or exchange items after delivery.
                        These can be overridden at the product level.
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Default Return Window (days)"
                                type="number"
                                value={settings.defaultReturnWindow}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    defaultReturnWindow: Math.max(0, parseInt(e.target.value) || 0),
                                })}
                                inputProps={{ min: 0, max: 365 }}
                                helperText="Set to 0 to disable returns by default"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Default Exchange Window (days)"
                                type="number"
                                value={settings.defaultExchangeWindow}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    defaultExchangeWindow: Math.max(0, parseInt(e.target.value) || 0),
                                })}
                                inputProps={{ min: 0, max: 365 }}
                                helperText="Set to 0 to disable exchanges by default"
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Return Options */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Return Options</Typography>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={settings.allowPartialReturns}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                allowPartialReturns: e.target.checked,
                                            })}
                                        />
                                    }
                                    label="Allow Partial Returns"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                                    Customers can return individual items from an order
                                </Typography>
                            </FormGroup>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={settings.requireReturnReason}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                requireReturnReason: e.target.checked,
                                            })}
                                        />
                                    }
                                    label="Require Return Reason"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                                    Customers must select a reason for returning
                                </Typography>
                            </FormGroup>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={settings.autoApproveReturns}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                autoApproveReturns: e.target.checked,
                                            })}
                                        />
                                    }
                                    label="Auto-Approve Returns"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                                    Automatically approve valid return requests
                                </Typography>
                            </FormGroup>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Restocking Fee (%)"
                                type="number"
                                value={settings.restockingFeePercentage || 0}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    restockingFeePercentage: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)),
                                })}
                                inputProps={{ min: 0, max: 100, step: 0.1 }}
                                helperText="Percentage deducted from refund (0 for no fee)"
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Pickup Options */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Return Methods</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        How customers can return their items
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={settings.pickupEnabled}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                pickupEnabled: e.target.checked,
                                            })}
                                        />
                                    }
                                    label="Pickup from Customer"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                                    Schedule courier pickup from customer address
                                </Typography>
                            </FormGroup>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={settings.dropOffEnabled}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                dropOffEnabled: e.target.checked,
                                            })}
                                        />
                                    }
                                    label="Customer Drop-off"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                                    Customer ships or drops off at store/warehouse
                                </Typography>
                            </FormGroup>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Refund Methods */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Refund Methods</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Available refund options for customers
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={settings.refundMethods.includes('original')}
                                            onChange={() => handleRefundMethodToggle('original')}
                                        />
                                    }
                                    label="Original Payment Method"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                                    Refund to original payment source
                                </Typography>
                            </FormGroup>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={settings.refundMethods.includes('bank_transfer')}
                                            onChange={() => handleRefundMethodToggle('bank_transfer')}
                                        />
                                    }
                                    label="Bank Transfer"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                                    Direct transfer to bank account
                                </Typography>
                            </FormGroup>
                        </Grid>
                    </Grid>

                    {settings.refundMethods.length === 0 && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            At least one refund method must be enabled
                        </Alert>
                    )}

                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving || settings.refundMethods.length === 0}
                            startIcon={saving ? <CircularProgress size={20} /> : <RefreshIcon />}
                        >
                            {saving ? 'Saving...' : 'Save Return Settings'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
