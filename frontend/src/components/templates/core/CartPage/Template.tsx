// CartPage Template - Presentation layer
// Renders layout sections using SectionRenderer

'use client';

import SectionRenderer from '@/components/core/layout/SectionRenderer';
import { Section } from '@/types/layout';
import styles from './CartPage.module.scss';

interface CartTemplateProps {
    layout: Section[];
}

export default function CartTemplate({
    layout
}: CartTemplateProps) {
    if (!layout || layout.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>No cart layout configured.</p>
            </div>
        );
    }

    return (
        <div className={styles.cartPage}>
            {layout.map((section) => (
                <SectionRenderer
                    key={section.id}
                    section={section}
                />
            ))}
        </div>
    );
}
