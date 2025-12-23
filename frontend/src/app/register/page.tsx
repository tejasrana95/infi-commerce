'use client';

import { Suspense } from 'react';
import { getComponent } from '@/components/templates/registry';
import { useStore } from '@/providers/StoreProvider';

export default function RegisterPage() {
    const { store } = useStore();
    const templateId = store?.theme?.templateId || 'modern-clean';
    const AuthPage = getComponent('AuthPage', templateId);

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <AuthPage type="register" />
        </Suspense>
    );
}
