import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Review | Admin',
    description: 'Create a new review',
};

export default function NewReviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
