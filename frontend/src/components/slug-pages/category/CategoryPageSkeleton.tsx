'use client';

import React from 'react';
import styles from './CategoryPageSkeleton.module.scss';
import pageStyles from '../../templates/modern-clean/CategoryPage/CategoryPage.module.scss';

// Loading skeleton for Category Page
// Replicates the layout structure of CategoryPage/Template.tsx exactly for zero CLS

export default function CategoryPageSkeleton() {
    return (
        <div className={`${pageStyles.categoryPage} ${styles.categorySkeleton}`}>
            {/* Category Header Card */}
            <header className={pageStyles.header}>
                <div className={pageStyles.headerContainer}>
                    <div className={`${pageStyles.headerShell} ${styles.skeletonHeaderCard}`}>
                        <div className={pageStyles.headerTop}>
                            <nav className={pageStyles.breadcrumbs}>
                                <div className={styles.skeletonBreadcrumb} />
                            </nav>
                        </div>

                        <div className={pageStyles.headerGrid}>
                            <div className={pageStyles.categoryInfo}>
                                <div className={pageStyles.titleRow}>
                                    <div className={pageStyles.titleWrapper}>
                                        <div className={styles.skeletonTitle} />
                                    </div>
                                </div>

                                <div className={pageStyles.headerMeta}>
                                    <div className={styles.skeletonBadge} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Section: Sidebar & Product Grid */}
            <div className={`${pageStyles.content} ${pageStyles.withSidebar}`}>
                {/* Sidebar - Hidden on mobile via pageStyles.sidebar media queries */}
                <aside className={pageStyles.sidebar}>
                    <div className={pageStyles.sidebarInner}>
                        <div className={styles.skeletonFilterTitle} />
                        <div className={styles.skeletonFilterBlock}>
                            <div className={styles.skeletonFilterTitle} />
                            <div className={styles.skeletonFilterItem} />
                            <div className={styles.skeletonFilterItem} />
                            <div className={styles.skeletonFilterItem} />
                        </div>
                        <div className={styles.skeletonFilterBlock}>
                            <div className={styles.skeletonFilterTitle} />
                            <div className={styles.skeletonFilterItem} />
                            <div className={styles.skeletonFilterItem} />
                        </div>
                        <div className={styles.skeletonFilterBlock}>
                            <div className={styles.skeletonFilterTitle} />
                            <div className={styles.skeletonFilterItem} />
                            <div className={styles.skeletonFilterItem} />
                            <div className={styles.skeletonFilterItem} />
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className={pageStyles.main}>
                    {/* Mock Toolbar */}
                    <div className={pageStyles.toolbar}>
                        <div className={pageStyles.toolbarLeft}>
                            <div className={styles.skeletonToolbarBtn} />
                            <div className={styles.skeletonToolbarText} />
                        </div>
                        <div className={styles.skeletonToolbarBtn} />
                    </div>

                    {/* Product Grid */}
                    <div
                        className={pageStyles.productGrid}
                        style={{
                            '--cols-desktop': 3,
                            '--cols-tablet': 2,
                            '--cols-mobile': 2,
                        } as React.CSSProperties}
                    >
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={pageStyles.productItem}>
                                <div className={styles.skeletonCard}>
                                    <div className={styles.skeletonImage} />
                                    <div className={styles.skeletonText}>
                                        <div className={styles.skeletonLine} />
                                        <div className={`${styles.skeletonLine} ${styles.short}`} />
                                        <div className={`${styles.skeletonLine} ${styles.medium}`} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
