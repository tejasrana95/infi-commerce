// MegaMenu — Rewritten
// Full-width mega dropdown navigation — pure CSS positioning

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { MenuRendererProps, MenuItem } from '@/types/menu';
import MenuLink from '../MenuLink';
import MegaMenuProductCard from '../MegaMenuProductCard';
import api from '@/lib/api';
import styles from './MegaMenu.module.scss';

// ─── CategoryProducts ───────────────────────────────────────────────────────
function CategoryProducts({ item, onNavigate }: { item: MenuItem; onNavigate?: () => void }) {
    const [products, setProducts] = useState<any[]>(item.products || []);
    const [loading, setLoading] = useState(false);

    const shouldFetch =
        item.type === 'category' &&
        item.categoryId &&
        item.autoAddProducts !== false &&
        (!item.products || item.products.length === 0);

    useEffect(() => {
        if (!shouldFetch) return;
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    categoryId: item.categoryId!,
                    limit: String(item.productLimit || 10),
                });
                const res = await api.get(`products?${params}`);
                if (!cancelled) setProducts(res.products || res.data || []);
            } catch {
                /* silent */
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.categoryId, item.productLimit, shouldFetch]);

    const displayMode = item.categoryDisplayMode || 'list';
    const columns = item.categoryColumns || 2;
    const showImage = item.showProductImage ?? true;
    const showPrice = item.showProductPrice ?? true;
    const showRating = item.showProductRating ?? false;
    const imageSize = item.productImageSize || 'small';
    const imagePosition = item.imagePosition || 'left';

    if (loading) return <div className={styles.loading}>Loading products…</div>;
    if (!products?.length) return null;

    const cards = products.map((p) => (
        <MegaMenuProductCard
            key={p._id}
            product={p}
            showImage={showImage}
            showPrice={showPrice}
            showRating={showRating}
            imageSize={imageSize}
            displayMode={displayMode === 'list' ? 'list' : displayMode}
            imagePosition={imagePosition}
            onClick={onNavigate}
        />
    ));

    if (displayMode === 'list') {
        return <div className={styles.productList}>{cards}</div>;
    }

    return (
        <div className={styles.productGrid} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {cards}
        </div>
    );
}

// ─── SubItem renderer ───────────────────────────────────────────────────────
function SubItem({
    subItem,
    settings,
    themeColors,
    onItemClick,
    onNavigate,
}: {
    subItem: MenuItem;
    settings: any;
    themeColors: any;
    onItemClick: any;
    onNavigate?: () => void;
}) {
    if (subItem.type === 'divider') return <hr className={styles.divider} />;

    if (subItem.type === 'image' && subItem.imageUrl) {
        return (
            <Link href={subItem.imageLink || subItem.linkUrl || '#!'} className={styles.imageLink} onClick={onNavigate}>
                <Image
                    src={subItem.imageUrl}
                    alt={subItem.label || subItem.imageAlt || ''}
                    width={160}
                    height={160}
                    style={{ width: '100%', height: 'auto' }}
                />
            </Link>
        );
    }

    if (subItem.type === 'custom-link') {
        return (
            <Link
                href={subItem.linkUrl || '#!'}
                className={styles.customLink}
                target={subItem.openInNewTab ? '_blank' : undefined}
                onClick={onNavigate}
            >
                {subItem.label || subItem.linkLabel || subItem.linkUrl}
            </Link>
        );
    }

    if (subItem.type === 'page') {
        return (
            <Link href={`/${subItem.pageSlug || subItem.pageId}`} className={styles.pageLink} onClick={onNavigate}>
                {subItem.label || subItem.pageName || 'Page'}
            </Link>
        );
    }

    if (subItem.type === 'product') {
        const list = subItem.products || [];
        return (
            <div className={styles.productSection}>
                {subItem.label && <span className={styles.sectionLabel}>{subItem.label}</span>}
                {list.length > 0 && (
                    <div className={styles.productList}>
                        {list.map((p: any) => (
                            <Link
                                key={p._id}
                                href={`/${p.slug || p._id}`}
                                className={styles.productLink}
                                onClick={onNavigate}
                            >
                                {p.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (subItem.type === 'category') {
        const slug = subItem.categorySlug || subItem.categoryId;
        const label = subItem.label || subItem.categoryName || 'Category';
        const hasChildren = subItem.children && subItem.children.length > 0;
        return (
            <div className={styles.categorySection}>
                {subItem.categoryId ? (
                    <Link href={`/${slug}`} className={styles.categoryLabel} onClick={onNavigate}>{label}</Link>
                ) : (
                    <span className={styles.categoryLabelStatic}>{label}</span>
                )}
                {hasChildren && (
                    <ul className={styles.categoryLinks}>
                        {subItem.children.map((child) => (
                            <li key={child.id} className={styles.categoryLinkItem}>
                                <MenuLink
                                    item={child}
                                    showIcon={false}
                                    onClick={() => onNavigate?.()}
                                />
                            </li>
                        ))}
                    </ul>
                )}
                {subItem.productLimit != null && subItem.productLimit > 0 && (
                    <CategoryProducts item={subItem} onNavigate={onNavigate} />
                )}
            </div>
        );
    }

    return (
        <MenuLink
            item={subItem as any}
            showIcon={settings?.showIcons}
            themeColors={themeColors}
            onClick={(item, event) => {
                onNavigate?.();
                onItemClick?.(item, event);
            }}
        />
    );
}

// ─── Chevron ────────────────────────────────────────────────────────────────
const Chevron = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
    </svg>
);

// ─── Main MegaMenu ──────────────────────────────────────────────────────────
export default function MegaMenu({
    items,
    className = '',
    themeColors,
    settings,
    onItemClick,
}: MenuRendererProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const searchKey = searchParams.toString();
    const [forceClosed, setForceClosed] = useState(false);
    const closeUntilRef = useRef(0);

    const handleMenuNavigate = useCallback((item?: MenuItem, event?: React.MouseEvent<HTMLElement>) => {
        closeUntilRef.current = Date.now() + 400;
        setForceClosed(true);
        if (item) onItemClick?.(item, event);
    }, [onItemClick]);

    // Re-enable hover behavior after actual route change
    useEffect(() => {
        setForceClosed(false);
    }, [pathname, searchKey]);

    const renderMegaContent = (item: MenuItem) => {
        if (!item.megaMenu?.sections?.length) return null;

        return (
            <div
                className={styles.megaDropdown}
                style={{
                    maxHeight: item.megaMenu.maxHeight ? `${item.megaMenu.maxHeight}px` : undefined,
                }}
            >
                {item.megaMenu.sections.map((section) => (
                    <div
                        key={section.id}
                        className={styles.megaContent}
                        style={{
                            backgroundColor: section.settings?.backgroundColor,
                            padding: section.settings?.padding ? `${section.settings.padding}px` : undefined,
                        }}
                    >
                        <div className={styles.columns}>
                            {section.columns.map((col) => (
                                <div
                                    key={col.id}
                                    className={styles.column}
                                    style={{ width: `${(col.width / 12) * 100}%` }}
                                >
                                    <ul className={styles.columnList}>
                                        {col.items.map((sub) => (
                                            <li key={sub.id} className={styles.columnItem}>
                                                <SubItem
                                                    subItem={sub}
                                                    settings={settings}
                                                    themeColors={themeColors}
                                                    onItemClick={onItemClick}
                                                    onNavigate={() => handleMenuNavigate(item)}
                                                />
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

    const renderItem = (item: MenuItem) => {
        if (item.type === 'divider') return <li key={item.id} className={styles.dividerVert} />;

        const hasMega =
            item.type === 'mega-menu' && (item.megaMenu?.sections?.length ?? 0) > 0;
        const hasChildren = item.children?.length > 0;
        const hasCatProducts =
            item.type === 'category' && item.autoAddProducts !== false && !!item.categoryId;
        const hasCategoryChildren = item.type === 'category' && hasChildren;

        const showChevron = hasMega || hasChildren || hasCatProducts || hasCategoryChildren;

        const cls = [
            styles.menuItem,
            hasCatProducts && !hasMega && styles.hasCategoryDropdown,
        ].filter(Boolean).join(' ');

        return (
            <li key={item.id} className={cls}>
                <div className={styles.trigger}>
                    <MenuLink
                        item={item}
                        showIcon={settings.showIcons}
                        themeColors={themeColors}
                        onClick={handleMenuNavigate}
                    />
                    {showChevron && <Chevron className={styles.chevron} />}
                </div>

                {hasMega ? (
                    renderMegaContent(item)
                ) : (hasCatProducts || hasCategoryChildren) ? (
                    <div className={styles.categoryDropdown}>
                        {hasCategoryChildren && (
                            <ul className={styles.categoryLinks}>
                                {item.children.map((child) => (
                                    <li key={child.id} className={styles.categoryLinkItem}>
                                        <MenuLink
                                            item={child}
                                            showIcon={settings.showIcons}
                                            themeColors={themeColors}
                                            onClick={handleMenuNavigate}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                        <CategoryProducts item={item} onNavigate={() => handleMenuNavigate(item)} />
                    </div>
                ) : null}
            </li>
        );
    };

    return (
        <nav
            className={`${styles.megaMenu} ${forceClosed ? styles.forceClosed : ''} ${className}`}
            onMouseLeave={() => {
                if (Date.now() < closeUntilRef.current) return;
                setForceClosed(false);
            }}
        >
            <ul className={styles.menuList}>
                {items.map(renderItem)}
            </ul>
        </nav>
    );
}
