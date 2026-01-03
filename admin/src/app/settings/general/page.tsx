'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '@/components/molecules/PageHeader';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

interface BrandingSettings {
    name: string;
    logo: string;
    favicon: string;
}

export default function GeneralSettings() {
    const [settings, setSettings] = useState<BrandingSettings>({
        name: 'Infi Commerce',
        logo: '',
        favicon: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings/admin-branding');
                if (response.data.success) {
                    setSettings(response.data.branding);
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
                showNotification('Failed to load settings', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [showNotification]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.put('/settings/admin-branding', settings);
            if (response.data.success) {
                showNotification('Settings updated successfully', 'success');
                // Force a reload of the layout by emitting an event or using a broadcast channel if needed,
                // but for now, the user can refresh or we can use a more reactive approach later.
                window.location.reload(); // Simple way to refresh branding across layout
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            showNotification('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="General Settings"
                subtitle="Customize the appearance and identity of your administration panel."
                backUrl="/settings"
            />

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Admin Branding
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                                These settings control how the admin panel identifies itself.
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Admin Name"
                                    placeholder="e.g., My Company Admin"
                                    value={settings.name}
                                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                    helperText="This name replaces 'Infi Commerce' in the menu, login page, and browser titles."
                                />

                                <Divider />

                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                        Admin Logo
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                        Upload a square logo to display in the sidebar. (Recommended: 80x80px)
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={3}>
                                        <Box
                                            sx={{
                                                width: 100,
                                                height: 100,
                                                borderRadius: 2,
                                                bgcolor: 'grey.50',
                                                border: '1px dashed',
                                                borderColor: 'divider',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {settings.logo ? (
                                                <img
                                                    src={settings.logo}
                                                    alt="Logo"
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">No Logo</Typography>
                                            )}
                                        </Box>
                                        <Box display="flex" gap={2}>
                                            <FileManagerButton
                                                onSelect={(files) => setSettings({ ...settings, logo: files[0].url })}
                                                label="Select Logo"
                                                variant="outlined"
                                                size="small"
                                            />
                                            {settings.logo && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => setSettings({ ...settings, logo: '' })}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                        Admin Favicon
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                        Upload an icon (.ico, .png) to display in the browser tab.
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={3}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 1,
                                                bgcolor: 'grey.50',
                                                border: '1px dashed',
                                                borderColor: 'divider',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {settings.favicon ? (
                                                <img
                                                    src={settings.favicon}
                                                    alt="Favicon"
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">None</Typography>
                                            )}
                                        </Box>
                                        <Box display="flex" gap={2}>
                                            <FileManagerButton
                                                onSelect={(files) => setSettings({ ...settings, favicon: files[0].url })}
                                                label="Select Favicon"
                                                variant="outlined"
                                                size="small"
                                            />
                                            {settings.favicon && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => setSettings({ ...settings, favicon: '' })}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    disabled={saving}
                                    onClick={handleSave}
                                    sx={{ px: 4, py: 1, borderRadius: 2 }}
                                >
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'primary.50', borderColor: 'primary.100' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom color="primary.main">
                                Preview Information
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Changes made here will affect all administrators. Ensure high-quality images are used for branding.
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Alert severity="info" sx={{ bgcolor: 'white' }}>
                                    System updates may be required after saving for all changes to take full effect across active sessions.
                                </Alert>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
