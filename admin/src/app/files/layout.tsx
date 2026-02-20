import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Files | Admin',
    description: 'Manage files in admin',
};

'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function FilesLayout({
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
