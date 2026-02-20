import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Customer | Admin',
    description: 'Create a new customer',
};

export default function NewCustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
