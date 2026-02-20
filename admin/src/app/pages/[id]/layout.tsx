import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Page | Admin',
    description: 'Update page details',
};

export default function EditPageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

