import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Category | Admin',
    description: 'Create a new category',
};

export default function NewCategoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
