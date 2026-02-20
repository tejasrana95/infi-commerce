import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Shipping Method | Admin',
    description: 'Create a new shipping method',
};

export default function NewShippingMethodLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
