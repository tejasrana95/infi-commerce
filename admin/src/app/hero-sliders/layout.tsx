import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hero Sliders | Admin',
    description: 'Manage hero slider editor configuration',
};


export default function HeroSlidersLayout({
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
