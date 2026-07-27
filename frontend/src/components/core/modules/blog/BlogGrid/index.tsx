'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
import api from '@/lib/api';
import styles from './index.module.scss';
import { FiClock, FiEye, FiGrid, FiList, FiMapPin } from 'react-icons/fi';

import { useStore } from '@/providers/StoreProvider';
import { ModuleProps } from '../..';

interface BlogGridPost {
    _id: string;
    slug: string;
    title: string;
    excerpt?: string;
    featuredImage?: string;
    isFeatured?: boolean;
    isPinned?: boolean;
    featured?: boolean;
    pinned?: boolean;
    publishedAt?: string;
    readingTime?: number;
    viewCount?: number;
    categoryIds?: Array<{ name?: string }>;
    author?: {
        name?: string;
        avatar?: string;
    };
}

function getPriority(post: BlogGridPost): number {
    const pinned = post.isPinned || post.pinned;
    const featured = post.isFeatured || post.featured;
    if (pinned) return 2;
    if (featured) return 1;
    return 0;
}

export default function BlogGrid({ config, initialData }: ModuleProps) {
    const searchParams = useSearchParams();
    const { store } = useStore();
    const authorAlias = (store?.theme as any)?.blog?.authorAlias?.trim();

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

    const urlCategory = searchParams.get('category');
    const urlTag = searchParams.get('tag');
    const urlSearch = searchParams.get('search');

    const activeCategory = urlCategory || filterByCategory;
    const activeTag = urlTag || filterByTag;
    const activeSearch = urlSearch;

    const [posts, setPosts] = useState<BlogGridPost[]>((initialData as BlogGridPost[]) || []);
    const [loading, setLoading] = useState(!initialData);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
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

                const data = await api.get<{ success: boolean; data: BlogGridPost[] }>(`blog/posts?${params.toString()}`);
                setPosts(data.data || []);
            } catch (error) {
                console.error('Error fetching posts:', error);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [initialData, urlCategory, urlTag, urlSearch, activeCategory, activeTag, activeSearch, numberOfPosts, showFeaturedOnly, sortBy]);

    const sortedPosts = useMemo(() => {
        return [...posts]
            .map((post, index) => ({ post, index }))
            .sort((a, b) => {
                const priorityDiff = getPriority(b.post) - getPriority(a.post);
                if (priorityDiff !== 0) return priorityDiff;

                const aDate = a.post.publishedAt ? new Date(a.post.publishedAt).getTime() : 0;
                const bDate = b.post.publishedAt ? new Date(b.post.publishedAt).getTime() : 0;
                if (aDate !== bDate) return bDate - aDate;

                return a.index - b.index;
            })
            .map((entry) => entry.post);
    }, [posts]);

    const displayTitle = useMemo(() => {
        if (activeSearch) return `Search: "${activeSearch}"`;
        if (activeTag) return `Tag: ${activeTag}`;
        return title;
    }, [title, activeSearch, activeTag]);

    if (loading) {
        return (
            <section className={styles.blogGrid}>
                <div className={styles.topBar}>
                    {displayTitle && <h2 className={styles.title}>{displayTitle}</h2>}
                </div>
                <div className={`${styles.grid} ${styles[`cols${columns}`]}`}>
                    {[...Array(numberOfPosts)].map((_, i) => (
                        <div key={i} className={styles.skeleton} />
                    ))}
                </div>
            </section>
        );
    }

    if (sortedPosts.length === 0) {
        return (
            <section className={styles.blogGrid}>
                <div className={styles.topBar}>
                    {displayTitle && <h2 className={styles.title}>{displayTitle}</h2>}
                </div>
                <p className={styles.empty}>No posts found</p>
            </section>
        );
    }

    return (
        <section className={styles.blogGrid}>
            {displayTitle && allowViewToggle && (
                <div className={styles.topBar}>
                    <div>
                        {displayTitle && (<><h2 className={styles.title}>{displayTitle}</h2>
                            <p className={styles.countLabel}>{sortedPosts.length} articles found</p></>)}
                    </div>

                    {allowViewToggle && (
                        <div className={styles.viewToggle}>
                            <button
                                className={viewMode === 'grid' ? styles.active : ''}
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                                type="button"
                            >
                                <FiGrid />
                            </button>
                            <button
                                className={viewMode === 'list' ? styles.active : ''}
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                                type="button"
                            >
                                <FiList />
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className={`${styles.grid} ${styles[`cols${columns}`]} ${viewMode === 'list' ? styles.listView : ''}`}>
                {sortedPosts.map((post) => {
                    const pinned = Boolean(post.isPinned || post.pinned);
                    const featured = Boolean(post.isFeatured || post.featured);

                    return (
                        <Link key={post._id} href={`/blog/${post.slug}`} className={styles.card}>
                            {showImage && post.featuredImage && (
                                <div className={styles.imageWrapper}>
                                    <ImageWithDimensions
                                        src={post.featuredImage}
                                        alt={post.title}
                                        fill
                                        aspectRatio="16x9"
                                        className={styles.image}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        priority={pinned || featured}
                                        fetchPriority={pinned || featured ? 'high' : 'auto'}
                                        loading={pinned || featured ? 'eager' : 'lazy'}
                                    />
                                </div>
                            )}

                            <div className={styles.content}>
                                {(post.categoryIds?.length ?? 0) > 0 && (
                                    <span className={styles.category}>{post.categoryIds?.[0]?.name || 'Category'}</span>
                                )}

                                <h3 className={styles.postTitle}>{post.title}</h3>

                                {showExcerpt && post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}

                                <div className={styles.meta}>
                                    {showAuthor && post.author && (
                                        <div className={styles.author}>
                                            {post.author.avatar && (
                                                <ImageWithDimensions
                                                    src={post.author.avatar}
                                                    alt={authorAlias || post.author.name || 'Author'}
                                                    width={24}
                                                    height={24}
                                                    className={styles.avatar}
                                                />
                                            )}
                                            <span>{authorAlias || post.author.name || 'Author'}</span>
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
                                                <FiEye /> {post.viewCount || 0}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
