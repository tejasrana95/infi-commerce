import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'POS Sessions | Admin',
    description: 'Manage pos sessions in admin',
};


export default function POSSessionsLayout({
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
