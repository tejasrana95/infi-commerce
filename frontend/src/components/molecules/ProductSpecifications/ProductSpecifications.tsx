'use client';

import React from 'react';
import styles from './ProductSpecifications.module.scss';

interface Specification {
    name: string;
    value: string | number | boolean | string[];
}

interface ProductSpecificationsProps {
    specifications: Specification[];
    config?: {
        show?: boolean;
        layout?: 'tab' | 'list';
    };
    className?: string;
}

export default function ProductSpecifications({
    specifications,
    config = {},
    className = '',
}: ProductSpecificationsProps) {
    const { show = true, layout = 'tab' } = config;

    if (!show || !specifications || specifications.length === 0) {
        return null;
    }

    const formatValue = (value: string | number | boolean | string[]): string => {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        return String(value);
    };

    // Tab layout renders as content for a tab (just the table)
    // List layout renders with a heading as standalone section
    if (layout === 'list') {
        return (
            <section className={`${styles.specificationsSection} ${className}`}>
                <h2 className={styles.sectionTitle}>Specifications</h2>
                <table className={styles.specTable}>
                    <tbody>
                        {specifications.map((spec, index) => (
                            <tr key={index} className={styles.specRow}>
                                <th className={styles.specLabel}>{spec.name}</th>
                                <td className={styles.specValue}>{formatValue(spec.value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        );
    }

    // Tab layout - just return the table
    return (
        <div className={`${styles.specificationsTab} ${className}`}>
            <table className={styles.specTable}>
                <tbody>
                    {specifications.map((spec, index) => (
                        <tr key={index} className={styles.specRow}>
                            <th className={styles.specLabel}>{spec.name}</th>
                            <td className={styles.specValue}>{formatValue(spec.value)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
