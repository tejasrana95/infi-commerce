// MenuLink — Rewritten
// Renders a single menu item as a link with proper URL resolution

'use client';

import React from 'react';
import Link from 'next/link';
import { MenuItem } from '@/types/menu';
import styles from './MenuLink.module.scss';

interface MenuLinkProps {
    item: MenuItem;
    showIcon?: boolean;
    themeColors?: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    onClick?: (item: MenuItem, event?: React.MouseEvent<HTMLElement>) => void;
    menuPosition?: 'header' | 'mobile' | 'footer' | 'sidebar';
    className?: string;
}

function resolveUrl(item: MenuItem): string {
    switch (item.type) {
        case 'link':
            if (item.url?.startsWith('http') || item.url?.startsWith('#') || item.url?.startsWith('/')) {
                return item.url;
            }
            return `/${item.url || '#!'}`;
        case 'category':
            return `/${item.categorySlug}`;
        case 'product':
            return `/${item.productSlug || '#!'}`;
        case 'page':
            return `/${item.pageSlug}`;
        case 'blog-category':
            return `/blog/category/${item.blogCategoryId}`;
        case 'dropdown':
            return '#!';
        default:
            return '#!';
    }
}

export default function MenuLink({
    item,
    showIcon = false,
    themeColors,
    onClick,
    menuPosition = 'header',
    className,
}: MenuLinkProps) {
    const handleClick = (event: React.MouseEvent<HTMLElement>) => onClick?.(item, event);

    const url = resolveUrl(item);
    const target = item.openInNewTab ? '_blank' : undefined;
    const rel = item.openInNewTab ? 'noopener noreferrer' : undefined;

    const badgeStyle: React.CSSProperties | undefined = item.badge
        ? { backgroundColor: item.badge.color || themeColors?.primary || '#000', color: '#fff' }
        : undefined;

    const inner = (
        <>
            {showIcon && item.icon && (
                <span className={styles.icon}>
                    {item.icon.startsWith('http') ? (
                        <img src={item.icon} alt="" />
                    ) : (
                        <i className={item.icon} />
                    )}
                </span>
            )}
            <span className={styles.label}>{item.label}</span>
            {item.badge && (
                <span className={styles.badge} style={badgeStyle}>
                    {item.badge.text}
                </span>
            )}
        </>
    );

    const cls = [styles.menuLink, className].filter(Boolean).join(' ');

    if (item.type === 'dropdown') {
        return (
            <span className={cls} onClick={handleClick} style={{ cursor: 'default' }}>
                {inner}
            </span>
        );
    }

    return (
        <Link
            href={url}
            className={`${cls} infi-track`}
            target={target}
            rel={rel}
            onClick={handleClick}
            data-ga-widget={`menu_${menuPosition}`}
            data-ga-category="navigation"
        >
            {inner}
        </Link>
    );
}
