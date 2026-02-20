import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Order | Admin',
    description: 'Update order details',
};

export default function EditOrderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

