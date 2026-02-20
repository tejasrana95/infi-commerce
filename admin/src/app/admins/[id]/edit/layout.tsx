import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Admin User | Admin',
    description: 'Update admin user details',
};

export default function EditAdminUserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

