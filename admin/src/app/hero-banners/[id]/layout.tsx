import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Hero Banner | Admin',
    description: 'Update custom hero banner properties',
};

export default function EditHeroBannerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
