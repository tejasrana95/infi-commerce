import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Content Card | Admin',
    description: 'Update content card details',
};

export default function EditContentCardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

