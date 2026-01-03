'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
import api from '@/lib/api';
import styles from './index.module.scss';
import { FiClock } from 'react-icons/fi';

import { ModuleProps } from '../..';

export default function RecentPosts({ config, initialData }: ModuleProps) {
    const {
        title = 'Recent Posts',
        numberOfPosts = 5,
        showThumbnail = true,
        showDate = true,
        showExcerpt = false,
        layout = 'vertical',
    } = config;

    const [posts, setPosts] = useState<any[]>(initialData || []);
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        if (initialData) return;

        const fetchRecentPosts = async () => {
            setLoading(true);
            try {
                // Use api client which includes X-Store-ID header automatically
                const data = await api.get<{ success: boolean; data: any[] }>(
                    `blog/posts?limit=${numberOfPosts}&status=published&sortBy=date`
                );

                if (data.data.length > 0) {
                    setPosts(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching recent posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentPosts();
    }, [numberOfPosts, initialData]);

    if (loading) {
        return (
            <div className={styles.recentPosts}>
                <h3 className={styles.title}>{title}</h3>
                <div className={styles.list}>
                    {[...Array(numberOfPosts)].map((_, i) => (
                        <div key={i} className={styles.skeleton} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.recentPosts}>
            <h3 className={styles.title}>{title}</h3>

            <div className={`${styles.list} ${styles[layout]}`}>
                {posts.map((post) => (
                    <Link key={post._id} href={`/blog/${post.slug}`} className={styles.item}>
                        {showThumbnail && post.featuredImage && (
                            <div className={styles.thumbnail}>
                                <ImageWithDimensions
                                    src={post.featuredImage}
                                    alt={post.title}
                                    fill
                                    aspectRatio="1x1"
                                    className={styles.image}
                                    sizes="80px"
                                />
                            </div>
                        )}

                        <div className={styles.content}>
                            <h4 className={styles.postTitle}>{post.title}</h4>

                            {showExcerpt && post.excerpt && (
                                <p className={styles.excerpt}>{post.excerpt}</p>
                            )}

                            {showDate && post.publishedAt && (
                                <span className={styles.date}>
                                    <FiClock />
                                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
