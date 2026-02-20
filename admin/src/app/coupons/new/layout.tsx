import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Coupon | Admin',
    description: 'Create a new coupon',
};

export default function NewCouponLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
