'use client';

import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    FormControlLabel,
    Switch,
    Paper,
    IconButton,
    Tooltip,
    Slider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    PhoneIphone,
    Delete,
    Info,
    OfflineBolt,
} from '@mui/icons-material';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { ColorPicker } from '@/components/atoms';
import { FileItem } from '@/types/file';

interface POSPWASettings {
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
    offlineSettings?: {
        cacheTTL?: number;
        precacheProducts?: boolean;
        offlineMessage?: string;
    };
    installPromptStyle?: 'toast' | 'banner' | 'none';
}

interface POSPWASettingsProps {
    initialSettings?: POSPWASettings;
    onSave: (settings: POSPWASettings) => Promise<void>;
    saving?: boolean;
}

export default function POSPWASettings({ initialSettings, onSave, saving = false }: POSPWASettingsProps) {
    const [settings, setSettings] = useState<POSPWASettings>(initialSettings || {
        enabled: false,
        appName: 'POS System',
        appShortName: 'POS',
        themeColor: '#1a1a2e',
        backgroundColor: '#0f0f23',
        icons: {
            icon192: '',
            icon512: '',
            appleTouchIcon: '',
        },
        offlineSettings: {
            cacheTTL: 24,
            precacheProducts: false,
            offlineMessage: 'You are currently offline. Some features may be limited.',
        },
        installPromptStyle: 'toast',
    });

    const handleIconSelect = (files: FileItem[], iconType: 'icon192' | 'icon512' | 'appleTouchIcon') => {
        if (files.length > 0) {
            setSettings({
                ...settings,
                icons: {
                    ...settings.icons,
                    [iconType]: files[0].url,
                },
            });
        }
    };

    const handleSave = async () => {
        await onSave(settings);
    };

    return (
        <Box>
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <PhoneIphone color="primary" />
                            <Typography variant="h6">POS PWA Configuration</Typography>
                        </Box>
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

                    {settings.enabled && (
                        <>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                <strong>POS PWA</strong> allows your staff to install the Point of Sale as a standalone app.
                                This provides faster access, offline capability, and a native app experience on tablets and desktops.
                            </Alert>

                            <Grid container spacing={3}>
                                {/* App Name */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="App Name"
                                        value={settings.appName || ''}
                                        onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                        placeholder="POS System"
                                        helperText="Full name displayed when installing the app"
                                        required
                                    />
                                </Grid>

                                {/* App Short Name */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="App Short Name"
                                        value={settings.appShortName || ''}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(0, 12);
                                            setSettings({ ...settings, appShortName: value });
                                        }}
                                        placeholder="POS"
                                        helperText={`${settings.appShortName?.length || 0}/12 - Shown on home screen`}
                                        inputProps={{ maxLength: 12 }}
                                        required
                                    />
                                </Grid>

                                {/* Theme Color */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <ColorPicker
                                        label="Theme Color"
                                        value={settings.themeColor || '#1a1a2e'}
                                        onChange={(color) => setSettings({ ...settings, themeColor: color })}
                                        helperText="Browser toolbar color when app is open"
                                    />
                                </Grid>

                                {/* Background Color */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <ColorPicker
                                        label="Background Color"
                                        value={settings.backgroundColor || '#0f0f23'}
                                        onChange={(color) => setSettings({ ...settings, backgroundColor: color })}
                                        helperText="Splash screen background color"
                                    />
                                </Grid>

                                {/* Install Prompt Style */}
                                <Grid size={{ xs: 12 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Install Prompt Style</InputLabel>
                                        <Select
                                            value={settings.installPromptStyle || 'toast'}
                                            label="Install Prompt Style"
                                            onChange={(e) => setSettings({ ...settings, installPromptStyle: e.target.value as 'toast' | 'banner' | 'none' })}
                                        >
                                            <MenuItem value="toast">Toast (Bottom notification)</MenuItem>
                                            <MenuItem value="banner">Banner (Top bar)</MenuItem>
                                            <MenuItem value="none">None (Manual install only)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* App Icons */}
            {settings.enabled && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                            <Typography variant="h6">App Icons</Typography>
                            <Tooltip title="Upload icons in PNG format with transparent backgrounds for best results">
                                <IconButton size="small">
                                    <Info fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Icon 192x192 */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        192x192 Icon *
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                        Required for Android
                                    </Typography>

                                    {settings.icons?.icon192 ? (
                                        <Box display="flex" alignItems="center" flexDirection="column">
                                            <Box
                                                component="img"
                                                src={settings.icons.icon192}
                                                alt="192x192 icon"
                                                sx={{
                                                    width: 96,
                                                    height: 96,
                                                    objectFit: 'contain',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    mb: 2,
                                                    bgcolor: 'grey.900',
                                                }}
                                            />
                                            <Button
                                                size="small"
                                                color="error"
                                                startIcon={<Delete />}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    icons: { ...settings.icons, icon192: '' }
                                                })}
                                            >
                                                Remove
                                            </Button>
                                        </Box>
                                    ) : (
                                        <FileManagerButton
                                            label="Upload Icon"
                                            variant="outlined"
                                            accept="image/*"
                                            category="images"
                                            initialFolder="/pwa-icons"
                                            onSelect={(files) => handleIconSelect(files, 'icon192')}
                                        />
                                    )}
                                </Paper>
                            </Grid>

                            {/* Icon 512x512 */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        512x512 Icon *
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                        Required for splash screen
                                    </Typography>

                                    {settings.icons?.icon512 ? (
                                        <Box display="flex" alignItems="center" flexDirection="column">
                                            <Box
                                                component="img"
                                                src={settings.icons.icon512}
                                                alt="512x512 icon"
                                                sx={{
                                                    width: 96,
                                                    height: 96,
                                                    objectFit: 'contain',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    mb: 2,
                                                    bgcolor: 'grey.900',
                                                }}
                                            />
                                            <Button
                                                size="small"
                                                color="error"
                                                startIcon={<Delete />}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    icons: { ...settings.icons, icon512: '' }
                                                })}
                                            >
                                                Remove
                                            </Button>
                                        </Box>
                                    ) : (
                                        <FileManagerButton
                                            label="Upload Icon"
                                            variant="outlined"
                                            accept="image/*"
                                            category="images"
                                            initialFolder="/pwa-icons"
                                            onSelect={(files) => handleIconSelect(files, 'icon512')}
                                        />
                                    )}
                                </Paper>
                            </Grid>

                            {/* Apple Touch Icon */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        180x180 Apple Icon
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                        Optional for iOS/macOS
                                    </Typography>

                                    {settings.icons?.appleTouchIcon ? (
                                        <Box display="flex" alignItems="center" flexDirection="column">
                                            <Box
                                                component="img"
                                                src={settings.icons.appleTouchIcon}
                                                alt="Apple touch icon"
                                                sx={{
                                                    width: 96,
                                                    height: 96,
                                                    objectFit: 'contain',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    mb: 2,
                                                    bgcolor: 'grey.900',
                                                }}
                                            />
                                            <Button
                                                size="small"
                                                color="error"
                                                startIcon={<Delete />}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    icons: { ...settings.icons, appleTouchIcon: '' }
                                                })}
                                            >
                                                Remove
                                            </Button>
                                        </Box>
                                    ) : (
                                        <FileManagerButton
                                            label="Upload Icon"
                                            variant="outlined"
                                            accept="image/*"
                                            category="images"
                                            initialFolder="/pwa-icons"
                                            onSelect={(files) => handleIconSelect(files, 'appleTouchIcon')}
                                        />
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Offline Settings */}
            {settings.enabled && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                            <OfflineBolt color="warning" />
                            <Typography variant="h6">Offline Settings</Typography>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Cache TTL */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Cache Duration: {settings.offlineSettings?.cacheTTL || 24} hours
                                </Typography>
                                <Slider
                                    value={settings.offlineSettings?.cacheTTL || 24}
                                    onChange={(_, value) => setSettings({
                                        ...settings,
                                        offlineSettings: {
                                            ...settings.offlineSettings,
                                            cacheTTL: value as number,
                                        }
                                    })}
                                    min={1}
                                    max={168}
                                    marks={[
                                        { value: 1, label: '1h' },
                                        { value: 24, label: '24h' },
                                        { value: 72, label: '3d' },
                                        { value: 168, label: '7d' },
                                    ]}
                                    valueLabelDisplay="auto"
                                />
                                <Typography variant="caption" color="text.secondary">
                                    How long cached data remains valid
                                </Typography>
                            </Grid>

                            {/* Precache Products */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.offlineSettings?.precacheProducts || false}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                offlineSettings: {
                                                    ...settings.offlineSettings,
                                                    precacheProducts: e.target.checked,
                                                }
                                            })}
                                        />
                                    }
                                    label="Precache Product Images"
                                />
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Downloads product images for offline use (increases storage usage)
                                </Typography>
                            </Grid>

                            {/* Offline Message */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Offline Message"
                                    value={settings.offlineSettings?.offlineMessage || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        offlineSettings: {
                                            ...settings.offlineSettings,
                                            offlineMessage: e.target.value,
                                        }
                                    })}
                                    placeholder="You are currently offline..."
                                    helperText="Message shown when device is offline"
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Save Button */}
            <Box display="flex" justifyContent="flex-end">
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || (settings.enabled && (!settings.appName || !settings.icons?.icon192 || !settings.icons?.icon512))}
                    startIcon={saving ? <CircularProgress size={20} /> : <PhoneIphone />}
                    size="large"
                >
                    {saving ? 'Saving...' : 'Save POS PWA Settings'}
                </Button>
            </Box>
        </Box>
    );
}
