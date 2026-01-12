'use client';

import React from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { ModuleProps } from '../..';
import styles from './PricingTable.module.scss';
import { useStore } from '@/providers/StoreProvider';

interface PricingFeature {
    text: string;
    included: boolean;
}

interface PricingPlan {
    id: string;
    name: string;
    price: string;
    currency: string;
    period: string; // e.g., /mo, /yr
    features: PricingFeature[];
    ctaText: string;
    ctaLink: string;
    isFeatured: boolean;
    badge?: string; // e.g., "Best Value"
}

interface PricingTableConfig {
    plans: PricingPlan[];
    columns: number;
}

export default function PricingTableModule({ config }: ModuleProps) {
    const {
        plans = [],
        columns = 3
    } = config as PricingTableConfig;

    const { themeConfig } = useStore();
    const primaryColor = themeConfig?.colors?.primary || '#3b82f6';

    const gridStyle = {
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
    } as React.CSSProperties;

    // Helper to calculate slightly darker shade for hover (simplified)
    const cardStyle = {
        '--primary-color': primaryColor,
    } as React.CSSProperties;

    return (
        <div className={styles.pricingContainer}>
            <div className={styles.grid} style={gridStyle}>
                {plans.map((plan, index) => (
                    <div
                        key={plan.id || index}
                        className={`${styles.pricingCard} ${plan.isFeatured ? styles.featured : ''}`}
                        style={cardStyle}
                    >
                        {plan.badge && (
                            <div className={styles.badge}>{plan.badge}</div>
                        )}

                        <div className={styles.header}>
                            <h3 className={styles.planName}>{plan.name}</h3>
                            <div className={styles.priceWrapper}>
                                <span className={styles.currency}>{plan.currency}</span>
                                <span className={styles.price}>{plan.price}</span>
                                {plan.period && <span className={styles.period}>{plan.period}</span>}
                            </div>
                        </div>

                        <ul className={styles.features}>
                            {plan.features.map((feature, idx) => (
                                <li
                                    key={idx}
                                    className={`${styles.feature} ${feature.included ? '' : styles.featureExcluded}`}
                                >
                                    {feature.included ? (
                                        <Check size={18} className={styles.featureIncluded} />
                                    ) : (
                                        <X size={18} className={styles.featureExcluded} />
                                    )}
                                    <span>{feature.text}</span>
                                </li>
                            ))}
                        </ul>

                        <Link
                            href={plan.ctaLink || '#!'}
                            className={styles.ctaButton}
                            onClick={(e) => {
                                if (!plan.ctaLink || plan.ctaLink === '#' || plan.ctaLink === '#!') {
                                    e.preventDefault();
                                }
                            }}
                            data-track="pricing_plan_select"
                            data-plan-name={plan.name}
                            data-plan-price={plan.price}
                            data-plan-period={plan.period}
                        >
                            {plan.ctaText || 'Choose Plan'}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
