'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import FormEditor from '@/components/organisms/FormEditor';
import { Form } from '@/types';
import api from '@/lib/api';
import { Box, CircularProgress } from '@mui/material';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [form, setForm] = useState<Form | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const response = await api.get(`/forms/${resolvedParams.id}`);
                setForm(response.data.form);
            } catch (error) {
                console.error('Error fetching form:', error);
                showNotification('Error loading form', 'error');
                router.push('/forms');
            } finally {
                setLoading(false);
            }
        };

        fetchForm();
    }, [resolvedParams.id, router]);

    const handleSave = async (formData: Partial<Form>) => {
        try {
            setSaving(true);
            await api.put(`/forms/${resolvedParams.id}`, formData);
            router.push('/forms');
        } catch (error: any) {
            console.error('Error updating form:', error);
            throw error; // Rethrow so FormEditor can show the error in ConfirmDialog
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!form) {
        return null;
    }

    return (
        <FormEditor
            form={form}
            onSave={handleSave}
            onBack={() => router.push('/forms')}
            saving={saving}
        />
    );
}
