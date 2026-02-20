import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Page | Admin',
    description: 'Create a new page',
};

export default function NewPageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
