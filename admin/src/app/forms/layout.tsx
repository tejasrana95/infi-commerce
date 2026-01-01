'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function FormsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardLayout>{children}</DashboardLayout>
    );
}
