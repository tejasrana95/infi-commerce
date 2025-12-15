'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { LoadingSpinner } from '@/components/atoms';
import { LayoutDesigner } from '@/components/organisms/LayoutDesigner';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';
import { Layout } from '@/types';

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
            setLayout(response.data.layout || response.data.data);
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
