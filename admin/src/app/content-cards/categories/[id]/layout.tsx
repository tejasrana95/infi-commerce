import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Content Card Category | Admin',
    description: 'Update content card category details',
};

export default function EditContentCardCategoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

