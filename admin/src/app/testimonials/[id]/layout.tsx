import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Testimonial | Admin',
    description: 'Update testimonial details',
};

export default function EditTestimonialLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

