import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Coupon | Admin',
    description: 'Update coupon details',
};

export default function EditCouponLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

