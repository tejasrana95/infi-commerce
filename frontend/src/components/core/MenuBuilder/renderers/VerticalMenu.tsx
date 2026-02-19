// VerticalMenu — Rewritten
// Stacked vertical navigation with smooth CSS-animated expand/collapse

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

    const shouldToggleOnLinkClick = (item: MenuItem, hasChildren: boolean) => {
        if (!hasChildren || item.type !== 'link') return false;
        const rawUrl = (item.url || '').trim();
        return rawUrl === '' || rawUrl === '#' || rawUrl === '#!';
    };

    const toggleItem = (id: string) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const renderItem = (item: MenuItem, currentDepth: number) => {
        if (item.type === 'divider') {
            return <li key={item.id} className={styles.divider} />;
        }

        const hasChildren = item.children?.length > 0 && currentDepth < settings.maxDepth;
        const isExpanded = expandedItems.has(item.id);
        const canToggleFromLink = shouldToggleOnLinkClick(item, hasChildren);

        return (
            <li
                key={item.id}
                className={`${styles.menuItem} ${hasChildren ? styles.hasChildren : ''}`}
            >
                <div
                    className={styles.itemWrapper}
                    role={canToggleFromLink ? 'button' : undefined}
                    tabIndex={canToggleFromLink ? 0 : undefined}
                    onClick={(event) => {
                        if (!canToggleFromLink) return;
                        event.preventDefault();
                        toggleItem(item.id);
                    }}
                    onKeyDown={(event) => {
                        if (!canToggleFromLink) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleItem(item.id);
                        }
                    }}
                >
                    <MenuLink
                        item={item}
                        showIcon={settings.showIcons}
                        themeColors={themeColors}
                        onClick={(clickedItem, event) => {
                            if (canToggleFromLink) {
                                event?.preventDefault();
                                return;
                            }
                            onItemClick?.(clickedItem);
                        }}
                    />
                    {hasChildren && (
                        <button
                            className={`${styles.toggleBtn} ${isExpanded ? styles.expanded : ''}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                toggleItem(item.id);
                            }}
                            aria-label="Toggle submenu"
                            aria-expanded={isExpanded}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>
                    )}
                </div>

                {hasChildren && (
                    <div className={`${styles.submenuWrapper} ${isExpanded ? styles.open : ''}`}>
                        <div className={styles.submenuInner}>
                            <ul
                                className={styles.submenu}
                                style={{ paddingLeft: `${1 + currentDepth * 0.5}rem` }}
                            >
                                {item.children.map((child) => renderItem(child, currentDepth + 1))}
                            </ul>
                        </div>
                    </div>
                )}
            </li>
        );
    };

    return (
        <nav className={`${styles.verticalMenu} ${className}`}>
            <ul className={styles.menuList}>
                {items.map((item) => renderItem(item, depth))}
            </ul>
        </nav>
    );
}
