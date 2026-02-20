import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Blog Category | Admin',
    description: 'Create a new blog category',
};

export default function NewBlogCategoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
