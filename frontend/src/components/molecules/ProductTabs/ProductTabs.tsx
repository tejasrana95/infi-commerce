'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
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
    const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({ left: 0, width: 0, opacity: 0 });
    const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

    // Filter tabs that should be shown
    const visibleTabs = tabs.filter(tab => tab.show !== false);

    useEffect(() => {
        if (typeof window === 'undefined' || visibleTabs.length === 0) return;

        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (!hash) return;
            const index = visibleTabs.findIndex(tab => tab.id === hash);
            if (index !== -1) {
                if (layout === 'tabs') {
                    setActiveTab(index);
                } else if (layout === 'accordion') {
                    setExpandedAccordions(prev => {
                        const next = new Set(prev);
                        next.add(index);
                        return next;
                    });
                }
                const element = document.getElementById(hash);
                if (element) {
                    const headerOffset = 150; // Offset for sticky headers
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.scrollY - headerOffset;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        };

        // Run on mount and listen to hashchange
        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [visibleTabs, layout]);

    useEffect(() => {
        if (layout !== 'tabs' || visibleTabs.length === 0) return;

        const updateIndicator = () => {
            const activeElement = tabRefs.current[activeTab];
            if (activeElement) {
                setIndicatorStyle({
                    left: activeElement.offsetLeft,
                    width: activeElement.offsetWidth,
                    opacity: 1,
                });
            }
        };

        const timer = setTimeout(updateIndicator, 50);

        window.addEventListener('resize', updateIndicator);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateIndicator);
        };
    }, [activeTab, visibleTabs, layout]);

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

    const handleTabClick = (index: number, tabId: string) => {
        setActiveTab(index);
        if (typeof window !== 'undefined') {
            window.history.pushState(null, '', `#${tabId}`);
        }
    };

    const handleAccordionClick = (index: number, tabId: string) => {
        toggleAccordion(index);
        if (typeof window !== 'undefined') {
            const nextExpanded = new Set(expandedAccordions);
            const isExpanding = !nextExpanded.has(index);
            if (isExpanding) {
                window.history.pushState(null, '', `#${tabId}`);
            } else if (window.location.hash === `#${tabId}`) {
                window.history.pushState(null, '', window.location.pathname + window.location.search);
            }
        }
    };

    // Tabs Layout
    if (layout === 'tabs') {
        return (
            <div className={`${styles.tabsContainer} ${className}`}>
                <div className={styles.tabList} role="tablist" style={{ position: 'relative' }}>
                    <div className={styles.activeIndicator} style={indicatorStyle} />
                    {visibleTabs.map((tab, index) => (
                        <a
                            key={tab.id}
                            ref={(el) => { tabRefs.current[index] = el; }}
                            href={`#${tab.id}`}
                            role="tab"
                            aria-selected={activeTab === index}
                            className={`${styles.tab} ${activeTab === index ? styles.active : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                handleTabClick(index, tab.id);
                            }}
                        >
                            {tab.label}
                        </a>
                    ))}
                </div>
                <div key={activeTab} id={visibleTabs[activeTab]?.id} className={styles.tabContent} role="tabpanel">
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
                    <div key={tab.id} id={tab.id} className={styles.accordionItem}>
                        <a
                            href={`#${tab.id}`}
                            className={`${styles.accordionHeader} ${expandedAccordions.has(index) ? styles.expanded : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                handleAccordionClick(index, tab.id);
                            }}
                            aria-expanded={expandedAccordions.has(index)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', width: '100%' }}
                        >
                            <span>{tab.label}</span>
                            <span className={styles.accordionIcon}>
                                {expandedAccordions.has(index) ? '−' : '+'}
                            </span>
                        </a>
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
                <section key={tab.id} id={tab.id} className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <a href={`#${tab.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {tab.label}
                        </a>
                    </h2>
                    <div className={styles.sectionContent}>
                        {tab.content}
                    </div>
                </section>
            ))}
        </div>
    );
}
