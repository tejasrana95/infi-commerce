'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { LoadingSpinner } from '@/components/atoms';
import { LayoutDesigner } from '@/components/organisms/LayoutDesigner';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';
import { Layout, Store, CategoryConfig, DEFAULT_CATEGORY_CONFIG } from '@/types';
import {
    createCategoryDefaultLayout,
    isCategoryLayoutEmpty,
    createSearchDefaultLayout,
    isSearchLayoutEmpty,
    CategoryFilterPosition
} from '@/components/organisms/LayoutDesigner/types';

type PageParams = Promise<{ id: string }>;

export default function LayoutDesignerPage({ params }: { params: PageParams }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { showNotification } = useNotification();

    const [layout, setLayout] = useState<Layout | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchLayout();
    }, [resolvedParams.id]);

    const fetchLayout = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/layouts/${resolvedParams.id}`);
            let fetchedLayout = response.data.layout || response.data.data;

            // For category layouts, auto-generate split layout if empty
            if (fetchedLayout.type === 'category' && isCategoryLayoutEmpty(fetchedLayout.sections)) {
                try {
                    // Fetch store's category config to determine layout
                    const storeId = typeof fetchedLayout.storeId === 'object'
                        ? fetchedLayout.storeId._id
                        : fetchedLayout.storeId;

                    const storeResponse = await api.get(`/stores/${storeId}`);
                    const store: Store = storeResponse.data.store || storeResponse.data;

                    // Get category config from theme or use defaults
                    const categoryConfig: CategoryConfig = {
                        ...DEFAULT_CATEGORY_CONFIG,
                        ...store.theme?.category,
                    };

                    // Generate default category layout based on config
                    const filterPosition = categoryConfig.filters?.position || 'left';
                    const sidebarWidth = categoryConfig.filters?.sidebarWidth || 280;

                    fetchedLayout = {
                        ...fetchedLayout,
                        sections: createCategoryDefaultLayout(
                            filterPosition as CategoryFilterPosition,
                            sidebarWidth
                        ),
                    };

                    showNotification('Generated default category layout based on your theme settings', 'info');
                } catch (err) {
                    console.error('Failed to fetch store config, using defaults', err);
                    // Fall back to default left sidebar layout
                    fetchedLayout = {
                        ...fetchedLayout,
                        sections: createCategoryDefaultLayout('left', 280),
                    };
                }
            }

            // For search layouts, auto-generate split layout if empty
            if (fetchedLayout.type === 'search' && isSearchLayoutEmpty(fetchedLayout.sections)) {
                try {
                    // Fetch store's config to determine layout (using category config as base since search shares it)
                    const storeId = typeof fetchedLayout.storeId === 'object'
                        ? fetchedLayout.storeId._id
                        : fetchedLayout.storeId;

                    const storeResponse = await api.get(`/stores/${storeId}`);
                    const store: Store = storeResponse.data.store || storeResponse.data;

                    // Search layout often mirrors category layout, so we use category settings or defaults
                    // We could also look for store.theme?.search if it existed
                    const categoryConfig: CategoryConfig = {
                        ...DEFAULT_CATEGORY_CONFIG,
                        ...store.theme?.category,
                    };

                    const filterPosition = categoryConfig.filters?.position || 'left';
                    const sidebarWidth = categoryConfig.filters?.sidebarWidth || 280;

                    fetchedLayout = {
                        ...fetchedLayout,
                        sections: createSearchDefaultLayout(
                            filterPosition as CategoryFilterPosition,
                            sidebarWidth
                        ),
                    };

                    showNotification('Generated default search layout based on your theme settings', 'info');
                } catch (err) {
                    console.error('Failed to fetch store config for search, using defaults', err);
                    fetchedLayout = {
                        ...fetchedLayout,
                        sections: createSearchDefaultLayout('left', 280),
                    };
                }
            }

            setLayout(fetchedLayout);
        } catch (err: any) {
            console.error('Failed to fetch layout', err);
            showNotification(err.response?.data?.message || 'Failed to load layout', 'error');
            router.push('/layouts');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (updatedLayout: Layout) => {
        setLayout(updatedLayout);
    };

    const handleSave = async () => {
        if (!layout) return;

        try {
            setIsSaving(true);
            await api.put(`/layouts/${layout._id}`, {
                name: layout.name,
                description: layout.description,
                type: layout.type,
                sections: layout.sections,
                settings: layout.settings,
                seo: layout.seo,
                isDefault: layout.isDefault,
                status: layout.status,
            });
            showNotification('Layout saved successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to save layout', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        router.push('/layouts');
    };

    if (loading) {
        return <LoadingSpinner message="Loading layout..." />;
    }

    if (!layout) {
        return null;
    }

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <LayoutDesigner
                layout={layout}
                onChange={handleChange}
                onSave={handleSave}
                onBack={handleBack}
                isSaving={isSaving}
            />
        </Box>
    );
}
