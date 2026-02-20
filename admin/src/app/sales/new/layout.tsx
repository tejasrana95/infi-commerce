import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Sale | Admin',
    description: 'Create a new sale',
};

export default function NewSaleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
