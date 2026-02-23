import type { Metadata } from 'next';
import FilesLayoutClient from './layout-client';

export const metadata: Metadata = {
    title: 'Files | Admin',
    description: 'Manage files in admin',
};

export default function FilesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <FilesLayoutClient>{children}</FilesLayoutClient>;
}
