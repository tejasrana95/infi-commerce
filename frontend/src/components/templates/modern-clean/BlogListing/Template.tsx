// Modern Clean BlogListing Template - Premium presentation layer
// Features: Layout section rendering with ModuleRenderer/SectionRenderer like CategoryPage

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ModuleRenderer from '@/components/core/layout/ModuleRenderer';
import SectionRenderer from '@/components/core/layout/SectionRenderer';
import { BlogListingTemplateProps } from '@/components/templates/core/BlogListing/types';
import styles from './BlogListing.module.scss';
import { FiGrid, FiList, FiSearch, FiClock, FiEye, FiHeart, FiX } from 'react-icons/fi';

interface LayoutModule {
    id: string;
    type?: string;
}

interface LayoutSection {
    id: string;
    type?: string;
}

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
    layout,
    onPageChange,
    onCategoryFilter,
    onTagFilter,
    onSearch,
    onViewModeChange,
    onClearFilters,
}: BlogListingTemplateProps) {
    const [searchInput, setSearchInput] = useState(searchQuery || '');

    // Build a lookup map for categories by _id and slug for hierarchy resolution
    const categoryLookup = useMemo(() => {
        const byId = new Map<string, typeof categories[0]>();
        const bySlug = new Map<string, typeof categories[0]>();
        for (const cat of categories) {
            byId.set(cat._id, cat);
            bySlug.set(cat.slug, cat);
        }
        return { byId, bySlug };
    }, [categories]);

    // Get the full hierarchy path for a category (e.g., "Parent → Child → Childmost")
    const getCategoryBreadcrumb = (cat: { _id: string; name: string; slug: string; path?: string; parentId?: string; level?: number }): { segments: string[]; childmost: typeof cat } => {
        const segments: string[] = [cat.name];
        let current = cat;

        // Walk up the parent chain to build the full hierarchy
        const visited = new Set<string>();
        while (current.parentId && !visited.has(current.parentId)) {
            visited.add(current.parentId);
            const parent = categoryLookup.byId.get(current.parentId);
            if (parent) {
                segments.unshift(parent.name);
                current = parent;
            } else {
                break;
            }
        }

        return { segments, childmost: cat };
    };
    const sortedPosts = useMemo(() => {
        return [...posts]
            .map((post, index) => ({ post, index }))
            .sort((a, b) => {
                const aPinned = a.post.isPinned ? 1 : 0;
                const bPinned = b.post.isPinned ? 1 : 0;
                if (aPinned !== bPinned) return bPinned - aPinned;

                const aFeatured = a.post.isFeatured ? 1 : 0;
                const bFeatured = b.post.isFeatured ? 1 : 0;
                if (aFeatured !== bFeatured) return bFeatured - aFeatured;

                const aDate = a.post.publishedAt ? new Date(a.post.publishedAt).getTime() : 0;
                const bDate = b.post.publishedAt ? new Date(b.post.publishedAt).getTime() : 0;
                if (aDate !== bDate) return bDate - aDate;

                return a.index - b.index;
            })
            .map(({ post }) => post);
    }, [posts]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchInput);
    };

    const hasActiveFilters = selectedCategory || selectedTag || searchQuery;
    const sections = layout?.sections || [];
    // Custom module rendering function for layout sections
    const renderModule = (module: LayoutModule) => {
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
                return <ModuleRenderer key={module.id} module={module as never} />;
        }
    };

    // Render section with custom module handling
    const renderSection = (section: LayoutSection) => {
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
                section={section as never}
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
                                Search: &quot;{searchQuery}&quot;
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
                    {isLoading ? 'Loading...' : `${sortedPosts.length} articles found`}
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

        if (sortedPosts.length === 0) {
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

        const leadPost = sortedPosts[0];
        const regularPosts = viewMode === 'grid' ? sortedPosts.slice(1) : sortedPosts;

        return (
            <>
                {viewMode === 'grid' && leadPost && (
                    <article className={`${styles.leadPostCard} ${!leadPost.featuredImage ? styles.noImage : ''}`}>
                        {leadPost.featuredImage && (
                            <div className={styles.leadImagePane}>
                                {(leadPost.isPinned || leadPost.isFeatured) && (
                                    <span className={styles.priorityBadge}>{leadPost.isPinned ? 'Pinned' : 'Featured'}</span>
                                )}
                                <Link href={`/blog/${leadPost.slug}`} className={styles.imageLink}>
                                    <div className={styles.imageWrapper}>
                                        <Image
                                            src={leadPost.featuredImage}
                                            alt={leadPost.title}
                                            fill
                                            className={styles.image}
                                        />
                                    </div>
                                </Link>

                            </div>
                        )}
                        <div className={styles.leadContent}>
                            {config.showCategories !== false && leadPost.categoryIds.length > 0 && (
                                (() => {
                                    const { segments, childmost } = getCategoryBreadcrumb(leadPost.categoryIds[0]);
                                    return (
                                        <Link
                                            href={`/blog?category=${childmost.slug}`}
                                            className={styles.category}
                                        >
                                            {segments.join(' → ')}
                                        </Link>
                                    );
                                })()
                            )}
                            <Link href={`/blog/${leadPost.slug}`}>
                                <h2 className={styles.leadTitle}>{leadPost.title}</h2>
                            </Link>
                            {leadPost.excerpt && (
                                <p className={styles.leadExcerpt}>{leadPost.excerpt}</p>
                            )}
                            <div className={styles.meta}>
                                {config.showAuthorName !== false && (
                                    <div className={styles.author}>
                                        {leadPost.author.avatar && (
                                            <Image
                                                src={leadPost.author.avatar}
                                                alt={config.authorAlias?.trim() || leadPost.author.name || 'Anonymous'}
                                                width={32}
                                                height={32}
                                                className={styles.avatar}
                                            />
                                        )}
                                        <span>{config.authorAlias?.trim() || leadPost.author.name || 'Anonymous'}</span>
                                    </div>
                                )}

                                <div className={styles.stats}>
                                    {config.showReadingTime !== false && leadPost.readingTime && (
                                        <span className={styles.stat}>
                                            <FiClock /> {leadPost.readingTime} min
                                        </span>
                                    )}
                                    {config.showViewCount !== false && (
                                        <span className={styles.stat}>
                                            <FiEye /> {leadPost.viewCount || 0}
                                        </span>
                                    )}
                                    {config.showFavorite !== false && (
                                        <span className={styles.stat}>
                                            <FiHeart /> {leadPost.likeCount || 0}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </article>
                )}

                <div className={`${styles.postsGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
                    {regularPosts.map((post) => (
                        <article key={post._id} className={`${styles.postCard} ${post.featuredImage ? '' : styles.noImage}`}>
                            {(post.isPinned || post.isFeatured) && (
                                <span className={styles.featuredBadge}>{post.isPinned ? 'Pinned' : 'Featured'}</span>
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
                                {config.showCategories !== false && post.categoryIds.length > 0 && (
                                    (() => {
                                        const { segments, childmost } = getCategoryBreadcrumb(post.categoryIds[0]);
                                        return (
                                            <Link
                                                href={`/blog?category=${childmost.slug}`}
                                                className={styles.category}
                                            >
                                                {segments.join(' → ')}
                                            </Link>
                                        );
                                    })()
                                )}

                                <Link href={`/blog/${post.slug}`}>
                                    <h2 className={styles.title}>{post.title}</h2>
                                </Link>

                                {post.excerpt && (
                                    <p className={styles.excerpt}>{post.excerpt}</p>
                                )}

                                <div className={styles.meta}>
                                    {config.showAuthorName !== false && (
                                        <div className={styles.author}>
                                            {post.author.avatar && (
                                                <Image
                                                    src={post.author.avatar}
                                                    alt={config.authorAlias?.trim() || post.author.name || 'Anonymous'}
                                                    width={32}
                                                    height={32}
                                                    className={styles.avatar}
                                                />
                                            )}
                                            <span>{config.authorAlias?.trim() || post.author.name || 'Anonymous'}</span>
                                        </div>
                                    )}

                                    <div className={styles.stats}>
                                        {config.showReadingTime !== false && post.readingTime && (
                                            <span className={styles.stat}>
                                                <FiClock /> {post.readingTime} min
                                            </span>
                                        )}
                                        {config.showViewCount !== false && (
                                            <span className={styles.stat}>
                                                <FiEye /> {post.viewCount || 0}
                                            </span>
                                        )}
                                        {config.showFavorite !== false && (
                                            <span className={styles.stat}>
                                                <FiHeart /> {post.likeCount || 0}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </>
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
                sections.map((section: LayoutSection) => renderSection(section))
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
