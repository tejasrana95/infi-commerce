'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCompare } from '@/providers/CompareProvider';
import styles from './CompareFloatingWidget.module.scss';

// ============================================
// Icons
// ============================================

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const CompareIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
    </svg>
);

const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

// ============================================
// Component
// ============================================

export default function CompareFloatingWidget() {
    const { items, removeFromCompare, clearCompare, config, compareCount } = useCompare();
    const [isVisible, setIsVisible] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Show widget when there are items
    useEffect(() => {
        setIsVisible(compareCount > 0);
    }, [compareCount]);

    // Don't render if feature is disabled or no items
    if (!config.enabled || config.widgetStyle === 'none' || !isVisible) {
        return null;
    }

    // Position class based on config
    const positionClass = {
        'bottom': styles.positionBottom,
        'bottom-right': styles.positionBottomRight,
        'bottom-left': styles.positionBottomLeft,
    }[config.widgetPosition] || styles.positionBottom;

    // Render drawer-style widget
    if (config.widgetStyle === 'drawer') {
        return (
            <>
                {/* Floating trigger button */}
                <button
                    className={`${styles.drawerTrigger} ${positionClass}`}
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Open compare drawer"
                >
                    <CompareIcon />
                    <span className={styles.badge}>{compareCount}</span>
                </button>

                {/* Overlay */}
                {isDrawerOpen && (
                    <div
                        className={styles.drawerOverlay}
                        onClick={() => setIsDrawerOpen(false)}
                    />
                )}

                {/* Drawer */}
                <div className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ''}`}>
                    {/* Drawer Header */}
                    <div className={styles.drawerHeader}>
                        <div className={styles.headerTitle}>
                            <CompareIcon />
                            <span>Compare Products ({compareCount})</span>
                        </div>
                        <button
                            className={styles.closeBtn}
                            onClick={() => setIsDrawerOpen(false)}
                            aria-label="Close drawer"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Drawer Content */}
                    <div className={styles.drawerContent}>
                        {items.map((item) => (
                            <div key={item.id} className={styles.drawerItem}>
                                <div className={styles.drawerItemImage}>
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            width={80}
                                            height={80}
                                            style={{ objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <div className={styles.noImage}>
                                            <CompareIcon />
                                        </div>
                                    )}
                                </div>
                                <div className={styles.drawerItemInfo}>
                                    <span className={styles.drawerItemName}>{item.name}</span>
                                </div>
                                <button
                                    className={styles.drawerRemoveBtn}
                                    onClick={() => removeFromCompare(item.id)}
                                    aria-label={`Remove ${item.name}`}
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}

                        {compareCount < 2 && (
                            <p className={styles.drawerHint}>
                                Add at least 2 products to compare
                            </p>
                        )}
                    </div>

                    {/* Drawer Footer */}
                    <div className={styles.drawerFooter}>
                        <button
                            className={styles.clearAllBtn}
                            onClick={clearCompare}
                        >
                            Clear All
                        </button>
                        <Link
                            href="/compare"
                            className={`${styles.compareNowBtn} ${compareCount < 2 ? styles.disabled : ''}`}
                            onClick={(e) => {
                                if (compareCount < 2) {
                                    e.preventDefault();
                                } else {
                                    setIsDrawerOpen(false);
                                }
                            }}
                        >
                            Compare Now
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    // Render floating-style widget (default)
    return (
        <div className={`${styles.widget} ${positionClass} ${isMinimized ? styles.minimized : ''}`}>
            {/* Minimized view - just icon and count */}
            {isMinimized ? (
                <button
                    className={styles.minimizedBtn}
                    onClick={() => setIsMinimized(false)}
                    aria-label="Expand compare widget"
                >
                    <CompareIcon />
                    <span className={styles.badge}>{compareCount}</span>
                </button>
            ) : (
                <>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerTitle}>
                            <CompareIcon />
                            <span>Compare ({compareCount})</span>
                        </div>
                        <div className={styles.headerActions}>
                            <button
                                className={styles.clearBtn}
                                onClick={clearCompare}
                                aria-label="Clear all"
                                title="Clear all"
                            >
                                <TrashIcon />
                            </button>
                            <button
                                className={styles.minimizeBtn}
                                onClick={() => setIsMinimized(true)}
                                aria-label="Minimize"
                                title="Minimize"
                            >
                                —
                            </button>
                        </div>
                    </div>

                    {/* Product thumbnails */}
                    <div className={styles.products}>
                        {items.map((item) => (
                            <div key={item.id} className={styles.productItem}>
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => removeFromCompare(item.id)}
                                    aria-label={`Remove ${item.name}`}
                                >
                                    <CloseIcon />
                                </button>
                                <div className={styles.productImage}>
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            width={60}
                                            height={60}
                                            style={{ objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <div className={styles.noImage}>
                                            <CompareIcon />
                                        </div>
                                    )}
                                </div>
                                <span className={styles.productName} title={item.name}>
                                    {item.name}
                                </span>
                            </div>
                        ))}

                        {/* Empty slots */}
                        {Array.from({ length: Math.max(0, 2 - compareCount) }).map((_, i) => (
                            <div key={`empty-${i}`} className={styles.emptySlot}>
                                <div className={styles.emptyIcon}>+</div>
                                <span>Add product</span>
                            </div>
                        ))}
                    </div>

                    {/* Compare button */}
                    <Link
                        href="/compare"
                        className={`${styles.compareBtn} ${compareCount < 2 ? styles.disabled : ''}`}
                        onClick={(e) => {
                            if (compareCount < 2) {
                                e.preventDefault();
                            }
                        }}
                    >
                        Compare Now
                        {compareCount < 2 && (
                            <span className={styles.minText}>(min 2)</span>
                        )}
                    </Link>
                </>
            )}
        </div>
    );
}
