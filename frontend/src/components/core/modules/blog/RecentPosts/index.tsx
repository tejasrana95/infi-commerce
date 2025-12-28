'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import styles from './index.module.scss';
import { FiClock } from 'react-icons/fi';

interface RecentPostsProps {
    config: {
        title?: string;
        numberOfPosts?: number;
        showThumbnail?: boolean;
        showDate?: boolean;
        showExcerpt?: boolean;
        layout?: 'vertical' | 'horizontal';
    };
}

export default function RecentPosts({ config }: RecentPostsProps) {
    const {
        title = 'Recent Posts',
        numberOfPosts = 5,
        showThumbnail = true,
        showDate = true,
        showExcerpt = false,
        layout = 'vertical',
    } = config;

    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
    }, [numberOfPosts]);

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
                                <Image
                                    src={post.featuredImage}
                                    alt={post.title}
                                    fill
                                    className={styles.image}
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
