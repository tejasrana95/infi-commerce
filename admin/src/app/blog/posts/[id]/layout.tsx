import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Blog Post | Admin',
    description: 'Update blog post details',
};

export default function EditBlogPostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

