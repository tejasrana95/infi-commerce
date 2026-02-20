import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Payment Gateways | Admin',
    description: 'Manage payment gateways in admin',
};


export default function PaymentGatewaysLayout({
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
