import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Payment Gateway | Admin',
    description: 'Update payment gateway details',
};

export default function EditPaymentGatewayLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

