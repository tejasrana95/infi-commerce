'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormEditor from '@/components/organisms/FormEditor';
import { Form } from '@/types';
import api from '@/lib/api';

export default function NewFormPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const handleSave = async (formData: Partial<Form>) => {
        try {
            setSaving(true);
            await api.post('/forms', formData);
            router.push('/forms');
        } catch (error: any) {
            console.error('Error creating form:', error);
            throw error; // Rethrow so FormEditor can show the error in ConfirmDialog
        } finally {
            setSaving(false);
        }
    };

    return (
        <FormEditor
            onSave={handleSave}
            onBack={() => router.push('/forms')}
            saving={saving}
        />
    );
}
