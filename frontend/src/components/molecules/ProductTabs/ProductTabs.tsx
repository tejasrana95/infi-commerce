'use client';

import React, { useState, ReactNode } from 'react';
import styles from './ProductTabs.module.scss';

interface Tab {
    id: string;
    label: string;
    content: ReactNode;
    show?: boolean;
}

interface ProductTabsProps {
    tabs: Tab[];
    config?: {
        layout?: 'tabs' | 'accordion' | 'sections';
    };
    className?: string;
}

export default function ProductTabs({
    tabs,
    config = {},
    className = '',
}: ProductTabsProps) {
    const { layout = 'tabs' } = config;
    const [activeTab, setActiveTab] = useState(0);
    const [expandedAccordions, setExpandedAccordions] = useState<Set<number>>(new Set([0]));

    // Filter tabs that should be shown
    const visibleTabs = tabs.filter(tab => tab.show !== false);

    if (visibleTabs.length === 0) return null;

    const toggleAccordion = (index: number) => {
        const newExpanded = new Set(expandedAccordions);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedAccordions(newExpanded);
    };

    // Tabs Layout
    if (layout === 'tabs') {
        return (
            <div className={`${styles.tabsContainer} ${className}`}>
                <div className={styles.tabList} role="tablist">
                    {visibleTabs.map((tab, index) => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === index}
                            className={`${styles.tab} ${activeTab === index ? styles.active : ''}`}
                            onClick={() => setActiveTab(index)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className={styles.tabContent} role="tabpanel">
                    {visibleTabs[activeTab]?.content}
                </div>
            </div>
        );
    }

    // Accordion Layout
    if (layout === 'accordion') {
        return (
            <div className={`${styles.accordionContainer} ${className}`}>
                {visibleTabs.map((tab, index) => (
                    <div key={tab.id} className={styles.accordionItem}>
                        <button
                            className={`${styles.accordionHeader} ${expandedAccordions.has(index) ? styles.expanded : ''}`}
                            onClick={() => toggleAccordion(index)}
                            aria-expanded={expandedAccordions.has(index)}
                        >
                            <span>{tab.label}</span>
                            <span className={styles.accordionIcon}>
                                {expandedAccordions.has(index) ? '−' : '+'}
                            </span>
                        </button>
                        <div
                            className={`${styles.accordionContent} ${expandedAccordions.has(index) ? styles.expanded : ''}`}
                        >
                            <div className={styles.innerContent}>
                                {tab.content}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Sections Layout
    return (
        <div className={`${styles.sectionsContainer} ${className}`}>
            {visibleTabs.map((tab) => (
                <section key={tab.id} className={styles.section}>
                    <h2 className={styles.sectionTitle}>{tab.label}</h2>
                    <div className={styles.sectionContent}>
                        {tab.content}
                    </div>
                </section>
            ))}
        </div>
    );
}
