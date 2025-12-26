// Modern Clean SearchPage Template - Cloned from CategoryPage
// Features: Glassmorphism filter sidebar, animated product grid, modern UI
// Exact parity with CategoryPage configuration

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ModuleRenderer from '@/components/core/layout/ModuleRenderer';
import SectionRenderer from '@/components/core/layout/SectionRenderer';
import { SearchPageTemplateProps } from '@/components/templates/core/SearchPage/types';
import { getComponent } from '@/components/templates/registry';
import styles from './SearchPage.module.scss'; // Reuse SearchPage styles which should match CategoryPage
import CategoryFilters from '@/components/molecules/CategoryFilters';

export default function ModernCleanSearchPageTemplate({
    query,
    breadcrumbs,
    products,
    isLoading,
    totalProducts,
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
}: SearchPageTemplateProps) {
    // Config derived values
    const sections = useMemo(() => {
        return layout?.sections || [];
    }, [layout]);

    const hasFilters = config.filters?.enabled &&
        (config.filters.position === 'left' || config.filters.position === 'right');

    const showTopFilters = config.filters?.enabled && config.filters.position === 'top';

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

    // Get ProductCard component
    const ProductCard = getComponent('ProductCard', templateId);

    // Render sidebar filters
    const renderFilters = () => (
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
        />
    );

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

    // ============================================
    // Search Header (Specific to Search Page)
    // ============================================
    const renderSearchHeader = () => (
        <div className={styles.searchHeader}>
            <div className={styles.breadcrumb}>
                <Link href="/">Home</Link>
                <span>/</span>
                <span className={styles.current}>Search</span>
            </div>
            <div className={styles.searchMeta}>
                <h1 className={styles.searchTitle}>
                    {query ? `Search results for "${query}"` : 'Search Products'}
                </h1>
                <p className={styles.resultCount}>
                    {totalProducts} result{totalProducts !== 1 ? 's' : ''} found
                </p>
            </div>
        </div>
    );

    // ============================================
    // Product Grid & Pagination
    // ============================================
    const renderProductGrid = () => {
        const cols = config.grid?.productsPerRow || { desktop: 4, tablet: 3, mobile: 2 };
        return (
            <div className={styles.productsSection}>
                {isLoading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Searching parameters...</p>
                    </div>
                ) : products.length > 0 ? (
                    <>
                        <div
                            className={styles.productGrid}
                            style={{
                                '--cols-desktop': cols.desktop,
                                '--cols-tablet': cols.tablet,
                                '--cols-mobile': cols.mobile,
                            } as React.CSSProperties}
                        >
                            {products.map(product => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    cardConfig={{
                                        cardStyle: config.grid?.cardStyle || 'default'
                                    }}
                                />
                            ))}
                        </div>
                        {pagination.pages > 1 && config.pagination?.type !== 'infinite-scroll' && (
                            <div className={styles.pagination}>
                                <button
                                    className={styles.pageBtn}
                                    disabled={pagination.page <= 1}
                                    onClick={() => onPageChange(pagination.page - 1)}
                                >
                                    Previous
                                </button>
                                <div className={styles.pageInfo}>
                                    Page {pagination.page} of {pagination.pages}
                                </div>
                                <button
                                    className={styles.pageBtn}
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => onPageChange(pagination.page + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                        {config.pagination?.type === 'infinite-scroll' && pagination.page < pagination.pages && (
                            <div ref={loadMoreRef} className={styles.infiniteScrollTrigger}>
                                {isLoading && <div className={styles.spinner}></div>}
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <h3>No matching products found</h3>
                        <p>Try adjusting your search or filters.</p>
                        <button className={styles.clearFiltersBtn} onClick={onClearAllFilters}>
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderSortingBar = () => (
        <div className={styles.sortingBar}>
            <div className={styles.sortLeft}>
                <button
                    className={styles.filterToggle}
                    onClick={() => onOpenFilterDrawer()}
                >
                    Filters
                    {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
                </button>
            </div>
            <div className={styles.sortRight}>
                <span className={styles.sortLabel}>Sort by:</span>
                <select
                    value={currentSort}
                    onChange={(e) => onSortChange(e.target.value)}
                    className={styles.sortSelect}
                >
                    {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );

    // ============================================
    // Layout Rendering (Section based)
    // ============================================
    const renderModule = (module: any) => {
        if (!module) return null;
        switch (module.type) {
            case 'search-header':
                return <React.Fragment key={module.id}>{renderSearchHeader()}</React.Fragment>;
            case 'search-results':
                return (
                    <React.Fragment key={module.id}>
                        {renderSortingBar()}
                        {renderProductGrid()}
                    </React.Fragment>
                );
            case 'search-filters':
                return <React.Fragment key={module.id}>{renderFilters()}</React.Fragment>;
            default:
                return <ModuleRenderer key={module.id} module={module} />;
        }
    };

    // ============================================
    // Section Rendering Helper
    // Uses SectionRenderer for generic sections, special handling for search content
    // ============================================
    const renderSection = (section: any) => {
        // Check if this section has split columns with filters + results
        const isSplitSection = section.type?.startsWith('split-') && section.columns?.length > 0;
        const hasFiltersColumn = section.columns?.some((col: any) =>
            col.modules?.some((m: any) => m.type === 'search-filters')
        );
        const hasResultsColumn = section.columns?.some((col: any) =>
            col.modules?.some((m: any) => m.type === 'search-results')
        );
        const isSearchContentSection = hasFiltersColumn && hasResultsColumn;

        // Special handling for main search content section (filters sidebar + results)
        if (isSplitSection && isSearchContentSection) {
            const sectionStyle = {
                paddingTop: section.settings?.paddingTop || 0,
                paddingBottom: section.settings?.paddingBottom || 0,
                backgroundImage: section.settings?.backgroundImage ? `url(${section.settings.backgroundImage})` : undefined,
                backgroundSize: section.settings?.backgroundSize || 'cover',
                backgroundPosition: section.settings?.backgroundPosition || 'center',
            };

            return (
                <div
                    key={section.id}
                    className={`${styles.content} ${hasFilters ? styles.withSidebar : ''} ${config.filters?.position === 'right' ? styles.sidebarRight : ''}`}
                    style={sectionStyle}
                >
                    {section.columns.map((column: any) => {
                        const isFilterColumn = column.modules?.some((m: any) => m.type === 'search-filters');
                        const isResultColumn = column.modules?.some((m: any) => m.type === 'search-results');

                        if (isFilterColumn && hasFilters) {
                            return (
                                <aside
                                    key={column.id}
                                    className={styles.sidebar}
                                    style={{ '--sidebar-width': `${config.filters?.sidebarWidth || 280}px` } as React.CSSProperties}
                                >
                                    <div className={`${styles.sidebarInner} ${config.filters?.style === 'sticky' ? styles.sticky : ''}`}>
                                        {column.modules?.map((module: any) => renderModule(module))}
                                    </div>
                                </aside>
                            );
                        }

                        if (isResultColumn) {
                            return (
                                <main key={column.id} className={styles.main}>
                                    {showTopFilters && renderHorizontalFilters()}
                                    {column.modules?.map((module: any) => renderModule(module))}
                                </main>
                            );
                        }

                        // Generic column
                        const widthPercent = (column.width / 12) * 100;
                        return (
                            <div key={column.id} style={{ width: `${widthPercent}%` }}>
                                {column.modules?.map((module: any) => renderModule(module))}
                            </div>
                        );
                    })}
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

    if (sections.length > 0) {
        return (
            <div className={styles.searchPage}>
                {isFilterDrawerOpen && (
                    <div className={styles.filterDrawer}>
                        <div className={styles.drawerBackdrop} onClick={onCloseFilterDrawer} />
                        <div
                            className={`${styles.mobileFilters} ${config.filters?.offCanvas?.slideFrom === 'right' ? styles.fromRight : styles.fromLeft}`}
                            style={{ '--drawer-width': `${config.filters?.offCanvas?.drawerWidth || 320}px` } as React.CSSProperties}
                        >
                            <div className={styles.mobileFiltersHeader}>
                                <h3>Filters</h3>
                                <button onClick={onCloseFilterDrawer}>×</button>
                            </div>
                            <div className={styles.drawerBody}>
                                {renderFilters()}
                            </div>
                        </div>
                    </div>
                )}
                {sections.map((section: any) => renderSection(section))}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {renderSearchHeader()}
            <div className={styles.content}>
                <div className={styles.main}>
                    {renderSortingBar()}
                    {renderProductGrid()}
                </div>
            </div>
        </div>
    );
}
