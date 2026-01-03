'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
import api from '@/lib/api';
import styles from './index.module.scss';
import { FiTrendingUp, FiEye, FiHeart } from 'react-icons/fi';

import { ModuleProps } from '../..';

export default function PopularPosts({ config, initialData }: ModuleProps) {
    const {
        title = 'Popular Posts',
        numberOfPosts = 5,
        metric = 'views',
        timePeriod = 'month',
        showThumbnail = true,
        showRanking = true,
        showStats = true,
    } = config;

    const [posts, setPosts] = useState<any[]>(initialData || []);
    const [loading, setLoading] = useState(!initialData);

    // Stabilize dependencies
    const configKey = useMemo(() =>
        JSON.stringify({ metric, timePeriod, numberOfPosts }),
        [metric, timePeriod, numberOfPosts]
    );

    useEffect(() => {
        if (initialData) return;

        const fetchPopularPosts = async () => {
            setLoading(true);
            try {
                // Use api client which includes X-Store-ID header automatically
                const data = await api.get<{ success: boolean; data: any[] }>(
                    `blog/posts?limit=${numberOfPosts}&status=published&sortBy=${metric}&period=${timePeriod}`
                );

                if (data.data.length > 0) {
                    setPosts(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching popular posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPopularPosts();
    }, [configKey, initialData]);

    const getIcon = () => {
        switch (metric) {
            case 'views': return <FiEye />;
            case 'likes': return <FiHeart />;
            default: return <FiTrendingUp />;
        }
    };

    if (loading) {
        return (
            <div className={styles.popularPosts}>
                <h3 className={styles.title}>
                    {getIcon()} {title}
                </h3>
                <div className={styles.list}>
                    {[...Array(numberOfPosts)].map((_, i) => (
                        <div key={i} className={styles.skeleton} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.popularPosts}>
            <h3 className={styles.title}>
                {getIcon()} {title}
            </h3>

            <div className={styles.list}>
                {posts.map((post, index) => (
                    <Link key={post._id} href={`/blog/${post.slug}`} className={styles.item}>
                        {showRanking && (
                            <span className={`${styles.rank} ${index < 3 ? styles.top : ''}`}>
                                {index + 1}
                            </span>
                        )}

                        {showThumbnail && post.featuredImage && (
                            <div className={styles.thumbnail}>
                                <ImageWithDimensions
                                    src={post.featuredImage}
                                    alt={post.title}
                                    fill
                                    className={styles.image}
                                    aspectRatio="1x1"
                                    sizes="64px"
                                />
                            </div>
                        )}

                        <div className={styles.content}>
                            <h4 className={styles.postTitle}>{post.title}</h4>

                            {showStats && (
                                <div className={styles.stats}>
                                    {metric === 'views' && (
                                        <span><FiEye /> {post.viewCount}</span>
                                    )}
                                    {metric === 'likes' && (
                                        <span><FiHeart /> {post.likeCount}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
