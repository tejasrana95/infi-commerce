// HorizontalMenu — Rewritten
// Pure CSS dropdown positioning — no JS getBoundingClientRect / resize listeners

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MenuRendererProps, MenuItem } from '@/types/menu';
import MenuLink from '../MenuLink';
import MegaMenuProductCard from '../MegaMenuProductCard';
import DynamicIcon from '../../common/DynamicIcon';
import api from '@/lib/api';
import styles from './HorizontalMenu.module.scss';
import Image from 'next/image';

// ─── CategoryProducts ───────────────────────────────────────────────────────
function CategoryProducts({ item }: { item: MenuItem }) {
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
    const showViewAll = item.showViewAll ?? false;
    const categorySlug = item.categorySlug || item.categoryId;

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
        />
    ));

    const viewAll = showViewAll && item.categoryId && (
        <div className={styles.viewAllContainer}>
            <Link href={`/${categorySlug}`} className={styles.viewAllBtn}>
                View All Products <DynamicIcon name="move-right" size={16} />
            </Link>
        </div>
    );

    if (displayMode === 'list') {
        return <div className={styles.productList}>{cards}{viewAll}</div>;
    }

    return (
        <>
            <div className={styles.productGrid} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {cards}
            </div>
            {viewAll}
        </>
    );
}

function ConfigurableProductItem({ item }: { item: MenuItem }) {
    const [resolvedProduct, setResolvedProduct] = useState<any | null>(item.products?.[0] || null);

    useEffect(() => {
        if (resolvedProduct || !item.productId) return;
        let cancelled = false;

        (async () => {
            try {
                const res = await api.get(`products/${item.productId}`);
                const product = res.product || res.data?.product || res.data || null;
                if (!cancelled && product) {
                    setResolvedProduct(product);
                }
            } catch {
                /* silent */
            }
        })();

        return () => { cancelled = true; };
    }, [item.productId, resolvedProduct]);

    const showImage = item.showProductImage ?? false;
    const showPrice = item.showProductPrice ?? false;
    const showRating = item.showProductRating ?? false;
    const imageSize = item.productImageSize || 'small';
    const imagePosition = item.imagePosition || 'left';
    const shouldRenderCard = showImage || showPrice || showRating || imagePosition !== 'left';

    if (!shouldRenderCard) {
        const productHref = `/${item.productSlug || item.productId || '#!'}`;
        return (
            <Link href={productHref} className={styles.megaProductLink}>
                {item.label || resolvedProduct?.name || 'Product'}
            </Link>
        );
    }

    if (!resolvedProduct) return null;

    return (
        <MegaMenuProductCard
            product={resolvedProduct}
            showImage={showImage}
            showPrice={showPrice}
            showRating={showRating}
            imageSize={imageSize}
            displayMode="list"
            imagePosition={imagePosition}
        />
    );
}

// ─── MegaSubItem ────────────────────────────────────────────────────────────
function MegaSubItem({ item }: { item: MenuItem }) {
    if (item.type === 'divider') return <hr className={styles.megaDivider} />;

    if (item.type === 'image' && item.imageUrl) {
        return (
            <div className={styles.megaSubItem}>
                <Link href={item.imageLink || item.linkUrl || '#!'} className={styles.megaImageLink}>
                    <Image width={300} height={200} src={item.imageUrl} alt={item.label || item.imageAlt || ''} />
                </Link>
            </div>
        );
    }

    if (item.type === 'custom-link') {
        return (
            <div className={styles.megaSubItem}>
                <Link
                    href={item.linkUrl || '#!'}
                    className={styles.megaCustomLink}
                    target={item.openInNewTab ? '_blank' : undefined}
                >
                    {item.label || item.linkLabel || item.linkUrl}
                </Link>
            </div>
        );
    }

    if (item.type === 'page') {
        return (
            <div className={styles.megaSubItem}>
                <Link href={`/${item.pageSlug || item.pageId}`} className={styles.megaPageLink}>
                    {item.label || item.pageName || 'Page'}
                </Link>
            </div>
        );
    }

    if (item.type === 'product') {
        const list = item.products || [];
        const showImage = item.showProductImage ?? false;
        const showPrice = item.showProductPrice ?? false;
        const showRating = item.showProductRating ?? false;
        const imageSize = item.productImageSize || 'small';
        const imagePosition = item.imagePosition || 'left';
        const shouldRenderCards = showImage || showPrice || showRating || imagePosition !== 'left';

        return (
            <div className={styles.megaSubItem}>
                {item.label && <span className={styles.categoryLabelStatic}>{item.label}</span>}
                {list.length > 0 ? (
                    shouldRenderCards ? (
                        <div className={styles.productList}>
                            {list.map((product) => (
                                <MegaMenuProductCard
                                    key={product._id}
                                    product={product}
                                    showImage={showImage}
                                    showPrice={showPrice}
                                    showRating={showRating}
                                    imageSize={imageSize}
                                    displayMode="list"
                                    imagePosition={imagePosition}
                                />
                            ))}
                        </div>
                    ) : (
                        <ul className={styles.megaProductList}>
                            {list.map((p) => (
                                <li key={p._id} className={styles.megaProductItem}>
                                    <Link href={`/${p.slug || p._id}`} className={styles.megaProductLink}>
                                        {p.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )
                ) : (
                    <ConfigurableProductItem item={item} />
                )}
            </div>
        );
    }

    if (item.type === 'category') {
        const slug = item.categorySlug || item.categoryId;
        const label = item.label || item.categoryName || 'Category';
        const hasChildren = item.children && item.children.length > 0;
        return (
            <div className={styles.megaSubItem}>
                {item.categoryId ? (
                    <Link href={`/${slug}`} className={styles.categoryLabel}>{label}</Link>
                ) : (
                    <span className={styles.categoryLabelStatic}>{label}</span>
                )}
                {hasChildren && (
                    <ul className={styles.categoryLinks}>
                        {item.children.map((child) => (
                            <li key={child.id} className={styles.categoryLinkItem}>
                                <MenuLink
                                    item={child}
                                    showIcon={false}
                                />
                            </li>
                        ))}
                    </ul>
                )}
                {item.productLimit != null && item.productLimit > 0 && (
                    <CategoryProducts item={item} />
                )}
            </div>
        );
    }

    return null;
}

// ─── Chevron SVG ────────────────────────────────────────────────────────────
const Chevron = () => (
    <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
    </svg>
);

// ─── Main HorizontalMenu ───────────────────────────────────────────────────
export default function HorizontalMenu({
    items,
    className = '',
    themeColors,
    settings,
    depth = 0,
    onItemClick,
}: MenuRendererProps) {

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
                        className={styles.megaSection}
                        style={{
                            backgroundColor: section.settings?.backgroundColor,
                            padding: section.settings?.padding ? `${section.settings.padding}px` : undefined,
                        }}
                    >
                        <div className={styles.megaColumns}>
                            {section.columns.map((col) => (
                                <div
                                    key={col.id}
                                    className={styles.megaColumn}
                                    style={{ width: `${(col.width / 12) * 100}%` }}
                                >
                                    <ul className={styles.megaColumnList}>
                                        {col.items.map((sub) => (
                                            <li key={sub.id} className={styles.megaColumnItem}>
                                                <MegaSubItem item={sub} />
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
        if (item.type === 'divider') return <li key={item.id} className={styles.divider} />;

        const hasChildren = item.children?.length > 0;
        const hasMega =
            item.type === 'mega-menu' && (item.megaMenu?.sections?.length ?? 0) > 0;
        const hasCatProducts =
            item.type === 'category' && item.autoAddProducts !== false && !!item.categoryId;
        const hasCategoryChildren = item.type === 'category' && hasChildren;

        const showChevron = hasChildren || hasMega || hasCatProducts || hasCategoryChildren;

        const cls = [
            styles.menuItem,
            hasMega && styles.hasMegaMenu,
        ].filter(Boolean).join(' ');

        return (
            <li key={item.id} className={cls}>
                <div className={styles.trigger}>
                    <MenuLink
                        item={item}
                        showIcon={settings.showIcons}
                        themeColors={themeColors}
                        onClick={onItemClick}
                    />
                    {showChevron && <Chevron />}
                </div>

                {hasMega ? (
                    renderMegaContent(item)
                ) : (hasCatProducts || hasCategoryChildren) ? (
                    <div className={styles.categoryDropdown}>
                        {hasCategoryChildren && (
                            <ul className={styles.categoryLinks}>
                                {item.children.map((child) => {
                                    const isProductWithConfig =
                                        child.type === 'product' &&
                                        ((child.showProductImage ?? false) ||
                                            (child.showProductPrice ?? false) ||
                                            (child.showProductRating ?? false) ||
                                            child.imagePosition === 'top');

                                    if (isProductWithConfig) {
                                        return (
                                            <li key={child.id} className={styles.categoryLinkItem}>
                                                {child.products?.length ? (
                                                    <div className={styles.productList}>
                                                        {child.products.map((product) => (
                                                            <MegaMenuProductCard
                                                                key={product._id}
                                                                product={product}
                                                                showImage={child.showProductImage ?? false}
                                                                showPrice={child.showProductPrice ?? false}
                                                                showRating={child.showProductRating ?? false}
                                                                imageSize={child.productImageSize || 'small'}
                                                                displayMode="list"
                                                                imagePosition={child.imagePosition || 'left'}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <ConfigurableProductItem item={child} />
                                                )}
                                            </li>
                                        );
                                    }

                                    return (
                                        <li key={child.id} className={styles.categoryLinkItem}>
                                            <MenuLink
                                                item={child}
                                                showIcon={settings.showIcons}
                                                themeColors={themeColors}
                                                onClick={onItemClick}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        <CategoryProducts item={item} />
                    </div>
                ) : hasChildren ? (
                    <div className={styles.dropdown}>
                        <ul className={styles.dropdownList}>
                            {item.children.map((child) => (
                                <li key={child.id} className={styles.dropdownItem}>
                                    <MenuLink
                                        item={child}
                                        showIcon={settings.showIcons}
                                        themeColors={themeColors}
                                        onClick={onItemClick}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </li>
        );
    };

    return (
        <nav className={`${styles.horizontalMenu} ${className}`}>
            <ul className={styles.menuList}>
                {items.map(renderItem)}
            </ul>
        </nav>
    );
}
