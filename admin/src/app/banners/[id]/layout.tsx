import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Banner | Admin',
    description: 'Update banner details',
};

export default function EditBannerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

