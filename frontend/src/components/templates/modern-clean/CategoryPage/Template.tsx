// Modern Clean CategoryPage Template - Premium presentation layer
// Features: Glassmorphism filter sidebar, animated product grid, modern UI

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CategoryPageTemplateProps } from '@/components/templates/core/CategoryPage/types';
import { getComponent } from '@/components/templates/registry';
import { formatStockStatus } from '@/lib/constants';
import styles from './CategoryPage.module.scss';

export default function ModernCleanCategoryPageTemplate({
    category,
    breadcrumbs,
    products,
    isLoading,
    pagination,
    onPageChange,
    onLoadMore,
    currentSort,
    sortOptions,
    onSortChange,
    availableFilters,
    activeFilters,
    activeFilterCount,
    onFilterChange,
    onClearFilter,
    onClearAllFilters,
    isFilterDrawerOpen,
    onOpenFilterDrawer,
    onCloseFilterDrawer,
    config,
    currencySymbol,
    exchangeRate,
    templateId,
}: CategoryPageTemplateProps) {
    const [expandedFilters, setExpandedFilters] = useState<Set<string>>(() => {
        const isTop = config.filters?.position === 'top';
        if (config.filters?.defaultState === 'expanded' && !isTop) {
            const keys = ['price', 'brand', 'rating', 'stock', 'tags'];
            if (availableFilters?.attributes) {
                availableFilters.attributes.forEach(attr => keys.push(attr.slug));
            }
            return new Set(keys);
        }
        return new Set([]);
    });

    // Get ProductCard component
    const ProductCard = getComponent('ProductCard', templateId);

    // Toggle filter section
    const toggleFilter = (key: string) => {
        setExpandedFilters(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // Check if filter is expanded
    const isExpanded = (key: string) => expandedFilters.has(key);

    // Render filter checkbox group
    const renderCheckboxFilter = (
        title: string,
        filterKey: string,
        options: { value: string; label?: string; count: number; status?: string }[],
    ) => {
        const currentValues = filterKey === 'brand'
            ? activeFilters.brands
            : filterKey === 'tags'
                ? activeFilters.tags
                : filterKey === 'stock'
                    ? activeFilters.stockStatus
                    : activeFilters.attributes?.[filterKey] || [];

        return (
            <div className={styles.filterGroup}>
                <button
                    className={styles.filterHeader}
                    onClick={() => toggleFilter(filterKey)}
                >
                    <span>{title}</span>
                    <svg
                        className={`${styles.chevron} ${isExpanded(filterKey) ? styles.expanded : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isExpanded(filterKey) && (
                    <div className={styles.filterContent}>
                        {options.map(opt => (
                            <label key={opt.value} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={currentValues?.includes(opt.value)}
                                    onChange={(e) => {
                                        const newValues = e.target.checked
                                            ? [...(currentValues || []), opt.value]
                                            : (currentValues || []).filter(v => v !== opt.value);
                                        onFilterChange(filterKey, newValues);
                                    }}
                                />
                                <span className={styles.checkbox}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span className={styles.labelText}>
                                    {opt.label || (filterKey === 'stock' ? formatStockStatus(opt.status || opt.value) : opt.value)}
                                </span>
                                <span className={styles.count}>({opt.count})</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Render price range filter
    const renderPriceFilter = () => {
        if (!config.filters?.showPriceRange || !availableFilters?.priceRange) return null;

        // All values from API are in base currency
        const { minPrice: baseMinPrice, maxPrice: baseMaxPrice } = availableFilters.priceRange;

        // Convert to display currency for showing to user
        const displayMinPrice = Math.round(baseMinPrice * exchangeRate);
        const displayMaxPrice = Math.round(baseMaxPrice * exchangeRate);

        // Active filter values are stored in base currency, convert for display
        const currentBaseMin = activeFilters.price?.min ?? baseMinPrice;
        const currentBaseMax = activeFilters.price?.max ?? baseMaxPrice;
        const currentDisplayMin = Math.round(currentBaseMin * exchangeRate);
        const currentDisplayMax = currentBaseMax === Infinity ? Infinity : Math.round(currentBaseMax * exchangeRate);

        return (
            <div className={styles.filterGroup}>
                <button
                    className={styles.filterHeader}
                    onClick={() => toggleFilter('price')}
                >
                    <span>Price Range</span>
                    <svg
                        className={`${styles.chevron} ${isExpanded('price') ? styles.expanded : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isExpanded('price') && (
                    <div className={styles.filterContent}>
                        <div className={styles.priceRange}>
                            <span>{currencySymbol}{displayMinPrice.toLocaleString()}</span>
                            <span>—</span>
                            <span>{currencySymbol}{displayMaxPrice.toLocaleString()}</span>
                        </div>
                        <div className={styles.priceInputs}>
                            <div className={styles.priceInput}>
                                <span className={styles.currencySymbol}>{currencySymbol}</span>
                                <input
                                    type="number"
                                    placeholder={`Min (${displayMinPrice})`}
                                    value={currentDisplayMin === displayMinPrice ? '' : currentDisplayMin}
                                    onChange={(e) => {
                                        // User enters in display currency, convert to base for API
                                        const displayValue = parseInt(e.target.value) || displayMinPrice;
                                        const baseValue = Math.round(displayValue / exchangeRate);
                                        onFilterChange('price', { min: baseValue, max: currentBaseMax });
                                    }}
                                />
                            </div>
                            <span className={styles.priceDash}>—</span>
                            <div className={styles.priceInput}>
                                <span className={styles.currencySymbol}>{currencySymbol}</span>
                                <input
                                    type="number"
                                    placeholder={`Max (${displayMaxPrice})`}
                                    value={currentDisplayMax === Infinity || currentDisplayMax === displayMaxPrice ? '' : currentDisplayMax}
                                    onChange={(e) => {
                                        // User enters in display currency, convert to base for API
                                        const displayValue = parseInt(e.target.value) || Infinity;
                                        const baseValue = displayValue === Infinity ? Infinity : Math.round(displayValue / exchangeRate);
                                        onFilterChange('price', { min: currentBaseMin, max: baseValue });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render rating filter
    const renderRatingFilter = () => {
        if (!config.filters?.showRatingFilter) return null;

        const ratings = [4, 3, 2, 1];

        return (
            <div className={styles.filterGroup}>
                <button
                    className={styles.filterHeader}
                    onClick={() => toggleFilter('rating')}
                >
                    <span>Rating</span>
                    <svg
                        className={`${styles.chevron} ${isExpanded('rating') ? styles.expanded : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isExpanded('rating') && (
                    <div className={styles.filterContent}>
                        {ratings.map(rating => (
                            <label key={rating} className={styles.ratingLabel}>
                                <input
                                    type="radio"
                                    name="rating"
                                    checked={activeFilters.rating === rating}
                                    onChange={() => onFilterChange('rating', rating)}
                                />
                                <span className={styles.radio} />
                                <span className={styles.stars}>
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            className={i < rating ? styles.starFilled : styles.starEmpty}
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </span>
                                <span className={styles.ratingText}>&amp; up</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Render sidebar filters
    const renderFilters = () => (
        <div className={styles.filtersContent}>
            {/* Active filters */}
            {activeFilterCount > 0 && (
                <div className={styles.activeFilters}>
                    <div className={styles.activeFiltersHeader}>
                        <span>Active Filters ({activeFilterCount})</span>
                        <button onClick={onClearAllFilters}>Clear All</button>
                    </div>
                    <div className={styles.activeFilterTags}>
                        {activeFilters.brands?.map(brand => (
                            <span key={brand} className={styles.filterTag}>
                                {brand}
                                <button onClick={() => {
                                    const newBrands = activeFilters.brands?.filter(b => b !== brand);
                                    onFilterChange('brand', newBrands);
                                }}>×</button>
                            </span>
                        ))}
                        {activeFilters.price && (() => {
                            const displayMin = Math.round(activeFilters.price.min * exchangeRate);
                            const displayMax = activeFilters.price.max === Infinity
                                ? '∞'
                                : Math.round(activeFilters.price.max * exchangeRate).toLocaleString();
                            return (
                                <span className={styles.filterTag}>
                                    {currencySymbol}{displayMin.toLocaleString()} - {currencySymbol}{displayMax}
                                    <button onClick={() => onClearFilter('price')}>×</button>
                                </span>
                            );
                        })()}
                        {activeFilters.rating && (
                            <span className={styles.filterTag}>
                                {activeFilters.rating}+ Stars
                                <button onClick={() => onClearFilter('rating')}>×</button>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Subcategories */}
            {config.subcategories?.display !== 'none' && (availableFilters?.subcategories?.length ?? 0) > 0 && (
                <div className={styles.subcategories}>
                    <h4>Categories</h4>
                    <div className={styles.subcategoryList}>
                        {availableFilters!.subcategories!.map(sub => (
                            <Link
                                key={sub._id}
                                href={`/category/${sub.slug}`}
                                className={styles.subcategoryItem}
                            >
                                {sub.image && (
                                    <Image src={sub.image} alt={sub.title} width={40} height={40} />
                                )}
                                <span>{sub.title}</span>
                                <span className={styles.count}>({sub.productCount})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Price filter */}
            {renderPriceFilter()}

            {/* Brand filter */}
            {config.filters?.showBrandFilter && (availableFilters?.brands?.length ?? 0) > 0 && (
                renderCheckboxFilter('Brand', 'brand', availableFilters!.brands!)
            )}

            {/* Rating filter */}
            {renderRatingFilter()}

            {/* Availability filter */}
            {config.filters?.showAvailabilityFilter && (availableFilters?.availability?.length ?? 0) > 0 && (
                renderCheckboxFilter('Availability', 'stock', availableFilters!.availability!)
            )}

            {/* Attribute filters */}
            {config.filters?.showAttributeFilters && availableFilters?.attributes?.map(attr => (
                <div key={attr._id}>
                    {renderCheckboxFilter(attr.name, attr.slug, attr.values)}
                </div>
            ))}

            {/* Tag filter */}
            {config.filters?.showTagFilter && (availableFilters?.tags?.length ?? 0) > 0 && (
                renderCheckboxFilter('Tags', 'tags', availableFilters!.tags!)
            )}
        </div>
    );

    // Render dropdown filter (for Top position)
    const renderDropdownFilter = (
        title: string,
        filterKey: string,
        options: { value: string; label?: string; count: number; status?: string }[],
    ) => {
        const currentValues = filterKey === 'brand'
            ? activeFilters.brands
            : filterKey === 'tags'
                ? activeFilters.tags
                : filterKey === 'stock'
                    ? activeFilters.stockStatus
                    : activeFilters.attributes?.[filterKey] || [];

        const isOpen = expandedFilters.has(filterKey);
        const isActive = (currentValues?.length || 0) > 0;

        return (
            <div className={styles.filterDropdown}>
                <button
                    className={`${styles.dropdownTrigger} ${isOpen ? styles.open : ''} ${isActive ? styles.active : ''}`}
                    onClick={() => toggleFilter(filterKey)}
                >
                    <span>{title}</span>
                    {isActive && <span className={styles.filterBadge}>{currentValues?.length}</span>}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isOpen && (
                    <div className={styles.dropdownContent}>
                        {options.map(opt => (
                            <label key={opt.value} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={currentValues?.includes(opt.value)}
                                    onChange={(e) => {
                                        const newValues = e.target.checked
                                            ? [...(currentValues || []), opt.value]
                                            : (currentValues || []).filter(v => v !== opt.value);
                                        onFilterChange(filterKey, newValues);
                                    }}
                                />
                                <span className={styles.checkbox}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span className={styles.labelText}>
                                    {opt.label || (filterKey === 'stock' ? formatStockStatus(opt.status || opt.value) : opt.value)}
                                </span>
                                <span className={styles.count}>({opt.count})</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Render horizontal top filters
    const renderHorizontalFilters = () => (
        <div className={styles.topFilters}>
            {/* Price Filter (simplified for top bar) */}
            <div className={styles.filterDropdown}>
                <button
                    className={`${styles.dropdownTrigger} ${isExpanded('price') ? styles.open : ''} ${activeFilters.price ? styles.active : ''}`}
                    onClick={() => toggleFilter('price')}
                >
                    <span>Price</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isExpanded('price') && (
                    <div className={styles.dropdownContent} style={{ minWidth: 300 }}>
                        {renderPriceFilter()}
                    </div>
                )}
            </div>

            {config.filters?.showBrandFilter && (availableFilters?.brands?.length ?? 0) > 0 &&
                renderDropdownFilter('Brand', 'brand', availableFilters!.brands!)
            }

            {config.filters?.showAvailabilityFilter && (availableFilters?.availability?.length ?? 0) > 0 &&
                renderDropdownFilter('Availability', 'stock', availableFilters!.availability!)
            }

            {config.filters?.showAttributeFilters && availableFilters?.attributes?.map(attr => (
                <div key={attr._id}>
                    {renderDropdownFilter(attr.name, attr.slug, attr.values)}
                </div>
            ))}

            {/* Clear All */}
            {activeFilterCount > 0 && (
                <button onClick={onClearAllFilters} className={styles.clearFiltersBtn} style={{ padding: '0.5rem 1rem' }}>
                    Clear All
                </button>
            )}
        </div>
    );

    // Calculate grid columns based on config
    const gridColumns = config.grid?.productsPerRow || { desktop: 4, tablet: 3, mobile: 2 };

    const hasFilters = config.filters?.enabled &&
        (config.filters.position === 'left' || config.filters.position === 'right');

    const showTopFilters = config.filters?.enabled && config.filters.position === 'top';

    return (
        <div className={styles.categoryPage}>
            {/* Category Header */}
            <header className={styles.header}>
                {/* Breadcrumbs */}
                <nav className={styles.breadcrumbs}>
                    {breadcrumbs.map((crumb, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && <span className={styles.separator}>/</span>}
                            {crumb.href ? (
                                <Link href={crumb.href}>{crumb.label}</Link>
                            ) : (
                                <span className={styles.current}>{crumb.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Category info */}
                <div className={styles.categoryInfo}>
                    {config.header?.showImage && category.image && (
                        <div className={styles.categoryImage}>
                            <Image src={category.image} alt={category.title} fill style={{ objectFit: 'cover' }} />
                            <div className={styles.imageOverlay} />
                        </div>
                    )}
                    <div className={styles.categoryText}>
                        <h1>{category.title}</h1>
                        {config.header?.showDescription && category.description && (
                            <p className={styles.description}>{category.description}</p>
                        )}
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className={`${styles.content} ${hasFilters ? styles.withSidebar : ''} ${config.filters?.position === 'right' ? styles.sidebarRight : ''}`}>

                {/* Filter Sidebar (Desktop) */}
                {hasFilters && (
                    <aside
                        className={styles.sidebar}
                        style={{ '--sidebar-width': `${config.filters?.sidebarWidth || 280}px` } as React.CSSProperties}
                    >
                        <div className={`${styles.sidebarInner} ${config.filters?.style === 'sticky' ? styles.sticky : ''}`}>
                            <h3 className={styles.sidebarTitle}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filters
                            </h3>
                            {renderFilters()}
                        </div>
                    </aside>
                )}

                {/* Products section */}
                <main className={styles.main}>
                    {/* Top Filters */}
                    {showTopFilters && renderHorizontalFilters()}

                    {/* Toolbar */}
                    <div className={styles.toolbar}>
                        <div className={styles.toolbarLeft}>
                            {/* Mobile filter button - Show on desktop ONLY if position is off-canvas */}
                            {config.filters?.enabled && (
                                <button
                                    className={styles.mobileFilterBtn}
                                    onClick={onOpenFilterDrawer}
                                    style={{
                                        display: (config.filters?.position === 'off-canvas') ? 'flex' : undefined
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    {config.filters?.offCanvas?.buttonText || 'Filters'}
                                    {activeFilterCount > 0 && (
                                        <span className={styles.filterBadge}>{activeFilterCount}</span>
                                    )}
                                </button>
                            )}
                            <span className={styles.productCount}>
                                {pagination.total} products
                            </span>
                        </div>

                        {/* Sort dropdown */}
                        {config.sorting?.showSortDropdown && (
                            <div className={styles.sortDropdown}>
                                <label>Sort by:</label>
                                <select
                                    value={currentSort}
                                    onChange={(e) => onSortChange(e.target.value)}
                                >
                                    {sortOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Product grid */}
                    <div
                        className={styles.productGrid}
                        style={{
                            '--cols-desktop': gridColumns.desktop,
                            '--cols-tablet': gridColumns.tablet,
                            '--cols-mobile': gridColumns.mobile,
                        } as React.CSSProperties}
                    >
                        {products.map((product, index) => (
                            <div
                                key={product._id}
                                className={styles.productItem}
                                style={{ '--index': index } as React.CSSProperties}
                            >
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>

                    {/* Loading state */}
                    {isLoading && (
                        <div className={styles.loading}>
                            <div className={styles.spinner} />
                            <span>Loading products...</span>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && products.length === 0 && (
                        <div className={styles.emptyState}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <h3>{config.emptyState?.message || 'No products found'}</h3>
                            <p>Try adjusting your filters or search criteria</p>
                            {activeFilterCount > 0 && config.emptyState?.showClearFilters && (
                                <button onClick={onClearAllFilters} className={styles.clearFiltersBtn}>
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Pagination / Load More */}
                    {!isLoading && products.length > 0 && pagination.pages > 1 && (
                        <div className={styles.pagination}>
                            {config.pagination?.type === 'load-more' ? (
                                <button
                                    className={styles.loadMoreBtn}
                                    onClick={onLoadMore}
                                    disabled={pagination.page >= pagination.pages}
                                >
                                    {pagination.page >= pagination.pages ? 'No more products' : 'Load More'}
                                </button>
                            ) : config.pagination?.type === 'pagination' && (
                                <div className={`${styles.paginationNav} ${styles[config.pagination.position || 'center']}`}>
                                    <button
                                        disabled={pagination.page <= 1}
                                        onClick={() => onPageChange(pagination.page - 1)}
                                        className={styles.pageBtn}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                                        let pageNum: number;
                                        if (pagination.pages <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.page <= 3) {
                                            pageNum = i + 1;
                                        } else if (pagination.page >= pagination.pages - 2) {
                                            pageNum = pagination.pages - 4 + i;
                                        } else {
                                            pageNum = pagination.page - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                className={`${styles.pageBtn} ${pageNum === pagination.page ? styles.active : ''}`}
                                                onClick={() => onPageChange(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        disabled={pagination.page >= pagination.pages}
                                        onClick={() => onPageChange(pagination.page + 1)}
                                        className={styles.pageBtn}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {config.pagination?.showProductCount && (
                                <p className={styles.paginationInfo}>
                                    Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                                </p>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Filter Drawer */}
            {isFilterDrawerOpen && (
                <div className={styles.filterDrawer}>
                    <div className={styles.drawerBackdrop} onClick={onCloseFilterDrawer} />
                    <div
                        className={`${styles.drawerContent} ${config.filters?.offCanvas?.slideFrom === 'right' ? styles.fromRight : styles.fromLeft}`}
                        style={{ '--drawer-width': `${config.filters?.offCanvas?.drawerWidth || 320}px` } as React.CSSProperties}
                    >
                        <div className={styles.drawerHeader}>
                            <h3>Filters</h3>
                            <button onClick={onCloseFilterDrawer} className={styles.closeBtn}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className={styles.drawerBody}>
                            {renderFilters()}
                        </div>
                        <div className={styles.drawerFooter}>
                            <button onClick={onClearAllFilters} className={styles.clearBtn}>
                                Clear All
                            </button>
                            <button onClick={onCloseFilterDrawer} className={styles.applyBtn}>
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
