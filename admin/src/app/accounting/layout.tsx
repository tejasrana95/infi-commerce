import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Accounting | Admin',
    description: 'View profit and loss reports and manage order accounting',
};

export default function AccountingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedRoute>
        <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>;
}
