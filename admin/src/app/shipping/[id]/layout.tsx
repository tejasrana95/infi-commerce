import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Shipping Method | Admin',
    description: 'Update shipping method details',
};

export default function EditShippingMethodLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

