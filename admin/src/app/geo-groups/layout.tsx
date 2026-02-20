import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Geo Groups | Admin',
    description: 'Manage geo groups in admin',
};


export default function GeoGroupsLayout({
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
