import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Banners | Admin',
    description: 'Manage banners in admin',
};


export default function BannersLayout({
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
