import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Customer | Admin',
    description: 'Update customer details',
};

export default function EditCustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

