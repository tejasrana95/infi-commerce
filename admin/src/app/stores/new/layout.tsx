import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Store | Admin',
    description: 'Create a new store',
};

export default function NewStoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
