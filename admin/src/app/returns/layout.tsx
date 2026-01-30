import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Returns & Exchanges | Admin',
    description: 'Manage customer return and exchange requests',
};

export default function ReturnsLayout({
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
