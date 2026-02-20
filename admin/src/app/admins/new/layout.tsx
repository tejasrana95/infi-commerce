import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Admin User | Admin',
    description: 'Create a new admin user',
};

export default function NewAdminUserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
