'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
import api from '@/lib/api';
import styles from './index.module.scss';
import { FiClock, FiEye, FiGrid, FiList } from 'react-icons/fi';

import { ModuleProps } from '../..';

export default function BlogGrid({ config, initialData }: ModuleProps) {
    const searchParams = useSearchParams();

    const {
        title = 'Latest Posts',
        numberOfPosts = 6,
        columns = 3,
        filterByCategory,
        filterByTag,
        sortBy = 'date',
        showFeaturedOnly = false,
        showImage = true,
        showExcerpt = true,
        showAuthor = true,
        showDate = true,
        showReadingTime = true,
        showViewCount = false,
        allowViewToggle = false,
    } = config;

    // URL params override config settings
    const urlCategory = searchParams.get('category');
    const urlTag = searchParams.get('tag');
    const urlSearch = searchParams.get('search');

    // Use URL params if available, fallback to config
    const activeCategory = urlCategory || filterByCategory;
    const activeTag = urlTag || filterByTag;
    const activeSearch = urlSearch;

    // Use initialData if provided (SSR)
    const [posts, setPosts] = useState<any[]>(initialData || []);
    const [loading, setLoading] = useState(!initialData);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Stabilize dependencies to prevent infinite loops - include URL params
    const configKey = useMemo(() =>
        JSON.stringify({
            activeCategory,
            activeTag,
            activeSearch,
            sortBy,
            showFeaturedOnly,
            numberOfPosts
        }),
        [activeCategory, activeTag, activeSearch, sortBy, showFeaturedOnly, numberOfPosts]
    );

    useEffect(() => {
        // Skip client-side fetch if we have initialData and no URL overrides are present
        // (If there are URL overrides like search, we should re-fetch)
        if (initialData && !urlCategory && !urlTag && !urlSearch) return;

        const fetchPosts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('limit', numberOfPosts.toString());
                params.append('status', 'published');

                if (activeCategory) params.append('category', activeCategory);
                if (activeTag) params.append('tag', activeTag);
                if (activeSearch) params.append('search', activeSearch);
                if (showFeaturedOnly) params.append('featured', 'true');
                if (sortBy) params.append('sortBy', sortBy);

                // Use api client which includes X-Store-ID header automatically
                const data = await api.get<{ success: boolean; data: any[] }>(`blog/posts?${params.toString()}`);
                setPosts(data.data || []);
            } catch (error) {
                console.error('Error fetching posts:', error);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [configKey, initialData, urlCategory, urlTag, urlSearch]);

    // Generate dynamic title based on active filters
    const displayTitle = useMemo(() => {
        if (activeSearch) return `Search: "${activeSearch}"`;
        if (activeTag) return `Tag: ${activeTag}`;
        // For category, we might want to show category name but we only have ID
        // Keep the configured title or default
        return title;
    }, [title, activeSearch, activeTag]);

    if (loading) {
        return (
            <div className={styles.blogGrid}>
                {displayTitle && <h2 className={styles.title}>{displayTitle}</h2>}
                <div className={`${styles.grid} ${styles[`cols${columns}`]}`}>
                    {[...Array(numberOfPosts)].map((_, i) => (
                        <div key={i} className={styles.skeleton} />
                    ))}
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className={styles.blogGrid}>
                {displayTitle && <h2 className={styles.title}>{displayTitle}</h2>}
                <p className={styles.empty}>No posts found</p>
            </div>
        );
    }

    return (
        <div className={styles.blogGrid}>
            <div className={styles.header}>
                {displayTitle && <h2 className={styles.title}>{displayTitle}</h2>}

                {allowViewToggle && (
                    <div className={styles.viewToggle}>
                        <button
                            className={viewMode === 'grid' ? styles.active : ''}
                            onClick={() => setViewMode('grid')}
                        >
                            <FiGrid />
                        </button>
                        <button
                            className={viewMode === 'list' ? styles.active : ''}
                            onClick={() => setViewMode('list')}
                        >
                            <FiList />
                        </button>
                    </div>
                )}
            </div>

            <div className={`${styles.grid} ${styles[`cols${columns}`]} ${viewMode === 'list' ? styles.listView : ''}`}>
                {posts.map((post) => (
                    <Link
                        key={post._id}
                        href={`/blog/${post.slug}`}
                        className={styles.card}
                    >
                        {post.isFeatured && (
                            <span className={styles.featuredBadge}>Featured</span>
                        )}

                        {showImage && post.featuredImage && (
                            <div className={styles.imageWrapper}>
                                <ImageWithDimensions
                                    src={post.featuredImage}
                                    alt={post.title}
                                    fill
                                    aspectRatio="16x9"
                                    className={styles.image}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                        )}

                        <div className={styles.content}>
                            {post.categoryIds?.length > 0 && (
                                <span className={styles.category}>
                                    {post.categoryIds[0].name}
                                </span>
                            )}

                            <h3 className={styles.postTitle}>{post.title}</h3>

                            {showExcerpt && post.excerpt && (
                                <p className={styles.excerpt}>{post.excerpt}</p>
                            )}

                            <div className={styles.meta}>
                                {showAuthor && post.author && (
                                    <div className={styles.author}>
                                        {post.author.avatar && (
                                            <ImageWithDimensions
                                                src={post.author.avatar}
                                                alt={post.author.name}
                                                width={24}
                                                height={24}
                                                className={styles.avatar}
                                            />
                                        )}
                                        <span>{post.author.name}</span>
                                    </div>
                                )}

                                <div className={styles.stats}>
                                    {showDate && post.publishedAt && (
                                        <span>
                                            {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    )}
                                    {showReadingTime && post.readingTime && (
                                        <span>
                                            <FiClock /> {post.readingTime} min
                                        </span>
                                    )}
                                    {showViewCount && (
                                        <span>
                                            <FiEye /> {post.viewCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
