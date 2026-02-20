import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Banner | Admin',
    description: 'Create a new banner',
};

export default function NewBannerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
