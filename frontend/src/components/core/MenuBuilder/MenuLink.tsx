// MenuLink Component
// Renders a single menu item link with proper URL handling

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
    onClick?: (item: MenuItem) => void;
    menuPosition?: 'header' | 'mobile' | 'footer' | 'sidebar';
}

export default function MenuLink({
    item,
    showIcon = false,
    themeColors,
    onClick,
    menuPosition = 'header',
}: MenuLinkProps) {
    // Generate URL based on item type
    const getUrl = (): string => {
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
    };

    const handleClick = () => {
        if (onClick) {
            onClick(item);
        }
    };

    const url = getUrl();
    const target = item.openInNewTab ? '_blank' : undefined;
    const rel = item.openInNewTab ? 'noopener noreferrer' : undefined;

    // Badge style - use theme primary color as default if badge doesn't specify color
    const badgeStyle: React.CSSProperties = item.badge ? {
        backgroundColor: item.badge.color || themeColors?.primary || '#000',
        color: '#fff',
    } : {};

    if (item.type === 'dropdown') {
        return (
            <span
                className={styles.menuLink}
                onClick={handleClick}
                style={{ cursor: 'default' }}
            >
                {/* Icon */}
                {showIcon && item.icon && (
                    <span className={styles.icon}>
                        {item.icon.startsWith('http') ? (
                            <img src={item.icon} alt="" />
                        ) : (
                            <i className={item.icon} />
                        )}
                    </span>
                )}

                {/* Label */}
                <span className={styles.label}>{item.label}</span>

                {/* Badge */}
                {item.badge && (
                    <span
                        className={styles.badge}
                        style={badgeStyle}
                    >
                        {item.badge.text}
                    </span>
                )}
            </span>
        );
    }

    return (
        <Link
            href={url}
            className={`${styles.menuLink} infi-track`}
            target={target}
            rel={rel}
            onClick={handleClick}
            data-ga-widget={`menu_${menuPosition}`}
            data-ga-category="navigation"
        >
            {/* Icon */}
            {showIcon && item.icon && (
                <span className={styles.icon}>
                    {item.icon.startsWith('http') ? (
                        <img src={item.icon} alt="" />
                    ) : (
                        <i className={item.icon} />
                    )}
                </span>
            )}

            {/* Label */}
            <span className={styles.label}>{item.label}</span>

            {/* Badge */}
            {item.badge && (
                <span
                    className={styles.badge}
                    style={badgeStyle}
                >
                    {item.badge.text}
                </span>
            )}
        </Link>
    );
}
