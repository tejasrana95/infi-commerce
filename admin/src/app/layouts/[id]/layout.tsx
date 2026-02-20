import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Layout | Admin',
    description: 'Update layout details',
};

export default function EditLayoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

