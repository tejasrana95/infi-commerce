'use client';

import Link from 'next/link';
import styles from './index.module.scss';
import { FiSearch } from 'react-icons/fi';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BlogHeroProps {
    config: {
        title?: string;
        subtitle?: string;
        backgroundImage?: string;
        backgroundGradient?: string;
        showSearchBar?: boolean;
        ctaText?: string;
        ctaLink?: string;
        height?: 'small' | 'medium' | 'large';
    };
}

export default function BlogHero({ config }: BlogHeroProps) {
    const {
        title = 'Blog',
        subtitle = 'Discover insights, stories, and inspiration',
        backgroundImage,
        backgroundGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        showSearchBar = true,
        ctaText,
        ctaLink,
        height = 'medium',
    } = config;

    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/blog?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div
            className={`${styles.hero} ${styles[height]}`}
            style={{
                background: backgroundImage
                    ? `url(${backgroundImage})`
                    : backgroundGradient,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className={styles.overlay} />

            <div className={styles.content}>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.subtitle}>{subtitle}</p>

                {showSearchBar && (
                    <form className={styles.searchForm} onSubmit={handleSearch}>
                        <div className={styles.searchInput}>
                            <FiSearch className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button type="submit" className={styles.searchButton}>
                            Search
                        </button>
                    </form>
                )}

                {ctaText && ctaLink && (
                    <Link href={ctaLink} className={styles.cta}>
                        {ctaText}
                    </Link>
                )}
            </div>
        </div>
    );
}
