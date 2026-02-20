import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Banner Slider | Admin',
    description: 'Create a new banner slider',
};

export default function NewBannerSliderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
