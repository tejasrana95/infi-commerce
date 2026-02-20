import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Blog Category | Admin',
    description: 'Update blog category details',
};

export default function EditBlogCategoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

