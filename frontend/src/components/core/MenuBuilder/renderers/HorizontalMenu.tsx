// Horizontal Menu Renderer
// Classic horizontal navigation bar with mega menu support

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MenuRendererProps, MenuItem } from '@/types/menu';
import api from '@/lib/api';
import MenuLink from '../MenuLink';
import MegaMenuProductCard from '../MegaMenuProductCard';
import styles from './HorizontalMenu.module.scss';
import DynamicIcon from '../../common/DynamicIcon';

// ─── Category Products Sub-Component ────────────────────────────────────────
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
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    categoryId: item.categoryId!,
                    limit: String(item.productLimit || 10),
                });
                const response = await api.get(`products?${params.toString()}`);
                if (!cancelled) {
                    setProducts(response.products || response.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch category products:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchProducts();

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
    if (loading) {
        return <div className={styles.loading}>Loading products...</div>;
    }

    if (!products || products.length === 0) {
        return null;
    }

    // List mode — vertical stack
    if (displayMode === 'list') {
        return (
            <div className={styles.productList}>
                {products.map((product) => (
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
                {showViewAll && item.categoryId && (
                    <div className={styles.viewAllContainer}>
                        <Link href={`/${categorySlug}`} className={styles.viewAllBtn}>
                            View All Products <DynamicIcon name="move-right" size={16} />
                        </Link>
                    </div>
                )}
            </div>
        );
    }

    // Grid / Compact mode — use inline gridTemplateColumns for dynamic column count
    return (
        <div
            className={styles.productGrid}
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
            {products.map((product) => (
                <MegaMenuProductCard
                    key={product._id}
                    product={product}
                    showImage={showImage}
                    showPrice={showPrice}
                    showRating={showRating}
                    imageSize={imageSize}
                    displayMode={displayMode}
                    imagePosition={imagePosition}
                />
            ))}
            {showViewAll && item.categoryId && (
                <div className={styles.viewAllContainer}>
                    <Link href={`/${categorySlug}`} className={styles.viewAllBtn}>
                        View All Products <DynamicIcon name="move-right" size={16} />
                    </Link>
                </div>
            )}
        </div>
    );
}

// ─── Mega Sub-Item Renderer ─────────────────────────────────────────────────
function MegaSubItem({ item }: { item: MenuItem }) {
    // Divider
    if (item.type === 'divider') {
        return <hr className={styles.megaDivider} />;
    }

    // Image
    if (item.type === 'image' && item.imageUrl) {
        return (
            <div className={styles.megaSubItem}>
                <Link href={item.imageLink || item.linkUrl || '#!'} className={styles.megaImageLink}>
                    <img src={item.imageUrl} alt={item.label || item.imageAlt || ''} />
                </Link>
            </div>
        );
    }

    // Custom Link
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

    // Page
    if (item.type === 'page') {
        const pageSlug = item.pageSlug || item.pageId;
        return (
            <div className={styles.megaSubItem}>
                <Link href={`/${pageSlug}`} className={styles.megaPageLink}>
                    {item.label || item.pageName || 'Page'}
                </Link>
            </div>
        );
    }

    // Product (manual selection)
    if (item.type === 'product') {
        const productList = item.products || [];
        return (
            <div className={styles.megaSubItem}>
                {item.label && (
                    <span className={styles.categoryLabelStatic}>{item.label}</span>
                )}
                {productList.length > 0 && (
                    <ul className={styles.megaProductList}>
                        {productList.map((product: any) => (
                            <li key={product._id} className={styles.megaProductItem}>
                                <Link
                                    href={`/${product.slug || product._id}`}
                                    className={styles.megaProductLink}
                                >
                                    {product.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    // Category — with auto-populated product cards
    if (item.type === 'category') {
        const categorySlug = item.categorySlug || item.categoryId;
        const categoryLabel = item.label || item.categoryName || 'Category';

        return (
            <div className={styles.megaSubItem}>
                {item.categoryId ? (
                    <Link href={`/${categorySlug}`} className={styles.categoryLabel}>
                        {categoryLabel}
                    </Link>
                ) : (
                    <span className={styles.categoryLabelStatic}>{categoryLabel}</span>
                )}

                {item.productLimit != null && item.productLimit > 0 && (
                    <CategoryProducts item={item} />
                )}
            </div>
        );
    }

    return null;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function HorizontalMenu({
    items,
    className = '',
    themeColors,
    settings,
    depth = 0,
    onItemClick,
}: MenuRendererProps) {
    const [activeItem, setActiveItem] = useState<string | null>(null);
    const navRef = useRef<HTMLDivElement>(null);
    const [megaMenuTop, setMegaMenuTop] = useState<number>(0);

    // Calculate mega menu dropdown top position when nav mounts or window resizes
    const updateMegaMenuPosition = () => {
        if (navRef.current) {
            const rect = navRef.current.getBoundingClientRect();
            setMegaMenuTop(rect.bottom);
        }
    };

    React.useEffect(() => {
        updateMegaMenuPosition();
        window.addEventListener('resize', updateMegaMenuPosition);
        return () => window.removeEventListener('resize', updateMegaMenuPosition);
    }, []);

    // Render mega menu dropdown content
    const renderMegaMenuContent = (item: MenuItem) => {
        if (!item.megaMenu?.sections || item.megaMenu.sections.length === 0) return null;

        return (
            <div
                className={styles.megaMenuDropdown}
                style={{
                    top: `${megaMenuTop}px`,
                    maxHeight: item.megaMenu?.maxHeight
                        ? `${item.megaMenu.maxHeight}px`
                        : undefined,
                    overflowY: item.megaMenu?.maxHeight
                        ? 'auto'
                        : undefined,
                }}
            >
                {item.megaMenu.sections.map((section) => (
                    <div
                        key={section.id}
                        className={styles.megaMenuSection}
                        style={{
                            backgroundColor: section.settings?.backgroundColor,
                            padding: section.settings?.padding
                                ? `${section.settings.padding}px`
                                : undefined,
                        }}
                    >
                        <div className={styles.megaMenuColumns}>
                            {section.columns.map((column) => (
                                <div
                                    key={column.id}
                                    className={styles.megaMenuColumn}
                                    style={{
                                        width: `${(column.width / 12) * 100}%`,
                                    }}
                                >
                                    <ul className={styles.megaMenuList}>
                                        {column.items.map((subItem) => (
                                            <li key={subItem.id} className={styles.megaMenuItem}>
                                                <MegaSubItem item={subItem} />
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

        const hasChildren = item.children && item.children.length > 0;
        const hasMegaMenu =
            item.type === 'mega-menu' &&
            item.megaMenu?.sections &&
            item.megaMenu.sections.length > 0;
        const hasCategoryProducts =
            item.type === 'category' &&
            item.autoAddProducts !== false &&
            item.categoryId;
        const isActive = activeItem === item.id;

        return (
            <li
                key={item.id}
                className={`${styles.menuItem} ${hasChildren ? styles.hasChildren : ''} ${hasMegaMenu ? styles.hasMegaMenu : ''} ${hasCategoryProducts ? styles.hasChildren : ''} ${isActive ? styles.active : ''}`}
                onMouseEnter={() => setActiveItem(item.id)}
                onMouseLeave={() => setActiveItem(null)}
            >
                <MenuLink
                    item={item}
                    showIcon={settings.showIcons}
                    themeColors={themeColors}
                    onClick={onItemClick}
                />

                {hasMegaMenu ? (
                    renderMegaMenuContent(item)
                ) : hasCategoryProducts ? (
                    <div className={styles.categoryDropdown}>
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
        <nav className={`${styles.horizontalMenu} ${className}`} ref={navRef}>
            <ul className={styles.menuList}>
                {items.map((item) => renderMenuItem(item))}
            </ul>
        </nav>
    );
}
