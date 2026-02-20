import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Product | Admin',
    description: 'Create a new product',
};

export default function NewProductLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
