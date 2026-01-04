import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Grid,
    CircularProgress,
    Alert,
    InputAdornment,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

interface AiSettingsData {
    enabled: boolean;
    openaiKey: string;
    model: string;
}

export default function AiSettings() {
    const [settings, setSettings] = useState<AiSettingsData>({
        enabled: false,
        openaiKey: '',
        model: 'gpt-4o'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings/admin-ai');
                if (response.data.success) {
                    setSettings(response.data.settings);
                }
            } catch (error) {
                console.error('Failed to fetch AI settings:', error);
                showNotification('Failed to load AI settings', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [showNotification]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.put('/settings/admin-ai', settings);
            if (response.data.success) {
                showNotification('AI settings updated successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to save AI settings:', error);
            showNotification('Failed to save AI settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            Admin AI Assistant Configuration
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            Configure the AI Assistant to help generate content for products, categories, and more.
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Enable AI Assistant
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Turn on to show the floating AI assistant on edit pages.
                                    </Typography>
                                </Box>
                                <Switch
                                    checked={settings.enabled}
                                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                                    inputProps={{ 'aria-label': 'Enable AI Assistant' }}
                                />
                            </Box>

                            <TextField
                                fullWidth
                                label="OpenAI API Key"
                                placeholder="sk-..."
                                type={showKey ? 'text' : 'password'}
                                value={settings.openaiKey}
                                onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowKey(!showKey)}
                                                edge="end"
                                            >
                                                {showKey ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                helperText="Your OpenAI API Key is stored securely and never shared."
                            />

                            <FormControl fullWidth>
                                <InputLabel>Model</InputLabel>
                                <Select
                                    value={settings.model}
                                    label="Model"
                                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                                >
                                    <MenuItem value="gpt-5.2">GPT-5.2 (Best for Coding & Agents)</MenuItem>
                                    <MenuItem value="gpt-5.2-pro">GPT-5.2 Pro (Smart & Precise)</MenuItem>
                                    <MenuItem value="gpt-5-mini">GPT-5 Mini (Fast & Cost-efficient)</MenuItem>
                                    <MenuItem value="gpt-5-nano">GPT-5 Nano (Fastest)</MenuItem>
                                    <MenuItem value="gpt-5">GPT-5 (Previous Reasoning Model)</MenuItem>
                                    <MenuItem value="o1">o1 (High-tier Reasoning)</MenuItem>
                                    <MenuItem value="o1-mini">o1-mini (Fast Reasoning)</MenuItem>
                                    <MenuItem value="o3-mini">o3-mini (Advanced Small Reasoning)</MenuItem>
                                    <MenuItem value="gpt-4o">GPT-4o (Modern Multimodal)</MenuItem>
                                    <MenuItem value="gpt-4o-mini">GPT-4o Mini</MenuItem>
                                </Select>
                            </FormControl>

                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    disabled={saving}
                                    onClick={handleSave}
                                    sx={{ px: 4, py: 1, borderRadius: 2 }}
                                >
                                    {saving ? 'Saving...' : 'Save Configuration'}
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'primary.50', borderColor: 'primary.100' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom color="primary.main">
                            About AI Assistant
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            The AI Assistant uses OpenAI to help you generate high-quality content for your store.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            It can write product descriptions, optimize SEO tags, and suggest keywords based on your product data.
                        </Typography>
                        <Alert severity="warning" sx={{ bgcolor: 'white' }}>
                            Usage costs apply based on your OpenAI plan. Ensure you have sufficient credits.
                        </Alert>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}
