import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Product Option | Admin',
    description: 'Update product option details',
};

export default function EditProductOptionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

