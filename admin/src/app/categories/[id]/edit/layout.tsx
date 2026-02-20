import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Category | Admin',
    description: 'Update category details',
};

export default function EditCategoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

