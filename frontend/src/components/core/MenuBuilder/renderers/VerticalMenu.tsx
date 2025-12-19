// Vertical Menu Renderer
// Stacked vertical navigation (for sidebar/footer)

'use client';

import React, { useState } from 'react';
import { MenuRendererProps, MenuItem } from '@/types/menu';
import MenuLink from '../MenuLink';
import styles from './VerticalMenu.module.scss';

export default function VerticalMenu({
    items,
    className = '',
    themeColors,
    settings,
    depth = 0,
    onItemClick,
}: MenuRendererProps) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const toggleItem = (itemId: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedItems(newExpanded);
    };

    const renderMenuItem = (item: MenuItem, currentDepth: number) => {
        if (item.type === 'divider') {
            return <li key={item.id} className={styles.divider} />;
        }

        const hasChildren = item.children && item.children.length > 0 && currentDepth < settings.maxDepth;
        const isExpanded = expandedItems.has(item.id);

        return (
            <li key={item.id} className={`${styles.menuItem} ${hasChildren ? styles.hasChildren : ''}`}>
                <div className={styles.itemWrapper}>
                    <MenuLink
                        item={item}
                        showIcon={settings.showIcons}
                        themeColors={themeColors}
                        onClick={onItemClick}
                    />
                    {hasChildren && (
                        <button
                            className={`${styles.toggleBtn} ${isExpanded ? styles.expanded : ''}`}
                            onClick={() => toggleItem(item.id)}
                            aria-label="Toggle submenu"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <ul className={styles.submenu} style={{ paddingLeft: `${1 + currentDepth * 0.5}rem` }}>
                        {item.children.map((child) => renderMenuItem(child, currentDepth + 1))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <nav className={`${styles.verticalMenu} ${className}`}>
            <ul className={styles.menuList}>
                {items.map((item) => renderMenuItem(item, depth))}
            </ul>
        </nav>
    );
}
