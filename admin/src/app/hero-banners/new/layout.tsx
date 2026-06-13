import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Hero Banner | Admin',
    description: 'Add a new custom hero banner',
};

export default function NewHeroBannerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
