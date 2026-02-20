import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Form | Admin',
    description: 'Update form details',
};

export default function EditFormLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

