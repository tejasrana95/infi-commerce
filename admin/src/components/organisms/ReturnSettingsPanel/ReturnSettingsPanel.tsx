'use client';

import { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Card, CardContent,
    TextField, FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, Checkbox, FormGroup, CircularProgress,
    Alert, Divider, Switch, IconButton, List, ListItem,
    ListItemText, ListItemSecondaryAction, Paper
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Refresh as RefreshIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
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
    returnConditions: string[];
    exchangeConditions: string[];
    processSteps: { label: string; description?: string }[];
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
    returnConditions: [],
    exchangeConditions: [],
    processSteps: [],
};

interface ListEditorProps {
    title: string;
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
}

const ListEditor = ({ title, items, onChange, placeholder }: ListEditorProps) => {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem.trim()) {
            onChange([...items, newItem.trim()]);
            setNewItem('');
        }
    };

    const handleDelete = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        onChange(newItems);
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>{title}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                    fullWidth
                    size="small"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={placeholder || 'Add new item'}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button
                    variant="contained"
                    onClick={handleAdd}
                    startIcon={<AddIcon />}
                    sx={{ minWidth: 100 }}
                >
                    Add
                </Button>
            </Box>
            {items.length > 0 && (
                <Paper variant="outlined">
                    <List dense>
                        {items.map((item, index) => (
                            <ListItem key={index} divider={index !== items.length - 1}>
                                <ListItemText primary={item} />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" onClick={() => handleDelete(index)} size="small" color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

interface ProcessStepEditorProps {
    steps: { label: string; description?: string }[];
    onChange: (steps: { label: string; description?: string }[]) => void;
}

const ProcessStepEditor = ({ steps, onChange }: ProcessStepEditorProps) => {
    const [newStep, setNewStep] = useState({ label: '', description: '' });

    const handleAdd = () => {
        if (newStep.label.trim()) {
            onChange([...steps, { ...newStep, label: newStep.label.trim(), description: newStep.description.trim() }]);
            setNewStep({ label: '', description: '' });
        }
    };

    const handleDelete = (index: number) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        onChange(newSteps);
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Process Steps</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    label="Step Name"
                    value={newStep.label}
                    onChange={(e) => setNewStep({ ...newStep, label: e.target.value })}
                    placeholder="e.g. Quality Check"
                />
                <TextField
                    fullWidth
                    size="small"
                    label="Description (Optional)"
                    value={newStep.description}
                    onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                    placeholder="Describe what happens in this step"
                />
                <Button
                    variant="contained"
                    onClick={handleAdd}
                    startIcon={<AddIcon />}
                    disabled={!newStep.label.trim()}
                    fullWidth
                >
                    Add Step
                </Button>
            </Box>

            {steps.length > 0 && (
                <Paper variant="outlined">
                    <List dense>
                        {steps.map((step, index) => (
                            <ListItem key={index} divider={index !== steps.length - 1} alignItems="flex-start">
                                <ListItemText
                                    primary={step.label}
                                    secondary={step.description}
                                    primaryTypographyProps={{ fontWeight: 500 }}
                                />
                                <ListItemSecondaryAction sx={{ top: 16 }}>
                                    <IconButton edge="end" onClick={() => handleDelete(index)} size="small" color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
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

                    <Divider sx={{ my: 3 }} />

                    {/* Conditions & Process */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Conditions & Process</Typography>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <ListEditor
                                title="Return Conditions"
                                items={settings.returnConditions || []}
                                onChange={(items) => setSettings({ ...settings, returnConditions: items })}
                                placeholder="e.g. Tag must be attached"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <ListEditor
                                title="Exchange Conditions"
                                items={settings.exchangeConditions || []}
                                onChange={(items) => setSettings({ ...settings, exchangeConditions: items })}
                                placeholder="e.g. Original packaging required"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <ProcessStepEditor
                                steps={settings.processSteps || []}
                                onChange={(steps) => setSettings({ ...settings, processSteps: steps })}
                            />
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
