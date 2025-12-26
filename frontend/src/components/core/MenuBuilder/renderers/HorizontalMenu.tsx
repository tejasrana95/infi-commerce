// Horizontal Menu Renderer
// Classic horizontal navigation bar

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MenuRendererProps, MenuItem } from '@/types/menu';
import api from '@/lib/api';
import MenuLink from '../MenuLink';
import styles from './HorizontalMenu.module.scss';

// Internal Mega Menu Sub Item Component
const MegaSubItem = ({ item }: { item: MenuItem }) => {
    // Initialize with pre-fetched products if available (SSR)
    const [categoryProducts, setCategoryProducts] = useState<any[]>(item.products || []);
    const [loading, setLoading] = useState(false);

    // Fetch products for category type only if NOT already populated
    useEffect(() => {
        if (item.type === 'category' && item.categoryId && item.productLimit && item.productLimit > 0) {
            // If already populated (SSR), don't fetch
            if (item.products && item.products.length > 0) return;

            const fetchProducts = async () => {
                try {
                    setLoading(true);
                    const queryParams = new URLSearchParams({
                        categoryId: item.categoryId!,
                        limit: String(item.productLimit)
                    });
                    const response = await api.get(`products?${queryParams.toString()}`);
                    console.log('response', response);
                    const products = response.products || response.data || [];
                    setCategoryProducts(products);
                } catch (error) {
                    console.error('Failed to fetch category products:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProducts();
        }
    }, [item.type, item.categoryId, item.productLimit, item.products]);

    // Handle divider
    if (item.type === 'divider') {
        return <hr className={styles.megaDivider} />;
    }

    // Handle image
    if (item.type === 'image' && item.imageUrl) {
        return (
            <div className={styles.megaSubItem}>
                <Link href={item.linkUrl || '#'} className={styles.megaImageLink}>
                    <img src={item.imageUrl} alt={item.label || item.imageAlt || ''} />
                </Link>
            </div>
        );
    }

    // Handle custom link
    if (item.type === 'custom-link') {
        return (
            <div className={styles.megaSubItem}>
                <Link
                    href={item.linkUrl || '#'}
                    className={styles.megaCustomLink}
                    target={item.linkOpenInNewTab ? '_blank' : undefined}
                >
                    {item.label || item.linkLabel || item.linkUrl}
                </Link>
            </div>
        );
    }

    // Handle Page
    if (item.type === 'page') {
        const pageSlug = item.pageSlug || item.pageId;
        const pageLabel = item.label || item.pageName || 'Page';

        return (
            <div className={styles.megaSubItem}>
                <Link href={`/page/${pageSlug}`} className={styles.megaPageLink}>
                    {pageLabel}
                </Link>
            </div>
        );
    }

    // Handle Product List (Manual Selection)
    if (item.type === 'product') {
        // Use the new products array if available
        const productList = item.products || (item.productIds?.map((id, i) => ({
            _id: id,
            name: item.productNames?.[i] || 'Product',
            slug: item.products?.[i]?.slug // Try to get slug if available in parallel array (unlikely with new structure)
        })) || []);

        return (
            <div className={styles.megaSubItem}>
                {item.label && (
                    <span className={styles.categoryLabelStatic}>{item.label}</span>
                )}
                <ul className={styles.megaProductList}>
                    {productList.map((product: any) => (
                        <li key={product._id} className={styles.megaProductItem}>
                            <Link
                                href={`/product/${product.slug || product._id}`}
                                className={styles.megaProductLink}
                            >
                                {product.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    // Handle Category
    if (item.type === 'category') {
        const categorySlug = item.categorySlug || item.categoryId;
        const categoryLabel = item.label || item.categoryName || 'Category';

        return (
            <div className={styles.megaSubItem}>
                {/* Category Label */}
                {item.categoryId ? (
                    <Link href={`/category/${categorySlug}`} className={styles.categoryLabel}>
                        {categoryLabel}
                    </Link>
                ) : (
                    <span className={styles.categoryLabelStatic}>{categoryLabel}</span>
                )}

                {/* Dynamic Product List */}
                {item.productLimit && item.productLimit > 0 && (
                    <ul className={styles.megaProductList}>
                        {loading ? (
                            <li className={styles.loading}>Loading products...</li>
                        ) : categoryProducts.length > 0 ? (
                            categoryProducts.map((product: any) => (
                                <li key={product._id} className={styles.megaProductItem}>
                                    <Link
                                        href={`/product/${product.slug || product._id}`}
                                        className={styles.megaProductLink}
                                    >
                                        {product.name}
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <li className={styles.noProducts}>No products found</li>
                        )}
                    </ul>
                )}
            </div>
        );
    }

    return null;
};

export default function HorizontalMenu({
    items,
    className = '',
    themeColors,
    settings,
    depth = 0,
    onItemClick,
}: MenuRendererProps) {
    const [activeItem, setActiveItem] = useState<string | null>(null);

    const handleItemHover = (itemId: string | null) => {
        setActiveItem(itemId);
    };

    // Render mega menu dropdown content
    const renderMegaMenuContent = (item: MenuItem) => {
        if (!item.megaMenu?.sections || item.megaMenu.sections.length === 0) return null;

        return (
            <div className={styles.megaMenuDropdown}>
                {item.megaMenu.sections.map((section) => (
                    <div
                        key={section.id}
                        className={styles.megaMenuSection}
                        style={{
                            backgroundColor: section.settings?.backgroundColor,
                            padding: section.settings?.padding ? `${section.settings.padding}px` : undefined,
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
        const hasMegaMenu = item.type === 'mega-menu' && item.megaMenu?.sections && item.megaMenu.sections.length > 0;
        const isActive = activeItem === item.id;

        return (
            <li
                key={item.id}
                className={`${styles.menuItem} ${hasChildren ? styles.hasChildren : ''} ${hasMegaMenu ? styles.hasMegaMenu : ''} ${isActive ? styles.active : ''}`}
                onMouseEnter={() => handleItemHover(item.id)}
                onMouseLeave={() => handleItemHover(null)}
            >
                <MenuLink
                    item={item}
                    showIcon={settings.showIcons}
                    themeColors={themeColors}
                    onClick={onItemClick}
                />

                {hasMegaMenu ? (
                    renderMegaMenuContent(item)
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
                {items.map((item) => renderMenuItem(item))}
            </ul>
        </nav>
    );
}
