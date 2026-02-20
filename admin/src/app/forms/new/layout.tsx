import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Form | Admin',
    description: 'Create a new form',
};

export default function NewFormLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
