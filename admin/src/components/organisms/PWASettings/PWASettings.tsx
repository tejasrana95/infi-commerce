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
    InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    PhoneIphone,
    Delete,
    Info,
} from '@mui/icons-material';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { ColorPicker } from '@/components/atoms';
import { FileItem } from '@/types/file';

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
    splashScreen?: {
        image?: string;
        spinnerType?: 'circular' | 'dots' | 'pulse' | 'bars';
        spinnerColor?: string;
    };
    installPromptStyle?: 'toast' | 'banner' | 'modal';
}

interface PWASettingsProps {
    storeId: string;
    initialSettings?: PWASettings;
    onSave: (settings: PWASettings) => Promise<void>;
    saving?: boolean;
}

export default function PWASettings({ storeId, initialSettings, onSave, saving = false }: PWASettingsProps) {
    const [settings, setSettings] = useState<PWASettings>(initialSettings || {
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
        splashScreen: {
            image: '',
            spinnerType: 'circular',
            spinnerColor: '#000000',
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

    const handleSplashImageSelect = (files: FileItem[]) => {
        if (files.length > 0) {
            setSettings({
                ...settings,
                splashScreen: {
                    ...settings.splashScreen,
                    image: files[0].url,
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
                        <Typography variant="h6">PWA Configuration</Typography>
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
                                Progressive Web App (PWA) allows customers to install your store as an app on their devices.
                                This provides a native app-like experience with offline support and push notifications.
                            </Alert>

                            <Grid container spacing={3}>
                                {/* App Name */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="App Name"
                                        value={settings.appName || ''}
                                        onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                        placeholder="My Store"
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
                                        placeholder="My Store"
                                        helperText={`${settings.appShortName?.length || 0}/12 - Shown on home screen`}
                                        inputProps={{ maxLength: 12 }}
                                        required
                                    />
                                </Grid>

                                {/* Theme Color */}
                                <Grid size={{ xs: 12, md: 6 }}>

                                    <ColorPicker
                                        label="Theme Color"
                                        value={settings.themeColor || '#000000'}
                                        onChange={(color) => setSettings({ ...settings, themeColor: color })}
                                        helperText="Browser toolbar color when app is open"
                                    />
                                </Grid>

                                {/* Background Color */}
                                <Grid size={{ xs: 12, md: 6 }}>

                                    <ColorPicker
                                        label="Background Color"
                                        value={settings.backgroundColor || '#ffffff'}
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
                                            onChange={(e) => setSettings({ ...settings, installPromptStyle: e.target.value as 'toast' | 'banner' | 'modal' })}
                                        >
                                            <MenuItem value="toast">Toast (Bottom-right notification)</MenuItem>
                                            <MenuItem value="banner">Banner (Full-width top bar)</MenuItem>
                                            <MenuItem value="modal">Modal (Center popup)</MenuItem>
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
                                                    width: 120,
                                                    height: 120,
                                                    objectFit: 'contain',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    mb: 2,
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
                                                    width: 120,
                                                    height: 120,
                                                    objectFit: 'contain',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    mb: 2,
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
                                        Optional for iOS devices
                                    </Typography>

                                    {settings.icons?.appleTouchIcon ? (
                                        <Box display="flex" alignItems="center" flexDirection="column">
                                            <Box
                                                component="img"
                                                src={settings.icons.appleTouchIcon}
                                                alt="Apple touch icon"
                                                sx={{
                                                    width: 120,
                                                    height: 120,
                                                    objectFit: 'contain',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    mb: 2,
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

                        <Alert severity="warning" sx={{ mt: 3 }}>
                            <strong>Icon Requirements:</strong>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                                <li>Format: PNG with transparent background recommended</li>
                                <li>192x192 and 512x512 icons are required for PWA to work</li>
                                <li>Apple Touch Icon (180x180) is optional but recommended for iOS</li>
                                <li>Maximum file size: 2MB per icon</li>
                            </ul>
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {/* Splash Screen Configuration */}
            {settings.enabled && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                            <Typography variant="h6">Splash Screen</Typography>
                            <Tooltip title="Customize the splash screen shown when the PWA is loading">
                                <IconButton size="small">
                                    <Info fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Splash Screen Image */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Splash Screen Background
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                        Recommended: 2732x2732px
                                    </Typography>

                                    {settings.splashScreen?.image ? (
                                        <Box display="flex" alignItems="center" flexDirection="column">
                                            <Box
                                                component="img"
                                                src={settings.splashScreen.image}
                                                alt="Splash screen"
                                                sx={{
                                                    width: 150,
                                                    height: 150,
                                                    objectFit: 'cover',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    mb: 2,
                                                }}
                                            />
                                            <Button
                                                size="small"
                                                color="error"
                                                startIcon={<Delete />}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    splashScreen: { ...settings.splashScreen, image: '' }
                                                })}
                                            >
                                                Remove
                                            </Button>
                                        </Box>
                                    ) : (
                                        <FileManagerButton
                                            label="Upload Image"
                                            variant="outlined"
                                            accept="image/*"
                                            category="images"
                                            initialFolder="/pwa-icons"
                                            onSelect={handleSplashImageSelect}
                                        />
                                    )}
                                </Paper>
                            </Grid>

                            {/* Spinner Configuration */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {/* Spinner Type */}
                                    <FormControl fullWidth>
                                        <InputLabel>Loading Spinner Style</InputLabel>
                                        <Select
                                            value={settings.splashScreen?.spinnerType || 'circular'}
                                            label="Loading Spinner Style"
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                splashScreen: {
                                                    ...settings.splashScreen,
                                                    spinnerType: e.target.value as 'circular' | 'dots' | 'pulse' | 'bars',
                                                },
                                            })}
                                        >
                                            <MenuItem value="circular">Circular Spinner</MenuItem>
                                            <MenuItem value="dots">Bouncing Dots</MenuItem>
                                            <MenuItem value="pulse">Pulsing Circle</MenuItem>
                                            <MenuItem value="bars">Loading Bars</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {/* Spinner Color */}
                                    <ColorPicker
                                        label="Spinner Color"
                                        value={settings.splashScreen?.spinnerColor || '#000000'}
                                        onChange={(color) => setSettings({
                                            ...settings,
                                            splashScreen: {
                                                ...settings.splashScreen,
                                                spinnerColor: color,
                                            },
                                        })}
                                        helperText="Color of the loading spinner"
                                    />
                                </Box>
                            </Grid>
                        </Grid>

                        <Alert severity="info" sx={{ mt: 3 }}>
                            <strong>Tip:</strong> If no splash screen image is set, the background color will be used instead.
                            The loading spinner helps users know the app is loading.
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {/* Save Button */}
            {settings.enabled && (
                <Box display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving || !settings.appName || !settings.icons?.icon192 || !settings.icons?.icon512}
                        startIcon={saving ? <CircularProgress size={20} /> : <PhoneIphone />}
                        size="large"
                    >
                        {saving ? 'Saving...' : 'Save PWA Settings'}
                    </Button>
                </Box>
            )}
        </Box>
    );
}
