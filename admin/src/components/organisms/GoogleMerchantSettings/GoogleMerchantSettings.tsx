'use client';

import React, { useState } from 'react';
import {
    Box, Typography, TextField, FormControlLabel, Switch, FormControl,
    InputLabel, Select, MenuItem, Button, Chip, Card, CardContent,
    Divider, Alert, IconButton, InputAdornment, Collapse, OutlinedInput,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Visibility, VisibilityOff, SaveOutlined, InfoOutlined,
    ExpandMore, ExpandLess,
} from '@mui/icons-material';

export interface GoogleMerchantSettingsData {
    enabled: boolean;
    merchantId: string;
    serviceAccountKey: string;
    targetCountries: string[];
    contentLanguage: string;
    autoSync: boolean;
    syncFrequency: 'manual' | 'daily' | 'weekly';
    feedSettings: {
        includeOutOfStock: boolean;
        includeInactive: boolean;
        defaultShippingLabel: string;
        defaultTaxCategory: string;
        customLabels: string[];
    };
}

interface Props {
    settings: GoogleMerchantSettingsData;
    onChange: (settings: GoogleMerchantSettingsData) => void;
    onSave: (settings: GoogleMerchantSettingsData) => Promise<void>;
    saving?: boolean;
}

const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IN', name: 'India' },
    { code: 'JP', name: 'Japan' },
    { code: 'BR', name: 'Brazil' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'MX', name: 'Mexico' },
    { code: 'PL', name: 'Poland' },
    { code: 'TR', name: 'Turkey' },
    { code: 'ZA', name: 'South Africa' },
];

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'ja', name: 'Japanese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ko', name: 'Korean' },
    { code: 'sv', name: 'Swedish' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
];

export default function GoogleMerchantSettings({ settings, onChange, onSave, saving }: Props) {
    const [showKey, setShowKey] = useState(false);
    const [showFeedSettings, setShowFeedSettings] = useState(false);
    const [newLabel, setNewLabel] = useState('');

    const updateSettings = (partial: Partial<GoogleMerchantSettingsData>) => {
        onChange({ ...settings, ...partial });
    };

    const updateFeedSettings = (partial: Partial<GoogleMerchantSettingsData['feedSettings']>) => {
        onChange({
            ...settings,
            feedSettings: { ...settings.feedSettings, ...partial },
        });
    };

    const addCustomLabel = () => {
        if (newLabel.trim() && settings.feedSettings.customLabels.length < 5) {
            updateFeedSettings({
                customLabels: [...settings.feedSettings.customLabels, newLabel.trim()],
            });
            setNewLabel('');
        }
    };

    const removeCustomLabel = (index: number) => {
        updateFeedSettings({
            customLabels: settings.feedSettings.customLabels.filter((_, i) => i !== index),
        });
    };

    return (
        <Box>
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6">Google Merchant Center</Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.enabled}
                                    onChange={(e) => updateSettings({ enabled: e.target.checked })}
                                    color="primary"
                                />
                            }
                            label={settings.enabled ? 'Enabled' : 'Disabled'}
                        />
                    </Box>

                    {!settings.enabled && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Enable Google Merchant Center to submit products to Google Shopping and boost your sales.
                            You&apos;ll need a Google Merchant Center account and a service account key.
                        </Alert>
                    )}

                    {settings.enabled && (
                        <>
                            <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 3 }}>
                                Connect your Google Merchant Center account to submit products to Google Shopping.
                                Get your Merchant ID from{' '}
                                <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer">
                                    merchants.google.com
                                </a>.
                            </Alert>

                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Merchant Center ID"
                                        value={settings.merchantId}
                                        onChange={(e) => updateSettings({ merchantId: e.target.value })}
                                        placeholder="123456789"
                                        required
                                        helperText="Found in Google Merchant Center dashboard"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Target Countries</InputLabel>
                                        <Select
                                            multiple
                                            value={settings.targetCountries}
                                            label="Target Countries"
                                            onChange={(e) => updateSettings({ targetCountries: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[] })}
                                            input={<OutlinedInput label="Target Countries" />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {(selected as string[]).map((code) => {
                                                        const country = COUNTRIES.find(c => c.code === code);
                                                        return <Chip key={code} label={country ? `${country.name}` : code} size="small" />;
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {COUNTRIES.map(c => (
                                                <MenuItem key={c.code} value={c.code}>{c.name} ({c.code})</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Content Language</InputLabel>
                                        <Select
                                            value={settings.contentLanguage}
                                            label="Content Language"
                                            onChange={(e) => updateSettings({ contentLanguage: e.target.value })}
                                        >
                                            {LANGUAGES.map(l => (
                                                <MenuItem key={l.code} value={l.code}>{l.name} ({l.code})</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Sync Frequency</InputLabel>
                                        <Select
                                            value={settings.syncFrequency}
                                            label="Sync Frequency"
                                            onChange={(e) => updateSettings({ syncFrequency: e.target.value as any })}
                                        >
                                            <MenuItem value="manual">Manual Only</MenuItem>
                                            <MenuItem value="daily">Daily</MenuItem>
                                            <MenuItem value="weekly">Weekly</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Box mt={3}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.autoSync}
                                            onChange={(e) => updateSettings({ autoSync: e.target.checked })}
                                        />
                                    }
                                    label="Auto-sync product changes to Google Merchant"
                                />
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" sx={{ mb: 2 }}>Service Account Credentials</Typography>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Paste your Google Cloud service account JSON key below. This key is stored securely
                                and is used to authenticate with the Google Content API.
                            </Alert>
                            <TextField
                                fullWidth
                                label="Service Account Key (JSON)"
                                multiline
                                rows={4}
                                value={settings.serviceAccountKey}
                                onChange={(e) => updateSettings({ serviceAccountKey: e.target.value })}
                                type={showKey ? 'text' : 'password'}
                                placeholder='{"type": "service_account", ...}'
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowKey(!showKey)} edge="end">
                                                    {showKey ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />

                            <Divider sx={{ my: 3 }} />

                            {/* Feed Settings — collapsible */}
                            <Box
                                display="flex"
                                alignItems="center"
                                sx={{ cursor: 'pointer' }}
                                onClick={() => setShowFeedSettings(!showFeedSettings)}
                            >
                                <Typography variant="h6">Feed Settings</Typography>
                                <IconButton size="small" sx={{ ml: 1 }}>
                                    {showFeedSettings ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                            </Box>

                            <Collapse in={showFeedSettings}>
                                <Box mt={2}>
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={settings.feedSettings.includeOutOfStock}
                                                        onChange={(e) => updateFeedSettings({ includeOutOfStock: e.target.checked })}
                                                    />
                                                }
                                                label="Include out-of-stock products in feed"
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={settings.feedSettings.includeInactive}
                                                        onChange={(e) => updateFeedSettings({ includeInactive: e.target.checked })}
                                                    />
                                                }
                                                label="Include inactive products in feed"
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                fullWidth
                                                label="Default Shipping Label"
                                                value={settings.feedSettings.defaultShippingLabel}
                                                onChange={(e) => updateFeedSettings({ defaultShippingLabel: e.target.value })}
                                                helperText="Applied to products without a specific shipping label"
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                fullWidth
                                                label="Default Tax Category"
                                                value={settings.feedSettings.defaultTaxCategory}
                                                onChange={(e) => updateFeedSettings({ defaultTaxCategory: e.target.value })}
                                                helperText="Google product tax category code"
                                            />
                                        </Grid>
                                    </Grid>

                                    <Box mt={3}>
                                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                            Custom Labels (up to 5)
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Custom labels help you organize products for Shopping campaign segmentation.
                                        </Typography>
                                        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                            {settings.feedSettings.customLabels.map((label, index) => (
                                                <Chip
                                                    key={index}
                                                    label={`Label ${index}: ${label}`}
                                                    onDelete={() => removeCustomLabel(index)}
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>
                                        {settings.feedSettings.customLabels.length < 5 && (
                                            <Box display="flex" gap={1}>
                                                <TextField
                                                    size="small"
                                                    label="Add Custom Label"
                                                    value={newLabel}
                                                    onChange={(e) => setNewLabel(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && addCustomLabel()}
                                                    sx={{ flex: 1 }}
                                                />
                                                <Button variant="outlined" onClick={addCustomLabel}>
                                                    Add
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Collapse>
                        </>
                    )}
                </CardContent>
            </Card>

            <Box display="flex" justifyContent="flex-end">
                <Button
                    variant="contained"
                    startIcon={<SaveOutlined />}
                    onClick={() => onSave(settings)}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Google Merchant Settings'}
                </Button>
            </Box>
        </Box>
    );
}
