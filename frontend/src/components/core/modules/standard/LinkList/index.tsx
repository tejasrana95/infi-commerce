import React from 'react';
import Link from 'next/link';
import { ModuleProps } from '../../index';
import styles from './LinkList.module.scss';
import DynamicIcon from '../../../common/DynamicIcon';
import Image from 'next/image';

interface LinkItem {
    id: string;
    label: string;
    type: 'page' | 'product' | 'category' | 'blog' | 'url';
    targetId?: string;
    targetSlug?: string;
    url?: string;
    icon?: string;
    image?: string;
    openInNewTab: boolean;
}

interface LinkListConfig {
    title?: string;
    style?: 'vertical' | 'horizontal' | 'grid' | 'featured' | 'minimalist';
    items?: LinkItem[];
}

export default function LinkList({ config }: ModuleProps) {
    const { title, style = 'vertical', items = [] } = config as LinkListConfig;

    if (!items || items.length === 0) return null;

    const resolveUrl = (item: LinkItem) => {
        if (item.type === 'url') return item.url || '#';
        if (!item.targetSlug && !item.targetId) return '#';
        
        const slug = item.targetSlug || item.targetId;
        switch (item.type) {
            case 'product': return `/products/${slug}`;
            case 'category': return `/categories/${slug}`;
            case 'blog': return `/blog/${slug}`;
            case 'page': return `/${slug}`;
            default: return '#';
        }
    };

    const renderLinkContent = (item: LinkItem, isFeatured: boolean = false) => {
        return (
            <div className={styles.linkContent}>
                {item.image && (
                    <div className={`${styles.imageWrapper} ${isFeatured ? styles.imageFeatured : ''}`}>
                        <Image src={item.image} alt={item.label} fill style={{ objectFit: 'cover' }} />
                    </div>
                )}
                {!item.image && item.icon && (
                    <div className={`${styles.iconWrapper} ${isFeatured ? styles.iconFeatured : ''}`}>
                        <DynamicIcon name={item.icon} />
                    </div>
                )}
                <span className={`${styles.linkLabel} ${isFeatured ? styles.labelFeatured : ''}`}>{item.label}</span>
                <div className={styles.chevronWrapper}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            </div>
        );
    };

    const renderList = () => {
        switch (style) {
            case 'horizontal':
                return (
                    <div className={styles.horizontalList}>
                        {items.map((item) => (
                            <Link key={item.id} href={resolveUrl(item)} target={item.openInNewTab ? '_blank' : undefined} className={styles.pillLink}>
                                {renderLinkContent(item)}
                            </Link>
                        ))}
                    </div>
                );
            case 'grid':
                return (
                    <div className={styles.gridList}>
                        {items.map((item) => (
                            <Link key={item.id} href={resolveUrl(item)} target={item.openInNewTab ? '_blank' : undefined} className={styles.cardLink}>
                                {renderLinkContent(item)}
                            </Link>
                        ))}
                    </div>
                );
            case 'featured': {
                const featuredItem = items[0];
                const secondaryItems = items.slice(1);
                return (
                    <div className={styles.featuredLayout}>
                        {featuredItem && (
                            <Link href={resolveUrl(featuredItem)} target={featuredItem.openInNewTab ? '_blank' : undefined} className={styles.featuredLink}>
                                {renderLinkContent(featuredItem, true)}
                            </Link>
                        )}
                        {secondaryItems.length > 0 && (
                            <div className={styles.secondaryLinks}>
                                {secondaryItems.map((item) => (
                                    <Link key={item.id} href={resolveUrl(item)} target={item.openInNewTab ? '_blank' : undefined} className={styles.secondaryLink}>
                                        {renderLinkContent(item)}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }
            case 'minimalist':
                return (
                    <ul className={styles.minimalistList}>
                        {items.map((item) => (
                            <li key={item.id}>
                                <Link href={resolveUrl(item)} target={item.openInNewTab ? '_blank' : undefined} className={styles.minimalistLink}>
                                    {renderLinkContent(item)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                );
            case 'vertical':
            default:
                return (
                    <div className={styles.verticalList}>
                        {items.map((item) => (
                            <Link key={item.id} href={resolveUrl(item)} target={item.openInNewTab ? '_blank' : undefined} className={styles.verticalLink}>
                                {renderLinkContent(item)}
                            </Link>
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className={styles.container}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {renderList()}
        </div>
    );
}
