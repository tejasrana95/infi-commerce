import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Store | Admin',
    description: 'Update store details',
};

export default function EditStoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

