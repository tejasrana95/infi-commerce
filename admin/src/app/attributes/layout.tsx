import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Attributes | Admin',
    description: 'Manage attributes in admin',
};


export default function AttributesLayout({
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
