import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Product Option | Admin',
    description: 'Create a new product option',
};

export default function NewProductOptionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
