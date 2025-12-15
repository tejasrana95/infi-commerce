'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Box,
    Container,
    Paper,
    Tabs,
    Tab,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import PageHeader from '@/components/molecules/PageHeader';
import HeaderDesigner from '@/components/organisms/HeaderDesigner/HeaderDesigner';
import FooterDesigner from '@/components/organisms/FooterDesigner/FooterDesigner';
import GeneralThemeSettings from '@/components/organisms/GeneralThemeSettings';
import TemplateSelector from '@/components/organisms/TemplateSelector/TemplateSelector';
import { ThemeConfig, Store } from '@/types';
import api from '@/lib/api';

export default function ThemeSettingsPage() {
    const params = useParams();
    const storeId = params.id as string;

    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [store, setStore] = useState<Store | null>(null);
    const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
        templateId: 'modern-clean', // Default template
        header: {
            main: {
                layout: 'default',
                sections: [
                    { id: 'left', position: 'left', items: [] },
                    { id: 'center', position: 'center', items: [] },
                    { id: 'right', position: 'right', items: [] },
                ],
            },
        },
        footer: {
            sections: [],
        },
    });

    useEffect(() => {
        fetchStoreAndTheme();
    }, [storeId]);

    const fetchStoreAndTheme = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/stores/${storeId}`);
            const storeData = response.data.store || response.data;
            setStore(storeData);

            if (storeData.theme) {
                setThemeConfig(storeData.theme);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load theme configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            await api.put(`/stores/${storeId}`, {
                theme: themeConfig,
            });

            // Show success message
            setError(null);
            alert('Theme configuration saved successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save theme configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Theme Settings"
                subtitle={`Configure header and footer for ${store?.name || 'store'}`}
                backUrl={`/stores`}
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
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Templates" />
                    <Tab label="Header" />
                    <Tab label="Footer" />
                    <Tab label="General" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {activeTab === 0 && (
                        <TemplateSelector
                            currentConfig={themeConfig}
                            onSelect={(newConfig) => {
                                setThemeConfig(newConfig);
                                alert('Template applied! Click "Save Changes" to persist.');
                            }}
                        />
                    )}

                    {activeTab === 1 && (
                        <HeaderDesigner
                            config={themeConfig}
                            onChange={setThemeConfig}
                            storeId={storeId}
                        />
                    )}

                    {activeTab === 2 && (
                        <FooterDesigner
                            config={themeConfig}
                            onChange={setThemeConfig}
                            storeId={storeId}
                        />
                    )}

                    {activeTab === 3 && (
                        <GeneralThemeSettings
                            config={themeConfig}
                            onChange={setThemeConfig}
                        />
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
