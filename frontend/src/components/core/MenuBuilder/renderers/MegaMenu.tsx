// Mega Menu Renderer
// Full-width dropdown with columns and featured content

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { MenuRendererProps, MenuItem } from '@/types/menu';
import MenuLink from '../MenuLink';
import MegaMenuProductCard from '../MegaMenuProductCard';
import api from '@/lib/api';
import styles from './MegaMenu.module.scss';
import Image from 'next/image';

// ─── Category Products Sub-Component ────────────────────────────────────────
interface CategoryProductsProps {
    item: MenuItem;
}

function CategoryProducts({ item }: CategoryProductsProps) {
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
            </div>
        );
    }

    // Grid / Compact mode — CSS grid with inline column count
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
        </div>
    );
}

// ─── Sub-Item Renderer ──────────────────────────────────────────────────────
function renderSubItem(subItem: MenuItem, settings: any, themeColors: any, onItemClick: any) {
    // Divider
    if (subItem.type === 'divider') {
        return <hr className={styles.divider} />;
    }

    // Image
    if (subItem.type === 'image' && subItem.imageUrl) {
        return (
            <Link href={subItem.imageLink || subItem.linkUrl || '#!'} className={styles.imageLink}>
                <Image src={subItem.imageUrl} alt={subItem.label || subItem.imageAlt || ''} layout="responsive" width={160} height={160} />
            </Link>
        );
    }

    // Custom Link
    if (subItem.type === 'custom-link') {
        return (
            <Link
                href={subItem.linkUrl || '#!'}
                className={styles.customLink}
                target={subItem.openInNewTab ? '_blank' : undefined}
            >
                {subItem.label || subItem.linkLabel || subItem.linkUrl}
            </Link>
        );
    }

    // Page
    if (subItem.type === 'page') {
        const pageSlug = subItem.pageSlug || subItem.pageId;
        return (
            <Link href={`/${pageSlug}`} className={styles.pageLink}>
                {subItem.label || subItem.pageName || 'Page'}
            </Link>
        );
    }

    // Product (manual selection)
    if (subItem.type === 'product') {
        const productList = subItem.products || [];
        return (
            <div className={styles.productSection}>
                {subItem.label && (
                    <span className={styles.sectionLabel}>{subItem.label}</span>
                )}
                {productList.length > 0 && (
                    <div className={styles.productList}>
                        {productList.map((product: any) => (
                            <Link
                                key={product._id}
                                href={`/${product.slug || product._id}`}
                                className={styles.productLink}
                            >
                                {product.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Category — with auto-populated products
    if (subItem.type === 'category') {
        const categorySlug = subItem.categorySlug || subItem.categoryId;
        const categoryLabel = subItem.label || subItem.categoryName || 'Category';

        return (
            <div className={styles.categorySection}>
                {subItem.categoryId ? (
                    <Link
                        href={`/${categorySlug}`}
                        className={styles.categoryLabel}
                    >
                        {categoryLabel}
                    </Link>
                ) : (
                    <span className={styles.categoryLabelStatic}>
                        {categoryLabel}
                    </span>
                )}

                {subItem.productLimit != null && subItem.productLimit > 0 && (
                    <CategoryProducts item={subItem} />
                )}
            </div>
        );
    }

    // Fallback — generic link via MenuLink
    return (
        <MenuLink
            item={subItem as any}
            showIcon={settings?.showIcons}
            themeColors={themeColors}
            onClick={onItemClick}
        />
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function MegaMenu({
    items,
    className = '',
    themeColors,
    settings,
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

    useEffect(() => {
        updateMegaMenuPosition();
        window.addEventListener('resize', updateMegaMenuPosition);
        return () => window.removeEventListener('resize', updateMegaMenuPosition);
    }, []);

    const renderMegaMenuContent = useCallback(
        (item: MenuItem) => {
            if (
                !item.megaMenu?.sections ||
                item.megaMenu.sections.length === 0
            )
                return null;

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
                            className={styles.megaMenuContent}
                            style={{
                                backgroundColor:
                                    section.settings?.backgroundColor,
                                padding: section.settings?.padding
                                    ? `${section.settings.padding}px`
                                    : undefined,
                            }}
                        >
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
                                                <li
                                                    key={subItem.id}
                                                    className={
                                                        styles.columnItem
                                                    }
                                                >
                                                    {renderSubItem(
                                                        subItem,
                                                        settings,
                                                        themeColors,
                                                        onItemClick,
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
        },
        [settings, themeColors, onItemClick],
    );

    const renderMenuItem = (item: MenuItem) => {
        if (item.type === 'divider') {
            return <li key={item.id} className={styles.dividerVert} />;
        }

        const hasMegaMenu =
            item.type === 'mega-menu' &&
            item.megaMenu?.sections &&
            item.megaMenu.sections.length > 0;
        const hasChildren = item.children && item.children.length > 0;
        const hasCategoryProducts =
            item.type === 'category' &&
            item.autoAddProducts !== false &&
            item.categoryId;
        const isActive = activeItem === item.id;

        return (
            <li
                key={item.id}
                className={`${styles.menuItem} ${hasMegaMenu || hasChildren ? styles.hasDropdown : ''} ${hasCategoryProducts ? styles.hasCategoryDropdown : ''} ${isActive ? styles.active : ''}`}
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
                ) : null}
            </li>
        );
    };

    return (
        <nav className={`${styles.megaMenu} ${className}`} ref={navRef}>
            <ul className={styles.menuList}>
                {items.map(renderMenuItem)}
            </ul>
        </nav>
    );
}
