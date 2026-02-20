import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Menu | Admin',
    description: 'Create a new menu',
};

export default function NewMenuLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
