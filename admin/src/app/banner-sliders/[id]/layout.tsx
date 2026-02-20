import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Banner Slider | Admin',
    description: 'Update banner slider details',
};

export default function EditBannerSliderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

