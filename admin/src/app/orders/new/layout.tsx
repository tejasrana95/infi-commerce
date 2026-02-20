import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Order | Admin',
    description: 'Create a new order',
};

export default function NewOrderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
