import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Attribute | Admin',
    description: 'Create a new attribute',
};

export default function NewAttributeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
