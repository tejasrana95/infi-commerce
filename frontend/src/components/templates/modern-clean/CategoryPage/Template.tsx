// Modern Clean CategoryPage Template - Premium presentation layer
// Features: Glassmorphism filter sidebar, animated product grid, modern UI

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ModuleRenderer from '@/components/core/layout/ModuleRenderer';
import SectionRenderer from '@/components/core/layout/SectionRenderer';
import { CategoryPageTemplateProps } from '@/components/templates/core/CategoryPage/types';
import { getComponent } from '@/components/templates/registry';
import { formatStockStatus } from '@/lib/constants';
import { formatPrice } from '@/lib/currency';
import styles from './CategoryPage.module.scss';
import CategoryFilters from '@/components/molecules/CategoryFilters';

// (Layout helper functions removed - rendering now uses section-based iteration)

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
    onRemoveFilterValue,
    onClearAllFilters,
    isFilterDrawerOpen,
    onOpenFilterDrawer,
    onCloseFilterDrawer,
    config,
    currencySymbol,
    exchangeRate,
    currency,
    templateId,
    layout,
    stagedFilters,
    hasUnappliedChanges,
    onApplyFilters,
    onClearStagedFilters,
    brandLookup = {},
    getBrandDisplay = (id) => brandLookup[id]?.name || id,
    isFilterValueActive,
}: CategoryPageTemplateProps) {
    // Filter state removed (handled by molecule)
    // Local state for slider values (for real-time visual feedback)
    // Local slider state removed (handled by molecule)

    // Currency config for formatting display prices (which are already converted)
    const priceCurrency = useMemo(() => {
        if (typeof currency === 'string') return currency;
        return { ...currency, exchangeRate: 1 };
    }, [currency]);

    // Infinite scroll observer
    const loadMoreRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (config.pagination?.type !== 'infinite-scroll' || isLoading || pagination.page >= pagination.pages) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    onLoadMore();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [config.pagination?.type, isLoading, pagination.page, pagination.pages, onLoadMore]);

    // Sync local slider state with active filters
    // Slider sync effect removed

    // Get ProductCard component
    const ProductCard = getComponent('ProductCard', templateId);

    // Toggle filter section


    // Render filter checkbox group
    // Render sidebar filters using extracted molecule
    const renderFilters = () => {
        const renderSubcategories = () => (
            config.subcategories?.display !== 'none' && (availableFilters?.subcategories?.length ?? 0) > 0 ? (
                <div className={styles.subcategories}>
                    <h4>Categories</h4>
                    <div className={styles.subcategoryList}>
                        {availableFilters!.subcategories!.map(sub => (
                            <Link
                                key={sub._id}
                                href={`/category/${sub.slug}`}
                                className={styles.subcategoryItem}
                            >
                                <span>{sub.title}</span>
                                <span className={styles.count}>({sub.productCount})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null
        );

        return (
            <CategoryFilters
                availableFilters={availableFilters}
                activeFilters={activeFilters}
                activeFilterCount={activeFilterCount}
                stagedFilters={stagedFilters}
                onFilterChange={onFilterChange}
                onClearFilter={onClearFilter}
                onRemoveFilterValue={onRemoveFilterValue}
                onClearAllFilters={onClearAllFilters}
                onApplyFilters={onApplyFilters}
                onClearStagedFilters={onClearStagedFilters}
                hasUnappliedChanges={hasUnappliedChanges}
                config={config}
                currencySymbol={currencySymbol}
                exchangeRate={exchangeRate}
                currency={currency}
                getBrandDisplay={getBrandDisplay}
                isFilterValueActive={isFilterValueActive}
                className={styles.filtersContent}
            >
                {renderSubcategories()}
            </CategoryFilters>
        );
    };

    // Render sidebar filters (always sidebar position) - for mobile drawer
    const renderSidebarFilters = () => {
        const renderSubcategories = () => (
            config.subcategories?.display !== 'none' && (availableFilters?.subcategories?.length ?? 0) > 0 ? (
                <div className={styles.subcategories}>
                    <h4>Categories</h4>
                    <div className={styles.subcategoryList}>
                        {availableFilters!.subcategories!.map(sub => (
                            <Link
                                key={sub._id}
                                href={`/category/${sub.slug}`}
                                className={styles.subcategoryItem}
                            >
                                <span>{sub.title}</span>
                                <span className={styles.count}>({sub.productCount})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null
        );

        return (
            <CategoryFilters
                availableFilters={availableFilters}
                activeFilters={activeFilters}
                activeFilterCount={activeFilterCount}
                stagedFilters={stagedFilters}
                onFilterChange={onFilterChange}
                onClearFilter={onClearFilter}
                onRemoveFilterValue={onRemoveFilterValue}
                onClearAllFilters={onClearAllFilters}
                onApplyFilters={onApplyFilters}
                onClearStagedFilters={onClearStagedFilters}
                hasUnappliedChanges={hasUnappliedChanges}
                config={{ ...config, filters: { ...config.filters, position: 'left' } }}
                currencySymbol={currencySymbol}
                exchangeRate={exchangeRate}
                currency={currency}
                getBrandDisplay={getBrandDisplay}
                isFilterValueActive={isFilterValueActive}
                className={styles.filtersContent}
            >
                {renderSubcategories()}
            </CategoryFilters>
        );
    };

    // Render horizontal top filters using extracted molecule properties
    const renderHorizontalFilters = () => (
        <CategoryFilters
            availableFilters={availableFilters}
            activeFilters={activeFilters}
            activeFilterCount={activeFilterCount}
            stagedFilters={stagedFilters}
            onFilterChange={onFilterChange}
            onClearFilter={onClearFilter}
            onRemoveFilterValue={onRemoveFilterValue}
            onClearAllFilters={onClearAllFilters}
            onApplyFilters={onApplyFilters}
            onClearStagedFilters={onClearStagedFilters}
            hasUnappliedChanges={hasUnappliedChanges}
            config={{ ...config, filters: { ...config.filters, position: 'top' } }}
            currencySymbol={currencySymbol}
            exchangeRate={exchangeRate}
            currency={currency}
            getBrandDisplay={getBrandDisplay}
            isFilterValueActive={isFilterValueActive}
        />
    );
    // Check staged filters first (pending changes), fall back to active filters
    // Important: use !== undefined to handle empty arrays correctly

    // ============================================
    // Layout Sections (in array order from API)
    // ============================================
    // NOTE: The array order in the API response IS the correct order
    // as configured in the admin layout builder. We don't sort by 
    // the 'order' property as it may not be set correctly for all sections.
    const sections = useMemo(() => {
        return layout?.sections || [];
    }, [layout]
    );

    // Calculate grid columns based on config
    const gridColumns = config.grid?.productsPerRow || { desktop: 4, tablet: 3, mobile: 2 };

    // Check if filters are enabled at all (regardless of position)
    const hasFilters = config.filters?.enabled && availableFilters != null;

    // State for collapsible description
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(
        config.header?.defaultExpanded || false
    );
    const [needsToggle, setNeedsToggle] = useState(false);
    const descriptionRef = React.useRef<HTMLDivElement>(null);

    // Check if description content overflows (needs show more/less toggle)
    React.useEffect(() => {
        if (descriptionRef.current && config.header?.descriptionStyle === 'collapsed') {
            // Compare scrollHeight with clientHeight to detect overflow
            const hasOverflow = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight;
            setNeedsToggle(hasOverflow);
        }
    }, [category.description, config.header?.descriptionStyle, isDescriptionExpanded]);

    // Render description based on position
    const renderDescription = () => {
        if (!config.header?.showDescription || !category.description) return null;

        const isCollapsed = config.header.descriptionStyle === 'collapsed';
        const showCollapsed = isCollapsed && !isDescriptionExpanded;

        return (
            <div className={styles.descriptionContent}>
                <div
                    ref={!isDescriptionExpanded ? descriptionRef : undefined}
                    className={`${styles.description} ${showCollapsed ? styles.collapsed : ''}`}
                    dangerouslySetInnerHTML={{ __html: category.description }}
                />
                {isCollapsed && needsToggle && (
                    <span
                        className={styles.descriptionToggle}
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                        {isDescriptionExpanded
                            ? (config.header.collapseLabel || 'Show less')
                            : (config.header.expandLabel || '...Read more')}
                    </span>
                )}
            </div>
        );
    };

    // ============================================
    // Module Rendering Helper
    // ============================================
    const renderModule = (module: any) => {
        // Skip invisible modules based on device (for SSR, we show all by default)
        if (module.visibility?.desktop === false) return null;

        // Handle placeholder types with actual components
        // Supports both category-* and search-* module types
        switch (module.type) {
            case 'category-header':
            case 'search-header':
                // The category/search header is already rendered separately at the top
                // This placeholder just marks where additional header customizations could go
                return null;

            case 'category-filters':
            case 'search-filters':
                return (
                    <React.Fragment key={module.id}>
                        <h3 className={styles.sidebarTitle}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                        </h3>
                        {renderFilters()}
                    </React.Fragment>
                );

            case 'category-products':
            case 'search-results':
                return (
                    <React.Fragment key={module.id}>
                        {/* Toolbar */}
                        <div className={styles.toolbar}>
                            <div className={styles.toolbarLeft}>
                                {/* Mobile filter button */}
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
                                    <ProductCard
                                        product={product}
                                        cardConfig={{
                                            cardStyle: config.grid?.cardStyle || 'default'
                                        }}
                                    />
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
                    </React.Fragment>
                );

            case 'category-pagination':
            case 'search-pagination':
                if (isLoading || products.length === 0 || pagination.pages <= 1) return null;
                return (
                    <div key={module.id} className={styles.pagination}>
                        {config.pagination?.type === 'load-more' ? (
                            <button
                                className={styles.loadMoreBtn}
                                onClick={onLoadMore}
                                disabled={pagination.page >= pagination.pages}
                            >
                                {pagination.page >= pagination.pages ? 'No more products' : 'Load More'}
                            </button>
                        ) : config.pagination?.type === 'infinite-scroll' ? (
                            <div className={styles.infiniteScrollSentinel} ref={loadMoreRef}>
                                {isLoading ? (
                                    <div className={styles.loadingMore}>
                                        <div className={styles.spinnerSmall} />
                                        <span>Loading more...</span>
                                    </div>
                                ) : pagination.page < pagination.pages ? (
                                    <span className={styles.scrollText}>Scroll for more</span>
                                ) : null}
                            </div>
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
                );

            default:
                // Regular module - use ModuleRenderer
                return <ModuleRenderer key={module.id} module={module} />;
        }
    };

    // ============================================
    // Section Rendering Helper
    // Uses SectionRenderer for generic sections, special handling for category/search content
    // ============================================
    const renderSection = (section: any) => {
        // Check if this section has split columns with filters + products
        // Support both category-* and search-* module types
        const isSplitSection = section.type?.startsWith('split-') && section.columns?.length > 0;
        const hasFiltersColumn = section.columns?.some((col: any) =>
            col.modules?.some((m: any) => m.type === 'category-filters' || m.type === 'search-filters')
        );
        const hasProductsColumn = section.columns?.some((col: any) =>
            col.modules?.some((m: any) => m.type === 'category-products' || m.type === 'search-results')
        );
        const isCategoryContentSection = hasFiltersColumn && hasProductsColumn;
        // Get filter position from config
        const filterPosition = config.filters?.position || 'left';

        // Special handling for main category/search content section (filters sidebar + products)
        if (isSplitSection && isCategoryContentSection) {
            const sectionStyle = {
                paddingTop: section.settings?.paddingTop || 0,
                paddingBottom: section.settings?.paddingBottom || 0,
                backgroundImage: section.settings?.backgroundImage ? `url(${section.settings.backgroundImage})` : undefined,
                backgroundSize: section.settings?.backgroundSize || 'cover',
                backgroundPosition: section.settings?.backgroundPosition || 'center',
            };

            // Find the filter and product columns
            const filterColumn = section.columns.find((col: any) =>
                col.modules?.some((m: any) => m.type === 'category-filters' || m.type === 'search-filters')
            );
            const productColumn = section.columns.find((col: any) =>
                col.modules?.some((m: any) => m.type === 'category-products' || m.type === 'search-results')
            );

            // For 'top' or 'off-canvas' filter positions, don't show sidebar - show full width content
            if (filterPosition === 'top' || filterPosition === 'off-canvas') {
                return (
                    <div
                        key={section.id}
                        className={styles.content}
                        style={sectionStyle}
                    >
                        <main className={styles.main} style={{ width: '100%' }}>
                            {filterPosition === 'top' && hasFilters && renderHorizontalFilters()}
                            {productColumn?.modules?.map((module: any) => renderModule(module))}
                        </main>
                    </div>
                );
            }

            // For 'left' or 'right' sidebar positions, render with proper order based on config
            const shouldShowSidebar = hasFilters && (filterPosition === 'left' || filterPosition === 'right');

            // Render sidebar
            const renderFilterSidebar = () => filterColumn && shouldShowSidebar && (
                <aside
                    key={filterColumn.id}
                    className={styles.sidebar}
                    style={{ '--sidebar-width': `${config.filters?.sidebarWidth || 280}px` } as React.CSSProperties}
                >
                    <div className={`${styles.sidebarInner} ${config.filters?.style === 'sticky' ? styles.sticky : ''}`}>
                        {filterColumn.modules?.map((module: any) => renderModule(module))}
                    </div>
                </aside>
            );

            // Render main content
            const renderProductMain = () => productColumn && (
                <main key={productColumn.id} className={styles.main}>
                    {productColumn.modules?.map((module: any) => renderModule(module))}
                </main>
            );

            return (
                <div
                    key={section.id}
                    className={`${styles.content} ${shouldShowSidebar ? styles.withSidebar : ''} ${filterPosition === 'right' ? styles.sidebarRight : ''}`}
                    style={sectionStyle}
                >
                    {/* Render columns in correct order based on config.filters.position */}
                    {filterPosition === 'right' ? (
                        <>
                            {renderProductMain()}
                            {renderFilterSidebar()}
                        </>
                    ) : (
                        <>
                            {renderFilterSidebar()}
                            {renderProductMain()}
                        </>
                    )}
                </div>
            );
        }

        // For non-split sections that have search-results or category-products,
        // render with horizontal filters if position is 'top'
        const hasProductModules = section.modules?.some((m: any) =>
            m.type === 'category-products' || m.type === 'search-results'
        );

        if (hasProductModules && filterPosition === 'top' && hasFilters) {
            const sectionStyle = {
                paddingTop: section.settings?.paddingTop || 0,
                paddingBottom: section.settings?.paddingBottom || 0,
            };

            return (
                <div key={section.id} className={styles.content} style={sectionStyle}>
                    <main className={styles.main} style={{ width: '100%' }}>
                        {renderHorizontalFilters()}
                        {section.modules?.map((module: any) => renderModule(module))}
                    </main>
                </div>
            );
        }

        // For all other sections, use SectionRenderer with custom module rendering
        return (
            <SectionRenderer
                key={section.id}
                section={section}
                renderModule={(module) => renderModule(module)}
            />
        );
    };

    return (
        <div className={styles.categoryPage}>
            {/* Category Header - Always rendered first */}
            <header className={styles.header}>
                {/* Background with gradient and optional image */}
                <div className={styles.headerBackground}>
                    {config.header?.showImage && category.image && (
                        <Image
                            src={category.image}
                            alt={category.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            priority
                            className={styles.headerBgImage}
                        />
                    )}
                    {/* Gradient overlay */}
                    <div className={styles.gradientOverlay} />
                    {/* Decorative floating shapes */}
                    <div className={styles.decorativeShapes}>
                        <div className={styles.shape1} />
                        <div className={styles.shape2} />
                        <div className={styles.shape3} />
                    </div>
                </div>

                {/* Header Content - Inside Container */}
                <div className={styles.headerContainer}>
                    <div className={styles.categoryInfo}>
                        {/* Breadcrumbs at top */}
                        <nav className={styles.breadcrumbs}>
                            {breadcrumbs.map((crumb, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && (
                                        <svg className={styles.breadcrumbSeparator} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                    {crumb.href ? (
                                        <Link href={crumb.href} className={styles.breadcrumbLink}>{crumb.label}</Link>
                                    ) : (
                                        <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>

                        {/* Title with animated underline */}
                        <div className={styles.titleWrapper}>
                            <h1>{category.title}</h1>
                            <div className={styles.titleDecoration} />
                        </div>

                        {/* Product count badge */}
                        <div className={styles.headerMeta}>
                            <span className={styles.productBadge}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                {pagination.total} Products
                            </span>
                        </div>

                        {/* Description */}
                        {(config.header.descriptionPosition === 'top' || config.header.descriptionPosition === 'below-image') &&
                            config.header?.showDescription && category.description && (
                                <div className={styles.descriptionWrapper}>
                                    {renderDescription()}
                                </div>
                            )}
                    </div>
                </div>
            </header>

            {/* Render all sections in order */}
            {sections.map((section: any) => renderSection(section))}

            {/* Category Description at Bottom */}
            {config.header.descriptionPosition === 'bottom' && (
                <div className={styles.bottomDescription}>
                    {renderDescription()}
                </div>
            )}

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
                            {renderSidebarFilters()}
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
