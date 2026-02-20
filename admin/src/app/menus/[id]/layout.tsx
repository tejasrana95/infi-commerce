import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Menu | Admin',
    description: 'Update menu details',
};

export default function EditMenuLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

