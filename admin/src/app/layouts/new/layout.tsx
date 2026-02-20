import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Layout | Admin',
    description: 'Create a new layout',
};

export default function NewLayoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
