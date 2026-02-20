import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Forms | Admin',
    description: 'Manage forms in admin',
};

'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function FormsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <DashboardLayout>{children}</DashboardLayout>
        </ProtectedRoute>
    );
}
