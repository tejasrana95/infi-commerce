'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './index.module.scss';
import api from '@/lib/api';

interface BlogCategoriesSidebarProps {
    config: {
        title?: string;
        displayStyle?: 'list' | 'cards' | 'pills';
        showPostCount?: boolean;
        showAllOption?: boolean;
        maxCategories?: number;
    };
}

export default function BlogCategoriesSidebar({ config }: BlogCategoriesSidebarProps) {
    const {
        title = 'Categories',
        displayStyle = 'list',
        showPostCount = true,
        showAllOption = true,
        maxCategories = 10,
    } = config;

    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get<{ success: boolean; data: any[] }>(
                `blog/categories`
            );
            if (res.data.length > 0) {
                const sorted = (res.data || [])
                    .sort((a: any, b: any) => b.postCount - a.postCount)
                    .slice(0, maxCategories);
                setCategories(sorted);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.sidebar}>
                <h3 className={styles.title}>{title}</h3>
                <div className={styles.skeleton}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={styles.skeletonItem} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.sidebar}>
            <h3 className={styles.title}>{title}</h3>

            <div className={`${styles.categories} ${styles[displayStyle]}`}>
                {showAllOption && (
                    <Link href="/blog" className={styles.categoryItem}>
                        <span className={styles.name}>All Posts</span>
                        {showPostCount && (
                            <span className={styles.count}>
                                {categories.reduce((sum, cat) => sum + cat.postCount, 0)}
                            </span>
                        )}
                    </Link>
                )}

                {categories.map((category) => (
                    <Link
                        key={category._id}
                        href={`/blog/?category=${category.slug}`}
                        className={styles.categoryItem}
                    >
                        <span className={styles.name}>{category.name}</span>
                        {showPostCount && (
                            <span className={styles.count}>{category.postCount}</span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}
