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
import { TextField } from '@mui/material';
import PageHeader from '@/components/molecules/PageHeader';
import HeaderDesigner from '@/components/organisms/HeaderDesigner/HeaderDesigner';
import FooterDesigner from '@/components/organisms/FooterDesigner/FooterDesigner';
import GeneralThemeSettings from '@/components/organisms/GeneralThemeSettings';
import TemplateSelector from '@/components/organisms/TemplateSelector/TemplateSelector';
import ProductCardSettings from '@/components/organisms/ProductCardSettings/ProductCardSettings';
import CategorySettings from '@/components/organisms/CategorySettings/CategorySettings';
import ProductPageSettings from '@/components/organisms/ProductPageSettings/ProductPageSettings';
import CompareSettings from '@/components/organisms/CompareSettings/CompareSettings';
import { ThemeConfig, Store } from '@/types';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';

export default function ThemeSettingsPage() {
    const params = useParams();
    const storeId = params.id as string;
    const { showNotification } = useNotification();

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
            showNotification('Theme configuration saved successfully!', 'success');
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
                    <Tab label="Product Card" />
                    <Tab label="Category" />
                    <Tab label="Product Page" />
                    <Tab label="Compare" />
                    <Tab label="General" />
                    <Tab label="Advanced" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {activeTab === 0 && (
                        <TemplateSelector
                            currentConfig={themeConfig}
                            onSelect={(newConfig) => {
                                setThemeConfig(newConfig);
                                showNotification('Template applied! Click "Save Changes" to persist.', 'info');
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
                        <ProductCardSettings
                            config={themeConfig}
                            onChange={setThemeConfig}
                        />
                    )}

                    {activeTab === 4 && (
                        <CategorySettings
                            config={themeConfig}
                            onChange={setThemeConfig}
                        />
                    )}

                    {activeTab === 5 && (
                        <ProductPageSettings
                            config={themeConfig}
                            onChange={setThemeConfig}
                        />
                    )}

                    {activeTab === 6 && (
                        <CompareSettings
                            config={themeConfig}
                            onChange={setThemeConfig}
                        />
                    )}

                    {activeTab === 7 && (
                        <GeneralThemeSettings
                            config={themeConfig}
                            onChange={setThemeConfig}
                        />
                    )}

                    {activeTab === 8 && (
                        <Box sx={{ p: 3 }}>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Please ensure you only inject scripts from verified authors. Improper scripts may affect site security and performance.
                            </Alert>
                            <Box mt={2}>
                                <TextField
                                    label="Header Script (HTML/JS/CSS)"
                                    multiline
                                    rows={6}
                                    fullWidth
                                    variant="outlined"
                                    value={themeConfig.customScripts?.header || ''}
                                    onChange={(e) => setThemeConfig(prev => ({
                                        ...prev,
                                        customScripts: {
                                            ...prev.customScripts,
                                            header: e.target.value,
                                        },
                                    }))}
                                />
                            </Box>
                            <Box mt={2}>
                                <TextField
                                    label="Footer Script (HTML/JS/CSS)"
                                    multiline
                                    rows={6}
                                    fullWidth
                                    variant="outlined"
                                    value={themeConfig.customScripts?.footer || ''}
                                    onChange={(e) => setThemeConfig(prev => ({
                                        ...prev,
                                        customScripts: {
                                            ...prev.customScripts,
                                            footer: e.target.value,
                                        },
                                    }))}
                                />
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
