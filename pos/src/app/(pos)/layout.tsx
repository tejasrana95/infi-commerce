'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import POSLayout from '@/components/layout/POSLayout';

export default function PosLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <POSLayout>
                {children}
            </POSLayout>
        </ProtectedRoute>
    );
}
