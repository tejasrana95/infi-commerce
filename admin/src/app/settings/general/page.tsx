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
    Tab,
    Tabs,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PageHeader from '@/components/molecules/PageHeader';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import AiSettings from '@/components/organisms/AiSettings/AiSettings';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

interface BrandingSettings {
    name: string;
    logo: string;
    favicon: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function GeneralSettings() {
    const [activeTab, setActiveTab] = useState(0);
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
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            showNotification('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box>
            <PageHeader
                title="General Settings"
                subtitle="Customize the appearance, identity, and intelligence of your administration panel."
                backUrl="/settings"
            />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab icon={<BrandingWatermarkIcon />} iconPosition="start" label="Branding" />
                    <Tab icon={<SmartToyIcon />} iconPosition="start" label="AI Configuration" />
                </Tabs>
            </Box>

            <CustomTabPanel value={activeTab} index={0}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                        <CircularProgress />
                    </Box>
                ) : (
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
                )}
            </CustomTabPanel>

            <CustomTabPanel value={activeTab} index={1}>
                <AiSettings />
            </CustomTabPanel>
        </Box>
    );
}
