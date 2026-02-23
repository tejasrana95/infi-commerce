import type { Metadata } from 'next';
import FormsLayoutClient from './layout-client';

export const metadata: Metadata = {
    title: 'Forms | Admin',
    description: 'Manage forms in admin',
};

export default function FormsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <FormsLayoutClient>{children}</FormsLayoutClient>;
}
