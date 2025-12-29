// CheckoutPage Template - Presentation layer
// Renders layout sections using SectionRenderer

'use client';

import SectionRenderer from '@/components/core/layout/SectionRenderer';
import { Section } from '@/types/layout';
import styles from './CheckoutPage.module.scss'; // Keeping styles for outer container if any

interface CheckoutTemplateProps {
    layout: Section[];
}

export default function CheckoutTemplate({
    layout
}: CheckoutTemplateProps) {
    // If no layout is provided, we might want to show a fallback or error
    // But typically layout should be present.
    if (!layout || layout.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>No checkout layout configured.</p>
            </div>
        );
    }

    return (
        <div className={styles.checkoutPage}>
            {layout.map((section) => (
                <SectionRenderer
                    key={section.id}
                    section={section}
                />
            ))}
        </div>
    );
}
