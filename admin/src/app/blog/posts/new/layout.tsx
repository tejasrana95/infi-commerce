import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Blog Post | Admin',
    description: 'Create a new blog post',
};

export default function NewBlogPostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
