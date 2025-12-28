// Modern Clean BlogListing Template - Premium presentation layer
// Features: Layout section rendering with ModuleRenderer/SectionRenderer like CategoryPage

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ModuleRenderer from '@/components/core/layout/ModuleRenderer';
import SectionRenderer from '@/components/core/layout/SectionRenderer';
import { BlogListingTemplateProps } from '@/components/templates/core/BlogListing/types';
import styles from './BlogListing.module.scss';
import { FiGrid, FiList, FiSearch, FiClock, FiEye, FiHeart, FiX } from 'react-icons/fi';

export default function ModernCleanBlogListingTemplate({
    posts,
    categories,
    tags,
    isLoading,
    pagination,
    currentPage,
    selectedCategory,
    selectedTag,
    searchQuery,
    viewMode,
    config,
    templateId,
    layout,
    onPageChange,
    onCategoryFilter,
    onTagFilter,
    onSearch,
    onViewModeChange,
    onClearFilters,
}: BlogListingTemplateProps) {
    const [searchInput, setSearchInput] = useState(searchQuery || '');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchInput);
    };

    const hasActiveFilters = selectedCategory || selectedTag || searchQuery;
    const sections = layout?.sections || [];
    // Custom module rendering function for layout sections
    const renderModule = (module: any) => {
        // Handle special blog-specific modules
        switch (module.type) {
            case 'blog-posts-grid':
                return renderPostsGrid();
            case 'blog-sidebar':
                return renderSidebar();
            case 'blog-hero':
                return renderHero();
            default:
                // Use standard ModuleRenderer for other modules
                return <ModuleRenderer key={module.id} module={module} />;
        }
    };

    // Render section with custom module handling
    const renderSection = (section: any) => {
        // Handle special blog-layout sections
        if (section.type === 'blog-main') {
            return (
                <div key={section.id} className={styles.container}>
                    <div className={styles.layout}>
                        {config.sidebar.position === 'left' && renderSidebar()}
                        <main className={styles.main}>
                            {renderToolbar()}
                            {renderPostsGrid()}
                            {renderPagination()}
                        </main>
                        {config.sidebar.position === 'right' && renderSidebar()}
                    </div>
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

    // Hero section
    const renderHero = () => (
        <div className={styles.hero}>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>{config.header.title}</h1>
                {config.header.subtitle && (
                    <p className={styles.heroSubtitle}>{config.header.subtitle}</p>
                )}

                {config.sidebar.showSearch && (
                    <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
                        <div className={styles.searchInput}>
                            <FiSearch className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    className={styles.clearSearch}
                                    onClick={() => {
                                        setSearchInput('');
                                        onSearch('');
                                    }}
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>
                        <button type="submit" className={styles.searchButton}>
                            Search
                        </button>
                    </form>
                )}
            </div>
        </div>
    );

    // Sidebar with categories and tags
    const renderSidebar = () => (
        <aside className={styles.sidebar}>
            {config.sidebar.showCategories && (
                <div className={styles.sidebarSection}>
                    <h3 className={styles.sidebarTitle}>Categories</h3>
                    <ul className={styles.categoryList}>
                        <li>
                            <button
                                className={`${styles.categoryItem} ${!selectedCategory ? styles.active : ''}`}
                                onClick={() => onCategoryFilter('')}
                            >
                                <span>All Posts</span>
                                <span className={styles.count}>{pagination.total}</span>
                            </button>
                        </li>
                        {categories.map((category) => (
                            <li key={category._id}>
                                <button
                                    className={`${styles.categoryItem} ${selectedCategory === category.slug ? styles.active : ''}`}
                                    onClick={() => onCategoryFilter(category.slug)}
                                >
                                    <span>{category.name}</span>
                                    <span className={styles.count}>{category.postCount}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {config.sidebar.showTags && tags.length > 0 && (
                <div className={styles.sidebarSection}>
                    <h3 className={styles.sidebarTitle}>Popular Tags</h3>
                    <div className={styles.tagCloud}>
                        {tags.slice(0, 20).map((tag) => (
                            <button
                                key={tag}
                                className={`${styles.tag} ${selectedTag === tag ? styles.active : ''}`}
                                onClick={() => onTagFilter(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );

    // Toolbar with filters and view toggle
    const renderToolbar = () => (
        <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
                {hasActiveFilters && (
                    <div className={styles.activeFilters}>
                        {selectedCategory && (
                            <span className={styles.filterBadge}>
                                Category: {categories.find(c => c.slug === selectedCategory)?.name}
                                <button onClick={() => onCategoryFilter('')}>
                                    <FiX />
                                </button>
                            </span>
                        )}
                        {selectedTag && (
                            <span className={styles.filterBadge}>
                                Tag: {selectedTag}
                                <button onClick={() => onTagFilter('')}>
                                    <FiX />
                                </button>
                            </span>
                        )}
                        {searchQuery && (
                            <span className={styles.filterBadge}>
                                Search: "{searchQuery}"
                                <button onClick={() => onSearch('')}>
                                    <FiX />
                                </button>
                            </span>
                        )}
                        <button className={styles.clearAll} onClick={onClearFilters}>
                            Clear all
                        </button>
                    </div>
                )}
                <p className={styles.resultCount}>
                    {isLoading ? 'Loading...' : `${posts.length} articles found`}
                </p>
            </div>

            <div className={styles.viewToggle}>
                <button
                    className={viewMode === 'grid' ? styles.active : ''}
                    onClick={() => onViewModeChange('grid')}
                    aria-label="Grid view"
                >
                    <FiGrid />
                </button>
                <button
                    className={viewMode === 'list' ? styles.active : ''}
                    onClick={() => onViewModeChange('list')}
                    aria-label="List view"
                >
                    <FiList />
                </button>
            </div>
        </div>
    );

    // Posts grid/list
    const renderPostsGrid = () => {
        if (isLoading) {
            return (
                <div className={styles.skeleton}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={styles.skeletonCard} />
                    ))}
                </div>
            );
        }

        if (posts.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <h3>No articles found</h3>
                    <p>Try adjusting your filters or search query</p>
                    {hasActiveFilters && (
                        <button onClick={onClearFilters} className={styles.clearButton}>
                            Clear filters
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className={`${styles.postsGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
                {posts.map((post) => (
                    <article key={post._id} className={styles.postCard}>
                        {post.isFeatured && (
                            <span className={styles.featuredBadge}>Featured</span>
                        )}

                        {post.featuredImage && (
                            <Link href={`/blog/${post.slug}`} className={styles.imageLink}>
                                <div className={styles.imageWrapper}>
                                    <Image
                                        src={post.featuredImage}
                                        alt={post.title}
                                        fill
                                        className={styles.image}
                                    />
                                </div>
                            </Link>
                        )}

                        <div className={styles.cardContent}>
                            {post.categoryIds.length > 0 && (
                                <Link
                                    href={`/blog?category=${post.categoryIds[0].slug}`}
                                    className={styles.category}
                                >
                                    {post.categoryIds[0].name}
                                </Link>
                            )}

                            <Link href={`/blog/${post.slug}`}>
                                <h2 className={styles.title}>{post.title}</h2>
                            </Link>

                            {post.excerpt && (
                                <p className={styles.excerpt}>{post.excerpt}</p>
                            )}

                            <div className={styles.meta}>
                                <div className={styles.author}>
                                    {post.author.avatar && (
                                        <Image
                                            src={post.author.avatar}
                                            alt={post.author.name}
                                            width={32}
                                            height={32}
                                            className={styles.avatar}
                                        />
                                    )}
                                    <span>{post.author.name}</span>
                                </div>

                                <div className={styles.stats}>
                                    {post.readingTime && (
                                        <span className={styles.stat}>
                                            <FiClock /> {post.readingTime} min
                                        </span>
                                    )}
                                    <span className={styles.stat}>
                                        <FiEye /> {post.viewCount}
                                    </span>
                                    <span className={styles.stat}>
                                        <FiHeart /> {post.likeCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        );
    };

    // Pagination
    const renderPagination = () => {
        if (pagination.pages <= 1) return null;

        return (
            <div className={styles.pagination}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                >
                    Previous
                </button>

                <div className={styles.paginationNumbers}>
                    {[...Array(pagination.pages)].map((_, i) => {
                        const page = i + 1;
                        if (
                            page === 1 ||
                            page === pagination.pages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                            return (
                                <button
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    className={`${styles.pageNumber} ${page === currentPage ? styles.active : ''}`}
                                >
                                    {page}
                                </button>
                            );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className={styles.ellipsis}>...</span>;
                        }
                        return null;
                    })}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                    className={styles.paginationButton}
                >
                    Next
                </button>
            </div>
        );
    };

    return (
        <div className={styles.blogListing}>
            {/* Hero - Always rendered first */}
            {config.header.showBanner && renderHero()}

            {/* If layout sections exist, render them. Otherwise render default layout */}
            {sections.length > 0 ? (
                sections.map((section: any) => renderSection(section))
            ) : (
                <div className={styles.container}>
                    <div className={styles.layout}>
                        {config.sidebar.position === 'left' && renderSidebar()}
                        <main className={styles.main}>
                            {renderToolbar()}
                            {renderPostsGrid()}
                            {renderPagination()}
                        </main>
                        {config.sidebar.position === 'right' && renderSidebar()}
                    </div>
                </div>
            )}
        </div>
    );
}
