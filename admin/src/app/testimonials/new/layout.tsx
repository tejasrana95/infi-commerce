import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Testimonial | Admin',
    description: 'Create a new testimonial',
};

export default function NewTestimonialLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
