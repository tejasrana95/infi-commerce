import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Brand Showcase | Admin',
    description: 'Update brand showcase details',
};

export default function EditBrandShowcaseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

