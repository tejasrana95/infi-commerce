import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Review | Admin',
    description: 'Update review details',
};

export default function EditReviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

