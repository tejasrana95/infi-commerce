'use client';

import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
import Link from 'next/link';
import styles from './index.module.scss';
import { FiUser } from 'react-icons/fi';

interface AuthorCardProps {
    config: {
        authorId?: string;
        authorName?: string;
        authorAvatar?: string;
        authorBio?: string;
        authorSocial?: {
            twitter?: string;
            linkedin?: string;
            website?: string;
        };
        layout?: 'compact' | 'expanded';
        position?: 'top' | 'bottom' | 'sidebar';
        showPostCount?: boolean;
    };
}

export default function AuthorCard({ config }: AuthorCardProps) {
    const {
        authorName = 'Author Name',
        authorAvatar,
        authorBio = 'Author bio goes here',
        authorSocial = {},
        layout = 'expanded',
        position = 'bottom',
        showPostCount = false,
    } = config;

    return (
        <div className={`${styles.authorCard} ${styles[layout]} ${styles[position]}`}>
            <div className={styles.avatarWrapper}>
                {authorAvatar ? (
                    <ImageWithDimensions
                        src={authorAvatar}
                        alt={authorName}
                        width={layout === 'compact' ? 60 : 80}
                        height={layout === 'compact' ? 60 : 80}
                        className={styles.avatar}
                        aspectRatio="1x1"
                        sizes="(max-width: 768px) 60px, 80px"
                    />
                ) : (
                    <div className={styles.avatarPlaceholder}>
                        <FiUser />
                    </div>
                )}
            </div>

            <div className={styles.content}>
                <h3 className={styles.name}>{authorName}</h3>

                {layout === 'expanded' && authorBio && (
                    <p className={styles.bio}>{authorBio}</p>
                )}

                {showPostCount && (
                    <p className={styles.postCount}>12 articles published</p>
                )}

                {Object.keys(authorSocial).length > 0 && (
                    <div className={styles.social}>
                        {authorSocial.twitter && (
                            <a
                                href={authorSocial.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                            >
                                Twitter
                            </a>
                        )}
                        {authorSocial.linkedin && (
                            <a
                                href={authorSocial.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                            >
                                LinkedIn
                            </a>
                        )}
                        {authorSocial.website && (
                            <a
                                href={authorSocial.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                            >
                                Website
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
