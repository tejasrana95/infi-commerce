import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Payment Gateway | Admin',
    description: 'Create a new payment gateway',
};

export default function NewPaymentGatewayLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
