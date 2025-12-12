import AppLayout from '@/components/organisms/AppLayout';

export default function FilesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppLayout>{children}</AppLayout>;
}
