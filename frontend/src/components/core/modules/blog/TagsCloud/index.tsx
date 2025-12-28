'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import styles from './index.module.scss';

interface TagsCloudProps {
    config: {
        title?: string;
        maxTags?: number;
        sizeVariation?: boolean;
        colorScheme?: 'default' | 'gradient' | 'monochrome';
        layout?: 'cloud' | 'list';
    };
}

export default function TagsCloud({ config }: TagsCloudProps) {
    const {
        title = 'Popular Tags',
        maxTags = 20,
        sizeVariation = true,
        colorScheme = 'default',
        layout = 'cloud',
    } = config;

    const [tags, setTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTags = async () => {
            setLoading(true);
            try {
                // Use api client which includes X-Store-ID header automatically
                const data = await api.get<{ success: boolean; data: any[] }>(`blog/posts/tags?limit=${maxTags}`);

                if (data.data.length > 0) {
                    setTags((data.data || []).slice(0, maxTags));
                }
            } catch (error) {
                console.error('Error fetching tags:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
    }, [maxTags]);

    const getTagSize = (index: number) => {
        if (!sizeVariation) return 'medium';
        if (index < 3) return 'large';
        if (index < 8) return 'medium';
        return 'small';
    };

    if (loading) {
        return (
            <div className={styles.tagsCloud}>
                <h3 className={styles.title}>{title}</h3>
                <div className={styles.skeleton} />
            </div>
        );
    }

    return (
        <div className={styles.tagsCloud}>
            <h3 className={styles.title}>{title}</h3>

            <div className={`${styles.tags} ${styles[layout]} ${styles[colorScheme]}`}>
                {tags.map((tag, index) => (
                    <Link
                        key={tag}
                        href={`/blog?tag=${tag}`}
                        className={`${styles.tag} ${styles[getTagSize(index)]}`}
                    >
                        #{tag}
                    </Link>
                ))}
            </div>
        </div>
    );
}
