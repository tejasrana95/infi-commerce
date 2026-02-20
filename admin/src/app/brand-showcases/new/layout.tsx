import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Brand Showcase | Admin',
    description: 'Create a new brand showcase',
};

export default function NewBrandShowcaseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
