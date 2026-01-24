'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import POCLayout from '@/components/layout/POCLayout';

export default function PosLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <POCLayout>
                {children}
            </POCLayout>
        </ProtectedRoute>
    );
}
