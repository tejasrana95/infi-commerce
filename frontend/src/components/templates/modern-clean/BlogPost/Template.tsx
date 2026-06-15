// Modern Clean BlogPost Template - Minimal, article-focused design
// Clean full-width layout with excellent readability

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ModuleRenderer from '@/components/core/layout/ModuleRenderer';
import SectionRenderer from '@/components/core/layout/SectionRenderer';
import { BlogPostTemplateProps } from '@/components/templates/core/BlogPost/types';
import styles from './BlogPost.module.scss';
import { FiClock, FiCalendar, FiArrowLeft, FiTwitter, FiFacebook, FiLinkedin, FiLink } from 'react-icons/fi';
import BlogPostLinkedProducts from './BlogPostLinkedProducts';

export default function ModernCleanBlogPostTemplate({
    post,
    config,
    templateId,
    layout,
}: BlogPostTemplateProps) {
    const sections = layout?.sections || [];

    // Custom module rendering function for layout sections
    const renderModule = (module: any) => {
        switch (module.type) {
            case 'blog-content':
                return renderContent();
            case 'author-card':
                return renderAuthorCard();
            default:
                return <ModuleRenderer key={module.id} module={module} />;
        }
    };

    // Render section with custom module handling
    const renderSection = (section: any) => {
        return (
            <SectionRenderer
                key={section.id}
                section={section}
                renderModule={(module) => renderModule(module)}
            />
        );
    };

    // Copy link to clipboard
    const copyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    // Share URLs
    const shareUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
    const shareTitle = encodeURIComponent(post.title);

    // Content section
    const renderContent = () => (
        <article className={styles.article} key={post._id}>
            <div
                className={`${styles.content} rte-description-content`}
                dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {config.showTags && post.tags && post.tags.length > 0 && (
                <div className={styles.tagsSection}>
                    <div className={styles.tagsList}>
                        {post.tags.map((tag) => (
                            <Link key={tag} href={`/blog?tag=${tag}`} className={styles.tag}>
                                #{tag}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </article>
    );

    // Author card section
    const renderAuthorCard = () => {
        if (!config.showAuthorCard) return null;

        return (
            <div className={styles.authorSection}>
                <div className={styles.authorCard}>
                    {post.author?.avatar && (
                        <Image
                            src={post.author.avatar}
                            alt={post.author?.name || 'Author'}
                            width={72}
                            height={72}
                            className={styles.authorAvatar}
                        />
                    )}
                    <div className={styles.authorInfo}>
                        <span className={styles.writtenBy}>Written by</span>
                        <h3 className={styles.authorName}>{post.author?.name || 'Anonymous'}</h3>
                        {post.author?.bio && (
                            <p className={styles.authorBio}>{post.author.bio}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.blogPost}>
            {/* Back Navigation */}
            <div className={styles.topBar}>
                <div className={styles.topBarContainer}>
                    <Link href="/blog" className={styles.backLink}>
                        <FiArrowLeft />
                        <span>All Articles</span>
                    </Link>
                </div>
            </div>

            {/* Hero Header */}
            <header className={styles.header}>
                <div className={styles.headerContainer}>
                    {/* Categories */}
                    {post.categoryIds && post.categoryIds.length > 0 && (
                        <div className={styles.categories}>
                            {post.categoryIds.map((cat) => (
                                <Link key={cat._id} href={`/blog?category=${cat.slug}`} className={styles.categoryLink}>
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <h1 className={styles.title}>{post.title}</h1>

                    {/* Excerpt */}
                    {post.excerpt && (
                        <p className={styles.excerpt}>{post.excerpt}</p>
                    )}

                    {/* Meta Info */}
                    <div className={styles.meta}>
                        <div className={styles.authorMeta}>
                            {post.author?.avatar && (
                                <Image
                                    src={post.author.avatar}
                                    alt={post.author?.name || 'Author'}
                                    width={40}
                                    height={40}
                                    className={styles.metaAvatar}
                                />
                            )}
                            <div className={styles.metaInfo}>
                                <span className={styles.metaAuthor}>{post.author?.name || 'Anonymous'}</span>
                                <div className={styles.metaDetails}>
                                    <span>
                                        <FiCalendar />
                                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                    {post.readingTime && (
                                        <span>
                                            <FiClock />
                                            {post.readingTime} min read
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Share Buttons */}
                        {config.showShareButtons && (
                            <div className={styles.shareButtons}>
                                <a
                                    href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.shareBtn}
                                    aria-label="Share on Twitter"
                                >
                                    <FiTwitter />
                                </a>
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.shareBtn}
                                    aria-label="Share on Facebook"
                                >
                                    <FiFacebook />
                                </a>
                                <a
                                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareTitle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.shareBtn}
                                    aria-label="Share on LinkedIn"
                                >
                                    <FiLinkedin />
                                </a>
                                <button
                                    onClick={copyLink}
                                    className={styles.shareBtn}
                                    aria-label="Copy link"
                                >
                                    <FiLink />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Featured Image */}
            {config.showFeaturedImage && post.featuredImage && (
                <div className={styles.featuredImageWrapper}>
                    <div className={styles.featuredImage}>
                        <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            priority
                            className={styles.image}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            {sections.length > 0 ? (
                sections.map((section: any) => renderSection(section))
            ) : (
                <div className={styles.contentWrapper}>
                    <div className={styles.contentContainer}>
                        {renderContent()}
                        {renderAuthorCard()}
                    </div>
                </div>
            )}

            {/* Linked Products Section */}
            {post.linkedProductsConfig?.enabled && post.linkedProducts && post.linkedProducts.length > 0 && (
                <BlogPostLinkedProducts
                    products={post.linkedProducts}
                    config={post.linkedProductsConfig}
                />
            )}
        </div>
    );
}
