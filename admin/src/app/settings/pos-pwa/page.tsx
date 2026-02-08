'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    CircularProgress,
    Typography,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import PageHeader from '@/components/molecules/PageHeader';
import POSPWASettings from '@/components/organisms/POSPWASettings/POSPWASettings';
import api from '@/lib/api';

interface POSPWASettingsType {
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

export default function POSPWASettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();

    const [settings, setSettings] = useState<POSPWASettingsType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Auth check
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'super_admin')) {
            router.push(user ? '/dashboard' : '/login');
        }
    }, [user, authLoading, router]);

    // Fetch global POS PWA settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings/pos-pwa');
                setSettings(response.data.settings || {
                    enabled: false,
                    appName: 'POS System',
                    appShortName: 'POS',
                    themeColor: '#1a1a2e',
                    backgroundColor: '#0f0f23',
                    icons: {},
                    offlineSettings: {
                        cacheTTL: 24,
                        precacheProducts: false,
                        offlineMessage: 'You are currently offline. Some features may be limited.',
                    },
                    installPromptStyle: 'toast',
                });
            } catch (error: any) {
                showNotification('Failed to load POS PWA settings', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (user && user.role === 'super_admin') {
            fetchSettings();
        }
    }, [user, showNotification]);

    const handleSave = async (newSettings: POSPWASettingsType) => {
        setSaving(true);
        try {
            await api.put('/settings/pos-pwa', newSettings);
            setSettings(newSettings);
            showNotification('POS PWA settings saved successfully', 'success');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading || !user || user.role !== 'super_admin') {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="50vh">
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="POS PWA Settings"
                subtitle="Configure Progressive Web App settings for your Point of Sale system (applies globally to all stores)"
                backUrl="/settings"
            />

            {/* Settings Component */}
            {settings && (
                <POSPWASettings
                    initialSettings={settings}
                    onSave={handleSave}
                    saving={saving}
                />
            )}
        </Box>
    );
}
