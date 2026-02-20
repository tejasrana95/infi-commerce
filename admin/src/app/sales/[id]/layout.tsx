import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Sale | Admin',
    description: 'Update sale details',
};

export default function EditSaleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

