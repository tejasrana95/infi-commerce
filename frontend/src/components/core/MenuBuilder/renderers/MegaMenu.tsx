// Mega Menu Renderer
// Full-width dropdown with columns and featured content

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MenuRendererProps, MenuItem } from '@/types/menu';
import MenuLink from '../MenuLink';
import styles from './MegaMenu.module.scss';

export default function MegaMenu({
    items,
    className = '',
    themeColors,
    settings,
    onItemClick,
}: MenuRendererProps) {
    const [activeItem, setActiveItem] = useState<string | null>(null);

    const renderMegaMenuContent = (item: MenuItem) => {
        if (!item.megaMenu || !item.megaMenu.sections || item.megaMenu.sections.length === 0) return null;
        return (
            <div className={styles.megaMenuDropdown}>
                {item.megaMenu.sections.map((section) => (
                    <div
                        key={section.id}
                        className={styles.megaMenuContent}
                        style={{
                            backgroundColor: section.settings?.backgroundColor,
                            padding: section.settings?.padding ? `${section.settings.padding}px` : undefined,
                        }}
                    >
                        {/* Columns */}
                        <div className={styles.columns}>
                            {section.columns.map((column) => (
                                <div
                                    key={column.id}
                                    className={styles.column}
                                    style={{
                                        width: `${(column.width / 12) * 100}%`,
                                    }}
                                >
                                    <ul className={styles.columnList}>
                                        {column.items.map((subItem) => (
                                            <li key={subItem.id} className={styles.columnItem}>
                                                {subItem.type === 'divider' ? (
                                                    <hr className={styles.divider} />
                                                ) : subItem.type === 'image' && subItem.imageUrl ? (
                                                    <Link href={subItem.linkUrl || '#!'} className={styles.imageLink}>
                                                        <img src={subItem.imageUrl} alt={subItem.label || ''} />
                                                    </Link>
                                                ) : subItem.type === 'custom-link' ? (
                                                    <Link href={subItem.linkUrl || '#!'} className={styles.customLink}>
                                                        {subItem.label || subItem.linkUrl}
                                                    </Link>
                                                ) : (
                                                    <MenuLink
                                                        item={subItem as any}
                                                        showIcon={settings.showIcons}
                                                        themeColors={themeColors}
                                                        onClick={onItemClick}
                                                    />
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderMenuItem = (item: MenuItem) => {
        if (item.type === 'divider') {
            return <li key={item.id} className={styles.divider} />;
        }

        const hasMegaMenu = item.type === 'mega-menu' && item.megaMenu;
        const hasChildren = item.children && item.children.length > 0;
        const isActive = activeItem === item.id;

        return (
            <li
                key={item.id}
                className={`${styles.menuItem} ${hasMegaMenu || hasChildren ? styles.hasDropdown : ''} ${isActive ? styles.active : ''}`}
                onMouseEnter={() => setActiveItem(item.id)}
                onMouseLeave={() => setActiveItem(null)}
            >
                <MenuLink
                    item={item}
                    showIcon={settings.showIcons}
                    themeColors={themeColors}
                    onClick={onItemClick}
                />

                {hasMegaMenu && renderMegaMenuContent(item)}
            </li>
        );
    };

    return (
        <nav className={`${styles.megaMenu} ${className}`}>
            <ul className={styles.menuList}>
                {items.map(renderMenuItem)}
            </ul>
        </nav>
    );
}
