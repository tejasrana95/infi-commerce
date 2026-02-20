import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Attribute | Admin',
    description: 'Update attribute details',
};

export default function EditAttributeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

