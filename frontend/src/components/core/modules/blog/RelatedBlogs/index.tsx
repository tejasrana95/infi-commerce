'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
import api from '@/lib/api';
import styles from './index.module.scss';
import { FiClock, FiArrowRight } from 'react-icons/fi';

interface RelatedBlogsProps {
    config: {
        title?: string;
        numberOfPosts?: number;
        matchBy?: 'category' | 'tags' | 'both';
        layout?: 'grid' | 'carousel';
        showImage?: boolean;
        showExcerpt?: boolean;
        showDate?: boolean;
        showReadingTime?: boolean;
        currentPostId?: string;
        categoryIds?: string[];
        tags?: string[];
    };
}

export default function RelatedBlogs({ config }: RelatedBlogsProps) {
    const {
        title = 'Related Articles',
        numberOfPosts = 3,
        matchBy = 'category',
        layout = 'grid',
        showImage = true,
        showExcerpt = true,
        showDate = true,
        showReadingTime = true,
        currentPostId,
        categoryIds = [],
        tags = [],
    } = config;

    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Stabilize array dependencies to prevent infinite loops
    const categoryIdsKey = useMemo(() => JSON.stringify(categoryIds), [categoryIds]);
    const tagsKey = useMemo(() => JSON.stringify(tags), [tags]);

    useEffect(() => {
        const fetchRelatedPosts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('limit', numberOfPosts.toString());
                params.append('status', 'published');

                if (currentPostId) {
                    params.append('exclude', currentPostId);
                }

                // Parse back from stable keys
                const parsedCategoryIds = JSON.parse(categoryIdsKey) as string[];
                const parsedTags = JSON.parse(tagsKey) as string[];

                if (matchBy === 'category' || matchBy === 'both') {
                    if (parsedCategoryIds.length > 0) {
                        params.append('category', parsedCategoryIds[0]);
                    }
                }

                if (matchBy === 'tags' || matchBy === 'both') {
                    if (parsedTags.length > 0) {
                        params.append('tag', parsedTags[0]);
                    }
                }

                // Use api client which includes X-Store-ID header automatically
                const data = await api.get<{ success: boolean; data: any[] }>(`blog/posts?${params.toString()}`);

                if (data.data.length > 0) {
                    setPosts(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching related posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelatedPosts();
    }, [currentPostId, categoryIdsKey, tagsKey, matchBy, numberOfPosts]);

    if (loading) {
        return (
            <div className={styles.relatedBlogs}>
                <h2>{title}</h2>
                <div className={`${styles.grid} ${layout === 'carousel' ? styles.carousel : ''}`}>
                    {[...Array(numberOfPosts)].map((_, i) => (
                        <div key={i} className={styles.skeleton} />
                    ))}
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        return null;
    }

    return (
        <div className={styles.relatedBlogs}>
            <h2 className={styles.title}>{title}</h2>

            <div className={`${styles.grid} ${layout === 'carousel' ? styles.carousel : ''}`}>
                {posts.map((post) => (
                    <Link
                        key={post._id}
                        href={`/blog/${post.slug}`}
                        className={styles.card}
                    >
                        {showImage && post.featuredImage && (
                            <div className={styles.imageWrapper}>
                                <ImageWithDimensions
                                    src={post.featuredImage}
                                    alt={post.title}
                                    fill
                                    className={styles.image}
                                    aspectRatio="16x9"
                                    sizes="(max-width: 768px) 100vw, 33vw"
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
                                {showDate && post.publishedAt && (
                                    <span className={styles.date}>
                                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                )}
                                {showReadingTime && post.readingTime && (
                                    <span className={styles.readingTime}>
                                        <FiClock /> {post.readingTime} min
                                    </span>
                                )}
                            </div>

                            <div className={styles.readMore}>
                                Read More <FiArrowRight />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
